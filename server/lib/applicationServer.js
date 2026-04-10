const path = require("path");
const { execFile, spawn } = require("child_process");
const { normalizeComposeArgs } = require("./composeFileArgs");
const { computeLegacyAppDefaultMongoUriFromSettings } = require("./persistedSettingsHelpers");
const {
  getApplicationServerSettings,
  WRITE_CONCERN_MAJORITY,
  VALID_READ_CONCERNS,
  DEFAULT_READ_CONCERN,
  VALID_READ_PREFERENCES,
  DEFAULT_READ_PREFERENCE
} = require("./applicationServerLocation");
const {
  getActiveApplicationServerServiceName,
  listApplicationServerServiceNames,
  applicationServerServiceNameForDataCenterId
} = require("./applicationServerNaming");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const MAX_LOG_LINES = 400;
/** @deprecated Legacy compose service name; use getActiveApplicationServerServiceName(settings). */
const APPLICATION_SERVER_SERVICE = "ApplicationServer";
const CONFIG_SERVER_CONTAINER_NAME = "ConfigServer";
const USER_LOCATION_CODE_PATTERN = /^[A-Z]{2}$/;
const RUNTIME_MONGO_SETTINGS_PATH = "/tmp/failover-monitor-mongo-settings.json";
const RUNTIME_TOPOLOGY_SIGNAL_PATH = "/tmp/failover-monitor-workload-topology-change.json";

let appProcess = null;
let stdoutRemainder = "";
let stderrRemainder = "";

const listeners = new Set();
const logLines = [];
const metrics = {
  lastIncrementedAt: null,
  lastCurrentValueAt: null,
  lastCurrentValue: null,
  readByTarget: {}
};

function parseLineTimestamp(line, fallbackIso) {
  const match = line.match(/^\[([^\]]+)\]/);
  if (!match) {
    return fallbackIso;
  }
  const parsed = new Date(match[1]);
  return Number.isNaN(parsed.getTime()) ? fallbackIso : parsed.toISOString();
}

function updateMetricsFromLine(line, timestampIso) {
  if (line.includes("Incremented")) {
    metrics.lastIncrementedAt = timestampIso;
  }

  const targetValueMatch = line.match(/\[READ:([^\]]+)\]\s+Current value:\s*([0-9]+)/i);
  if (targetValueMatch) {
    const targetName = String(targetValueMatch[1] || "").trim();
    const value = Number(targetValueMatch[2]);
    if (targetName) {
      metrics.readByTarget[targetName] = {
        value,
        at: timestampIso
      };
      if (targetName.toLowerCase() === "mongos") {
        metrics.lastCurrentValueAt = timestampIso;
        metrics.lastCurrentValue = Number.isFinite(value) ? value : null;
      }
    }
  }
}

function cloneReadByTarget() {
  const output = {};
  for (const [targetName, targetMetrics] of Object.entries(metrics.readByTarget || {})) {
    const value = Number(targetMetrics?.value);
    output[targetName] = {
      value: Number.isFinite(value) ? value : null,
      at: targetMetrics?.at || null
    };
  }
  return output;
}

function buildSnapshot() {
  return {
    running: Boolean(appProcess),
    logs: [...logLines],
    metrics: {
      ...metrics,
      readByTarget: cloneReadByTarget()
    }
  };
}

function notifyListeners(event, data) {
  for (const listener of listeners) {
    listener(event, data);
  }
}

function processLogLine(line, source) {
  const cleaned = String(line || "").trim();
  if (!cleaned) {
    return;
  }

  const receivedAt = new Date().toISOString();
  const lineTimestamp = parseLineTimestamp(cleaned, receivedAt);
  updateMetricsFromLine(cleaned, lineTimestamp);

  const entry = {
    source,
    line: cleaned,
    receivedAt
  };
  logLines.push(entry);
  if (logLines.length > MAX_LOG_LINES) {
    logLines.shift();
  }

  notifyListeners("log", {
    entry,
    metrics: {
      ...metrics,
      readByTarget: cloneReadByTarget()
    },
    running: Boolean(appProcess)
  });
}

