const fs = require("fs/promises");
const { MongoClient, ReadPreference } = require("mongodb");

const uri =
  "mongodb://node1:27017,node2:27017,node_au1:27017,node_au2:27017,node_au3:27017/?authSource=admin&replicaSet=mongodb-rs";

const writeUri = String(process.env.MDB_WRITE_URI || "")
  .trim()
  .replace(/^"+|"+$/g, "") || uri;
const userLocation = /^[A-Za-z]{2}$/.test(String(process.env.MDB_USER_LOCATION || "").trim())
  ? String(process.env.MDB_USER_LOCATION).trim().toUpperCase()
  : "US";
const WRITE_CONCERN_MAJORITY = "majority";
const RUNTIME_SETTINGS_PATH = "/tmp/failover-monitor-mongo-settings.json";
const TOPOLOGY_CHANGE_SIGNAL_PATH =
  String(process.env.MDB_TOPOLOGY_CHANGE_SIGNAL_PATH || "").trim() ||
  "/tmp/failover-monitor-workload-topology-change.json";
const RUNTIME_SETTINGS_REFRESH_MS = 1000;
const VALID_READ_CONCERNS = ["local", "available", "majority", "linearizable", "snapshot"];
const VALID_READ_PREFERENCES = [
  "primary",
  "primaryPreferred",
  "secondary",
  "secondaryPreferred",
  "nearest"
];
const READ_PREFERENCE_MAP = {
  primary: ReadPreference.PRIMARY,
  primaryPreferred: ReadPreference.PRIMARY_PREFERRED,
  secondary: ReadPreference.SECONDARY,
  secondaryPreferred: ReadPreference.SECONDARY_PREFERRED,
  nearest: ReadPreference.NEAREST
};

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
  return VALID_READ_CONCERNS.includes(normalized) ? normalized : "local";
}

function normalizeReadPreference(value) {
  const normalized = String(value || "").trim();
  return VALID_READ_PREFERENCES.includes(normalized) ? normalized : "primary";
}

function normalizeMongoSettings(value) {
  return {
    writeConcern: normalizeWriteConcern(value?.writeConcern),
    readConcern: normalizeReadConcern(value?.readConcern),
    readPreference: normalizeReadPreference(value?.readPreference)
  };
}

function buildCollectionOptions(settings) {
  const writeConcernValue =
    settings.writeConcern === WRITE_CONCERN_MAJORITY ? WRITE_CONCERN_MAJORITY : settings.writeConcern;
  return {
    readPreference: READ_PREFERENCE_MAP[settings.readPreference] || ReadPreference.PRIMARY,
    readConcern: { level: settings.readConcern },
    writeConcern: { w: writeConcernValue }
  };
}

function buildSettingsSignature(settings) {
  return `${settings.writeConcern}|${settings.readConcern}|${settings.readPreference}`;
}

const environmentMongoSettings = normalizeMongoSettings({
  writeConcern: process.env.MDB_WRITE_CONCERN,
  readConcern: process.env.MDB_READ_CONCERN,
  readPreference: process.env.MDB_READ_PREFERENCE
});
let cachedRuntimeSettings = environmentMongoSettings;
let cachedRuntimeSettingsAt = 0;

async function loadRuntimeMongoSettings() {
  const now = Date.now();
  if (now - cachedRuntimeSettingsAt < RUNTIME_SETTINGS_REFRESH_MS) {
    return cachedRuntimeSettings;
  }
  let fileSettings = null;
  try {
    const raw = await fs.readFile(RUNTIME_SETTINGS_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      fileSettings = parsed;
    }
  } catch (_error) {
    // Use environment settings when runtime settings file is unavailable.
  }
  cachedRuntimeSettings = normalizeMongoSettings({
    writeConcern: fileSettings?.writeConcern ?? environmentMongoSettings.writeConcern,
    readConcern: fileSettings?.readConcern ?? environmentMongoSettings.readConcern,
    readPreference: fileSettings?.readPreference ?? environmentMongoSettings.readPreference
  });
  cachedRuntimeSettingsAt = now;
  return cachedRuntimeSettings;
}

function normalizeReadTargets(rawTargetsJson) {
  const fallback = [{ name: "default", uri: writeUri, kind: "replicaSet" }];
  const raw = String(rawTargetsJson || "").trim();
  if (!raw) {
    return fallback;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return fallback;
    }
    const normalized = [];
    const seenNames = new Set();
    for (const target of parsed) {
      const name = String(target?.name || "").trim();
      const targetUri = String(target?.uri || "").trim();
      const kind = String(target?.kind || "shard").trim() || "shard";
      if (!name || !targetUri || seenNames.has(name)) {
        continue;
      }
      normalized.push({ name, uri: targetUri, kind });
      seenNames.add(name);
    }
    return normalized.length ? normalized : fallback;
  } catch (_error) {
    return fallback;
  }
}