function processChunk(chunk, source) {
  const text = chunk.toString();
  let combined;
  if (source === "stderr") {
    combined = stderrRemainder + text;
  } else {
    combined = stdoutRemainder + text;
  }

  const parts = combined.split(/\r?\n/);
  const remainder = parts.pop() || "";
  for (const line of parts) {
    processLogLine(line, source);
  }

  if (source === "stderr") {
    stderrRemainder = remainder;
  } else {
    stdoutRemainder = remainder;
  }
}

function flushRemainder() {
  if (stdoutRemainder) {
    processLogLine(stdoutRemainder, "stdout");
    stdoutRemainder = "";
  }
  if (stderrRemainder) {
    processLogLine(stderrRemainder, "stderr");
    stderrRemainder = "";
  }
}

function runCompose(args, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    execFile(
      "docker",
      ["compose", ...normalizeComposeArgs(PROJECT_ROOT, args)],
      {
        cwd: PROJECT_ROOT,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 2
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `docker compose ${args.join(" ")} failed: ${stderr || error.message}`.trim()
            )
          );
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

/** Resolves the active ApplicationServer compose service from persisted settings (never use partial/mongo-only settings objects here). */
async function getApplicationServerWorkloadTargetService() {
  const settings = await getApplicationServerSettings();
  return getActiveApplicationServerServiceName(settings) || APPLICATION_SERVER_SERVICE;
}

function runDocker(args, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    execFile(
      "docker",
      args,
      {
        cwd: PROJECT_ROOT,
        timeout: timeoutMs,
        maxBuffer: 1024 * 1024 * 2
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`docker ${args.join(" ")} failed: ${stderr || error.message}`.trim()));
          return;
        }
        resolve({ stdout, stderr });
      }
    );
  });
}

function normalizeWriteConcern(value) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 ? value : WRITE_CONCERN_MAJORITY;
  }
  const raw = String(value || "").trim().toLowerCase();
  if (raw === WRITE_CONCERN_MAJORITY) {
    return WRITE_CONCERN_MAJORITY;
  }
  if (!/^\d+$/.test(raw)) {
    return WRITE_CONCERN_MAJORITY;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : WRITE_CONCERN_MAJORITY;
}

function normalizeReadConcern(value) {
  const normalized = String(value || "").trim();
  return VALID_READ_CONCERNS.includes(normalized) ? normalized : DEFAULT_READ_CONCERN;
}

function normalizeReadPreference(value) {
  const normalized = String(value || "").trim();
  return VALID_READ_PREFERENCES.includes(normalized) ? normalized : DEFAULT_READ_PREFERENCE;
}

function buildRuntimeMongoSettings(settings) {
  return {
    writeConcern: normalizeWriteConcern(settings?.writeConcern),
    readConcern: normalizeReadConcern(settings?.readConcern),
    readPreference: normalizeReadPreference(settings?.readPreference)
  };
}

async function isComposeServiceRunning(serviceName) {
  const { stdout } = await runCompose(["ps", "--status", "running", "--services"], 10000);
  const runningServices = String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return runningServices.includes(serviceName);
}

async function applyApplicationServerRuntimeMongoSettings(settings, options = {}) {
  const skipWhenServiceNotRunning = options.skipWhenServiceNotRunning !== false;
  const targetService = await getApplicationServerWorkloadTargetService();
  if (skipWhenServiceNotRunning) {
    const serviceRunning = await isComposeServiceRunning(targetService);
    if (!serviceRunning) {
      return { applied: false, skipped: true, reason: "ApplicationServer service is not running." };
    }
  }
  const payload = `${JSON.stringify(buildRuntimeMongoSettings(settings))}\n`;
  await runCompose(
    [
      "exec",
      "-T",
      targetService,
      "bash",
      "-lc",
      `cat > ${RUNTIME_MONGO_SETTINGS_PATH} <<'EOF'
${payload.trim()}
EOF`
    ],
    10000
  );
  return { applied: true, skipped: false };
}

function parseJsonPayload(stdout, label) {
  const lines = String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (!line.startsWith("{") && !line.startsWith("[")) {
      continue;
    }
    try {
      return JSON.parse(line);
    } catch (_error) {
      // Try next line.
    }
  }
  throw new Error(`Unable to parse ${label} JSON payload.`);
}

function buildReplicaSetUri(hosts, replicaSetName) {
  return `mongodb://${hosts.join(",")}/?authSource=admin&replicaSet=${encodeURIComponent(replicaSetName)}`;
}