function buildReaderTag(target) {
  const targetName = String(target?.name || "").trim() || "default";
  const kind = String(target?.kind || "").trim().toLowerCase();
  if (kind === "mongos") {
    return "mongos";
  }
  return targetName;
}

function normalizeTopologySignal(rawPayload) {
  if (!rawPayload || typeof rawPayload !== "object") {
    return null;
  }
  const changeId = String(rawPayload.changeId || "").trim();
  if (!changeId) {
    return null;
  }
  const scope = String(rawPayload.scope || "all").trim().toLowerCase() === "shard" ? "shard" : "all";
  const shardName = String(rawPayload.shardName || "").trim() || null;
  const readTargets = Array.isArray(rawPayload.readTargets)
    ? normalizeReadTargets(JSON.stringify(rawPayload.readTargets))
    : [];
  return {
    changeId,
    scope,
    shardName,
    readTargets
  };
}

async function main() {
  const writerClient = new MongoClient(writeUri);
  await writerClient.connect();
  const db = writerClient.db("architect_day");
  let col = db.collection("counter");
  const readTargets = normalizeReadTargets(process.env.MDB_READ_TARGETS);
  const readTargetConnections = [];
  let lastAppliedSettingsSignature = "";
  let lastTopologySignalId = "";
  let topologySignalInFlight = false;
  let counter = 0;

  async function refreshCollectionReferencesIfNeeded(force = false) {
    const settings = await loadRuntimeMongoSettings();
    const signature = buildSettingsSignature(settings);
    if (!force && signature === lastAppliedSettingsSignature) {
      return;
    }
    const collOptions = buildCollectionOptions(settings);
    col = db.collection("counter", collOptions);
    for (const target of readTargetConnections) {
      target.collection = target.db.collection("counter", collOptions);
    }
    lastAppliedSettingsSignature = signature;
    console.log(
      `[${new Date().toISOString()}] Applied collection options: ${JSON.stringify({
        readPreference: settings.readPreference,
        readConcern: settings.readConcern,
        writeConcern: settings.writeConcern
      })}`
    );
  }
  try {
    await refreshCollectionReferencesIfNeeded(true);
    const initDoc = await col.find({}).sort({ _id: -1 }).limit(1).toArray();
    if (!initDoc || initDoc.length === 0) {
      await col.insertOne({ value: 0, country: userLocation });
      await col.createIndex({ country: 1, _id: -1 });
      counter = 0;
    } else {
      counter = Number(initDoc[0].value) || 0;
    }
  } catch (err) {
    console.error("Collection initialization error or index creation error:", err.message);
    process.exit(1);
  }

  for (const target of readTargets) {
    try {
      const targetTag = buildReaderTag(target);
      console.log("Connecting to read target:", target.uri);
      const client = new MongoClient(target.uri,{monitorCommands: true});
      await client.connect();
      const readDb = client.db("architect_day");
      const readCol = readDb.collection("counter");
      readTargetConnections.push({
        ...target,
        tag: targetTag,
        client,
        db: readDb,
        collection: readCol
      });
      console.log(`[${new Date().toISOString()}] Reader connected (${target.name})`);
      client.on('commandSucceeded', event => {
        if (['find'].includes(event.commandName)) {
          console.log(
            `[${new Date().toISOString()}] [READ:${targetTag}] [SUCCEEDED] ${event.commandName} completed on ${event.address}`
          );
        }
      });
    } catch (err) {
      console.error(`Reader connection failed for ${target.name}:`, err.message);
    }
  }
  if (!readTargetConnections.length) {
    const readCol = db.collection("counter");
    readTargetConnections.push({
      name: "default",
      kind: "replicaSet",
      uri: writeUri,
      tag: "default",
      db,
      collection: readCol
    });
  }
  await refreshCollectionReferencesIfNeeded(true);

  async function reconnectReadTargetConnection(target, replacementTarget = null) {
    const nextTarget = replacementTarget || target;
    const nextUri = String(nextTarget?.uri || target.uri || "").trim();
    if (!nextUri) {
      throw new Error(`No URI available for read target ${target.name || "unknown"}.`);
    }
    const nextName = String(nextTarget?.name || target.name || "").trim() || target.name;
    const nextKind = String(nextTarget?.kind || target.kind || "").trim() || target.kind;
    if (target.client) {
      try {
        await target.client.close(true);
      } catch (_error) {
        // Ignore close errors; continue reconnect.
      }
    }
    const client = new MongoClient(nextUri, { monitorCommands: true });
    await client.connect();
    const nextTag = buildReaderTag({ name: nextName, kind: nextKind });
    client.on("commandSucceeded", (event) => {
      if (["find"].includes(event.commandName)) {
        console.log(
          `[${new Date().toISOString()}] [READ:${nextTag}] [SUCCEEDED] ${event.commandName} completed on ${event.address}`
        );
      }
    });
    target.uri = nextUri;
    target.name = nextName;
    target.kind = nextKind;
    target.tag = nextTag;
    target.client = client;
    target.db = client.db("architect_day");
    const settings = await loadRuntimeMongoSettings();
    target.collection = target.db.collection("counter", buildCollectionOptions(settings));
  }

  async function handleTopologySignal() {
    if (topologySignalInFlight) {
      return;
    }
    let raw = null;
    try {
      raw = await fs.readFile(TOPOLOGY_CHANGE_SIGNAL_PATH, "utf8");
    } catch (_error) {
      return;
    }
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch (_error) {
      return;
    }
    const signal = normalizeTopologySignal(parsed);
    if (!signal || signal.changeId === lastTopologySignalId) {
      return;
    }
    topologySignalInFlight = true;
    try {
      const replacementByName = new Map(
        (signal.readTargets || [])
          .map((target) => [String(target?.name || "").trim(), target])
          .filter(([name]) => Boolean(name))
      );
      const shardReadTargets = readTargetConnections.filter(
        (target) => String(target?.kind || "").trim().toLowerCase() === "shard"
      );
      if (signal.scope === "shard" && signal.shardName && shardReadTargets.length) {
        const shardNameLower = signal.shardName.toLowerCase();
        const target = shardReadTargets.find((entry) => String(entry?.name || "").trim().toLowerCase() === shardNameLower);
        if (target) {
          await reconnectReadTargetConnection(target, replacementByName.get(String(target.name || "").trim()) || null);
          console.log(
            `[${new Date().toISOString()}] Topology signal applied (shard=${signal.shardName}): reconnected direct read target.`
          );
        }
      } else {
        const directTargets =
          shardReadTargets.length > 0
            ? shardReadTargets
            : readTargetConnections.filter((target) => String(target?.kind || "").trim().toLowerCase() !== "mongos");
        for (const target of directTargets) {
          await reconnectReadTargetConnection(target, replacementByName.get(String(target.name || "").trim()) || null);
        }
        if (directTargets.length) {
          console.log(
            `[${new Date().toISOString()}] Topology signal applied: reconnected ${directTargets.length} direct read target(s).`
          );
        }
      }
      lastTopologySignalId = signal.changeId;
    } catch (error) {
      console.error("Topology signal handling error:", error.message);
    } finally {
      topologySignalInFlight = false;
    }
  }

  // Writer thread - Increments the counter every second
  setInterval(async () => {
    try {
      await refreshCollectionReferencesIfNeeded();
      const now = new Date().toISOString();
      const startedAt = Date.now();
      counter += 1;
      await col.insertOne({ value: counter, country: userLocation });
      const elapsedMs = Date.now() - startedAt;
      console.log(`[${now}] Incremented (insertOne: ${elapsedMs}ms)`);
    } catch (err) {
      console.error("Increment error:", err.message);
    }
  }, 1000);

  for (const target of readTargetConnections) {
    setInterval(async () => {
      try {
        await refreshCollectionReferencesIfNeeded();
        const startedAt = Date.now();
        const readFilter = target.tag === "mongos" || target.tag === "default"
          ? { country: userLocation }
          : {};
        const doc = await target.collection.find(readFilter).sort({ _id: -1 }).limit(1).toArray();
        const now = new Date().toISOString();
        const elapsedMs = Date.now() - startedAt;
        console.log(
          `[${now}] [READ:${target.tag}] Current value: ${doc[0]?.value} (findOne: ${elapsedMs}ms)`
        );
      } catch (err) {
        console.error(`[READ:${target.tag}] Read error:`, err.message);
      }
    }, 500);
  }
  setInterval(async () => {
    await handleTopologySignal();
  }, 1000);
}

main().catch(console.error);