async function resolveMongosRouterDockerName() {
  return getApplicationServerWorkloadTargetService();
}

async function resolveMongosRouterMongoUri() {
  const host = await resolveMongosRouterDockerName();
  return `mongodb://${host}:27017/?authSource=admin`;
}

async function isPersistedTopologySharded() {
  try {
    const settings = await getApplicationServerSettings();
    return Boolean(settings?.templateTopology?.sharded);
  } catch (_error) {
    return false;
  }
}

async function doesConfigServerExist() {
  const containerName = await resolveMongosRouterDockerName();
  try {
    await runDocker(["container", "inspect", containerName], 8000);
    return true;
  } catch (error) {
    const message = String(error.message || "").toLowerCase();
    if (message.includes("no such container") || message.includes("not found")) {
      return false;
    }
    throw error;
  }
}

async function listShardsFromConfigServer() {
  const router = await resolveMongosRouterDockerName();
  const { stdout } = await runDocker(
    [
      "exec",
      router,
      "mongosh",
      "mongodb://localhost:27017",
      "--quiet",
      "--eval",
      `const result = db.adminCommand({ listShards: 1 });
if (!result || result.ok !== 1) {
  throw new Error("listShards failed");
}
print(JSON.stringify({ shards: result.shards || [] }));`
    ],
    15000
  );
  const payload = parseJsonPayload(stdout, "listShards");
  return Array.isArray(payload?.shards) ? payload.shards : [];
}

function parseShardHostDescriptor(hostDescriptor) {
  const raw = String(hostDescriptor || "").trim();
  if (!raw) {
    return { replSetName: "", hosts: [] };
  }
  const slashIndex = raw.indexOf("/");
  if (slashIndex === -1) {
    return { replSetName: "", hosts: [raw] };
  }
  const replSetName = raw.slice(0, slashIndex).trim();
  const hosts = raw
    .slice(slashIndex + 1)
    .split(",")
    .map((entry) => String(entry || "").trim())
    .filter(Boolean);
  return { replSetName, hosts };
}

async function resolveVotingHostsForShard(shard) {
  const shardName = String(shard?._id || "").trim();
  const descriptor = parseShardHostDescriptor(shard?.host);
  if (!descriptor.replSetName || !descriptor.hosts.length) {
    return {
      targetName: shardName || descriptor.replSetName || "unknown-shard",
      replicaSetName: descriptor.replSetName || shardName || "unknown-shard",
      hosts: descriptor.hosts
    };
  }
  const seedUri = buildReplicaSetUri(descriptor.hosts, descriptor.replSetName);
  const router = await resolveMongosRouterDockerName();
  try {
    const { stdout } = await runDocker(
      [
        "exec",
        router,
        "mongosh",
        seedUri,
        "--quiet",
        "--eval",
        `const cfg = rs.conf();
const hosts = (cfg.members || [])
  .filter((member) => Number(member?.votes ?? 1) > 0)
  .map((member) => String(member.host || "").trim())
  .filter(Boolean);
print(JSON.stringify({ hosts }));`
      ],
      15000
    );
    const payload = parseJsonPayload(stdout, `voting hosts for shard ${descriptor.replSetName}`);
    const votingHosts = Array.isArray(payload?.hosts)
      ? payload.hosts.map((entry) => String(entry || "").trim()).filter(Boolean)
      : [];
    return {
      targetName: shardName || descriptor.replSetName,
      replicaSetName: descriptor.replSetName,
      hosts: votingHosts.length ? votingHosts : descriptor.hosts
    };
  } catch (_error) {
    return {
      targetName: shardName || descriptor.replSetName,
      replicaSetName: descriptor.replSetName,
      hosts: descriptor.hosts
    };
  }
}

async function resolveWorkloadMongoTargets() {
  if (!(await doesConfigServerExist()) || !(await isPersistedTopologySharded())) {
    const writeUri = computeLegacyAppDefaultMongoUriFromSettings();
    return {
      writeUri,
      readTargets: [{ name: "default", uri: writeUri, kind: "replicaSet" }]
    };
  }

  const routerUri = await resolveMongosRouterMongoUri();
  const shards = await listShardsFromConfigServer();
  const readTargets = [{ name: "mongos router", uri: routerUri, kind: "mongos" }];
  for (const shard of shards) {
    const resolved = await resolveVotingHostsForShard(shard);
    if (!resolved.hosts.length || !resolved.replicaSetName) {
      continue;
    }
    readTargets.push({
      name: resolved.targetName,
      uri: buildReplicaSetUri(resolved.hosts, resolved.replicaSetName),
      kind: "shard"
    });
  }
  return {
    writeUri: routerUri,
    readTargets
  };
}

function terminateLocalExecProcess() {
  return new Promise((resolve) => {
    if (!appProcess) {
      resolve(false);
      return;
    }
    const proc = appProcess;
    const timer = setTimeout(() => {
      try {
        proc.kill("SIGKILL");
      } catch (_error) {
        // no-op
      }
      resolve(true);
    }, 2000);

    proc.once("exit", () => {
      clearTimeout(timer);
      resolve(true);
    });

    try {
      proc.kill("SIGTERM");
    } catch (_error) {
      clearTimeout(timer);
      resolve(true);
    }
  });
}

async function killContainerWorkloadProcesses(targetService) {
  const svc = targetService || (await getApplicationServerWorkloadTargetService());
  await runCompose(
    [
      "exec",
      "-T",
      svc,
      "bash",
      "-lc",
      "pids=\"$(ps -eo pid,args | awk '/[n]ode workload.js/ {print $1}')\"; if [ -n \"$pids\" ]; then kill -TERM $pids >/dev/null 2>&1 || true; fi; sleep 0.2; pids=\"$(ps -eo pid,args | awk '/[n]ode workload.js/ {print $1}')\"; if [ -n \"$pids\" ]; then kill -KILL $pids >/dev/null 2>&1 || true; fi; exit 0"
    ],
    15000
  );
}

async function getContainerWorkloadProcessCount(targetService) {
  const svc = targetService || (await getApplicationServerWorkloadTargetService());
  const { stdout } = await runCompose(
    [
      "exec",
      "-T",
      svc,
      "bash",
      "-lc",
      "ps -eo pid,args | awk '/[n]ode workload.js/ {print $1}'"
    ],
    8000
  );
  const pids = String(stdout || "")
    .trim()
    .split(/\s+/)
    .filter((value) => /^[0-9]+$/.test(value));
  return pids.length;
}

function isApplicationServerWorkloadRunning() {
  return Boolean(appProcess);
}

async function startApplicationServerWorkload() {
  const targetService = await getApplicationServerWorkloadTargetService();
  await terminateLocalExecProcess();
  await killContainerWorkloadProcesses(targetService);
  const preExisting = await getContainerWorkloadProcessCount(targetService);
  if (preExisting > 0) {
    throw new Error(
      "Unable to start ApplicationServer workload because an existing workload.js instance could not be stopped."
    );
  }
  const settings = await getApplicationServerSettings();
  const userLocation = USER_LOCATION_CODE_PATTERN.test(settings.userLocation)
    ? settings.userLocation
    : "US";
  const runtimeMongoSettings = buildRuntimeMongoSettings(settings);
  metrics.lastIncrementedAt = null;
  metrics.lastCurrentValueAt = null;
  metrics.lastCurrentValue = null;
  metrics.readByTarget = {};
  const mongoTargets = await resolveWorkloadMongoTargets();
  const readTargetsJson = JSON.stringify(mongoTargets.readTargets || []);
  await applyApplicationServerRuntimeMongoSettings(runtimeMongoSettings, {
    skipWhenServiceNotRunning: false
  });

  appProcess = spawn(
    "docker",
    [
      "compose",
      ...normalizeComposeArgs(PROJECT_ROOT, [
        "exec",
        "-T",
        "-e",
        `MDB_USER_LOCATION=${userLocation}`,
        "-e",
        `MDB_WRITE_URI=${mongoTargets.writeUri}`,
        "-e",
        `MDB_READ_TARGETS=${readTargetsJson}`,
        "-e",
        `MDB_WRITE_CONCERN=${String(runtimeMongoSettings.writeConcern)}`,
        "-e",
        `MDB_READ_CONCERN=${runtimeMongoSettings.readConcern}`,
        "-e",
        `MDB_READ_PREFERENCE=${runtimeMongoSettings.readPreference}`,
        "-e",
        `MDB_TOPOLOGY_CHANGE_SIGNAL_PATH=${RUNTIME_TOPOLOGY_SIGNAL_PATH}`,
        targetService,
        "node",
        "workload.js"
      ])
    ],
    {
      cwd: PROJECT_ROOT
    }
  );

  appProcess.stdout.on("data", (chunk) => processChunk(chunk, "stdout"));
  appProcess.stderr.on("data", (chunk) => processChunk(chunk, "stderr"));
  appProcess.on("exit", (code, signal) => {
    flushRemainder();
    appProcess = null;
    notifyListeners("state", {
      running: false,
      code,
      signal,
      metrics: {
        ...metrics,
        readByTarget: cloneReadByTarget()
      }
    });
  });
  appProcess.on("error", (error) => {
    processLogLine(`Failed to start ApplicationServer workload: ${error.message}`, "stderr");
  });

  notifyListeners("state", {
    running: true,
    metrics: {
      ...metrics,
      readByTarget: cloneReadByTarget()
    }
  });

  return { started: true, message: "ApplicationServer workload started (single instance enforced)." };
}

async function signalApplicationServerTopologyChange(options = {}) {
  const skipWhenServiceNotRunning = options.skipWhenServiceNotRunning !== false;
  const scope = String(options.scope || "all").trim().toLowerCase() === "shard" ? "shard" : "all";
  const shardName = String(options.shardName || "").trim() || null;
  if (!isApplicationServerWorkloadRunning()) {
    return { signaled: false, skipped: true, reason: "Workload app process is not running." };
  }
  if (skipWhenServiceNotRunning) {
    const targetService = await getApplicationServerWorkloadTargetService();
    const serviceRunning = await isComposeServiceRunning(targetService);
    if (!serviceRunning) {
      return { signaled: false, skipped: true, reason: "ApplicationServer service is not running." };
    }
  }
  let readTargets = [];
  try {
    const targets = await resolveWorkloadMongoTargets();
    readTargets = Array.isArray(targets?.readTargets) ? targets.readTargets : [];
  } catch (_error) {
    readTargets = [];
  }
  const payload = {
    changeId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    triggeredAt: new Date().toISOString(),
    scope,
    shardName,
    readTargets
  };
  const targetService = await getApplicationServerWorkloadTargetService();
  await runCompose(
    [
      "exec",
      "-T",
      targetService,
      "bash",
      "-lc",
      `cat > ${RUNTIME_TOPOLOGY_SIGNAL_PATH} <<'EOF'
${JSON.stringify(payload)}
EOF`
    ],
    10000
  );
  return { signaled: true, skipped: false, payload };
}

async function stopApplicationServerWorkload(options = {}) {
  const targetService = options.serviceName || (await getApplicationServerWorkloadTargetService());
  const localStopped = await terminateLocalExecProcess();
  let serviceRunning = false;
  try {
    serviceRunning = await isComposeServiceRunning(targetService);
  } catch (_error) {
    serviceRunning = false;
  }

  let remaining = 0;
  if (serviceRunning) {
    await killContainerWorkloadProcesses(targetService);
    remaining = await getContainerWorkloadProcessCount(targetService);
  }

  notifyListeners("state", {
    running: false,
    metrics: {
      ...metrics,
      readByTarget: cloneReadByTarget()
    }
  });

  return {
    stopped: true,
    message:
      remaining === 0
        ? "ApplicationServer workload stopped."
        : "Stop requested; workload may still be stopping.",
    localStopped,
    remainingInstances: remaining
  };
}

async function restartApplicationServerWorkload() {
  const stop = await stopApplicationServerWorkload();
  const start = await startApplicationServerWorkload();
  return { restarted: true, message: "ApplicationServer workload restarted.", stop, start };
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

module.exports = {
  APPLICATION_SERVER_SERVICE,
  getApplicationServerWorkloadTargetService,
  listApplicationServerServiceNames,
  applicationServerServiceNameForDataCenterId,
  isApplicationServerWorkloadRunning,
  applyApplicationServerRuntimeMongoSettings,
  startApplicationServerWorkload,
  stopApplicationServerWorkload,
  signalApplicationServerTopologyChange,
  restartApplicationServerWorkload,
  subscribe,
  buildSnapshot
};
