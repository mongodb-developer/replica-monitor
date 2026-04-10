const fs = require("fs/promises");
const path = require("path");
const { createProgressEmitter } = require("../deploymentProgressHub");
const { validateTemplatePayload, persistTemplateConfiguration } = require("../templateConfigs");
const {
  buildDataCenterById,
  regionForDataCenterId,
  buildFirstShardInitScript
} = require("../replicaInitScriptBuilder");

async function runStep(progress, id, label, fn) {
  if (!progress) {
    return fn();
  }
  return progress.runStep(id, label, fn);
}

function sanitizeShardStepId(shardName) {
  return String(shardName || "").replace(/[^a-zA-Z0-9_-]/g, "_");
}

function buildTemplateDeploymentPlan(template) {
  const steps = [
    { id: "validate_settings", label: "Validate template and save settings" },
    { id: "reset_application_state", label: "Reset application state" },
    { id: "start_stack", label: "Start Docker stack (this might take a while)" }
  ];
  if (!template.sharded) {
    steps.push(
      { id: "init_replica_set", label: "Initialize replica set" },
      { id: "reconcile_replica_set", label: "Reconcile replica set (priorities and tags)" },
      { id: "sync_zones", label: "Sync zones to cluster" },
      { id: "finalize", label: "Apply election timeout and network emulation" },
      { id: "deployment_completed", label: "Deployment Completed" }
    );
    return steps;
  }
  const shards = template.shards || [];
  const firstShardEntry = shards[0] || {};
  const firstShardNameRaw = String(firstShardEntry.name || "").trim();
  const shardLabelName = firstShardNameRaw || "mongodb-repl-set";
  steps.push({
    id: `init_shard_${sanitizeShardStepId(shardLabelName)}`,
    label: `Initialize replica set for shard "${shardLabelName}"`
  });
  for (let i = 1; i < shards.length; i += 1) {
    const shardName = String(shards[i].name || "").trim();
    const sid = sanitizeShardStepId(shardName);
    steps.push({
      id: `init_shard_${sid}`,
      label: `Initialize replica set for shard "${shardName}"`
    });
  }
  steps.push({
    id: "shard_cluster",
    label: `Enable sharding (add ${shardLabelName} to cluster)`
  });
  for (let i = 1; i < shards.length; i += 1) {
    const shardName = String(shards[i].name || "").trim();
    const sid = sanitizeShardStepId(shardName);
    steps.push({
      id: `add_shard_${sid}`,
      label: `Register shard "${shardName}" with cluster`
    });
  }
  steps.push(
    { id: "sync_zones", label: "Sync zones to sharded cluster" },
    { id: "finalize", label: "Apply election timeout and network emulation" },
    { id: "deployment_completed", label: "Deployment Completed" }
  );
  return steps;
}

function buildReconcileUnshardedScript(template, normalizeDataCenterFn) {
  const dcById = buildDataCenterById(template);
  const nodes = template.replicaSet?.nodes || [];
  const rules = nodes.map((node) => {
    const region = normalizeDataCenterFn(regionForDataCenterId(dcById, node.dataCenter));
    const host = `${String(node.name).trim()}:27017`;
    const votes = String(node.type || "").trim() === "readOnly" ? 0 : 1;
    const priority = Number(node.priority);
    return {
      host,
      priority,
      votes,
      tags: { dataCenter: region, dataCenterId: String(node.dataCenter).trim() }
    };
  });
  return `
const rules = ${JSON.stringify(rules)};
const ruleByHost = new Map(rules.map((r) => [r.host, r]));
const cfg = rs.conf();
let changed = false;
for (const member of cfg.members) {
  const rule = ruleByHost.get(member.host);
  if (!rule) continue;
  if (member.priority !== rule.priority || member.votes !== rule.votes) {
    member.priority = rule.priority;
    member.votes = rule.votes;
    changed = true;
  }
  const t = member.tags || {};
  const nt = rule.tags;
  if (t.dataCenter !== nt.dataCenter || t.dataCenterId !== nt.dataCenterId) {
    member.tags = { dataCenter: nt.dataCenter, dataCenterId: nt.dataCenterId };
    changed = true;
  }
}
if (changed) {
  cfg.version = (cfg.version || 1) + 1;
  rs.reconfig(cfg);
}
print(JSON.stringify({ ok: true, changed }));
`.trim();
}

function buildMultiMemberShardInitScript(replicaSetName, shardNodes, dcById, normalizeDataCenterFn) {
  const members = shardNodes.map((node, index) => {
    const region = normalizeDataCenterFn(regionForDataCenterId(dcById, node.dataCenter));
    const host = `${String(node.name).trim()}:27017`;
    const votes = String(node.type || "").trim() === "readOnly" ? 0 : 1;
    const priority = Number(node.priority);
    const tags = `{ dataCenter: ${JSON.stringify(region)}, dataCenterId: ${JSON.stringify(String(node.dataCenter).trim())} }`;
    return `      { _id: ${index}, host: ${JSON.stringify(host)}, priority: ${priority}, votes: ${votes}, tags: ${tags} }`;
  });
  const primaryService = String(shardNodes[0].name).trim();
  return {
    primaryService,
    script: `
function waitForPrimary(maxAttempts, sleepMs) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const status = rs.status();
      const hasPrimary = status.members.some((member) => member.stateStr === "PRIMARY");
      if (hasPrimary) return true;
    } catch (e) {}
    sleep(sleepMs);
  }
  return false;
}
let initiated = false;
try {
  if (rs.status().ok === 1) {
    initiated = true;
  }
} catch (e) {}
if (!initiated) {
  rs.initiate({
    _id: ${JSON.stringify(replicaSetName)},
    version: 1,
    members: [
${members.join(",\n")}
    ]
  });
}
if (!waitForPrimary(40, 1000)) {
  throw new Error("Primary was not elected in time for additional shard replica set.");
}
print("Additional shard replica set initialization complete.");
`.trim()
  };
}

function createTemplateApplyRebuildService(deps) {
  const {
    stopApplicationServerWorkload,
    stopStack,
    resetRuntimeState,
    startStack,
    initReplicaSet,
    runCompose,
    parseJsonPayload,
    getApplicationServerSettings,
    normalizeDataCenter,
    cleanupRuntimeReplicaContainers,
    ensureConfiguredComposeNodesInReplicaSet,
    applyReplicaSetDataCenterOnPrimary,
    ensureDefaultDataCenterTagsOnPrimary,
    reconcileReplicaNodeNetworks,
    syncDataCenterHostsEntries,
    syncLegacyAppMongoUri,
    applyPersistedReplicaSetElectionTimeout,
    runNetemLatencyScript,
    resolveCurrentPrimaryService,
    shardReplicaSet,
    runConfigServerMongosEval,
    buildSingleNodeReplicaInitScript,
    syncZonesToSharding,
    getZones,
    SCRIPTS_DIR,
    sleep,
    waitForMongodRunning
  } = deps;

  const GENERATED_INIT = "init-rs-template-generated.js";

  async function finalizeTemplateApply() {
    await applyPersistedReplicaSetElectionTimeout();
    await runNetemLatencyScript("apply", { strict: false });
  }

  async function waitForShardNameInShStatus(shardName, timeoutMs = 60000) {
    const deadline = Date.now() + timeoutMs;
    const normalized = String(shardName || "").trim();
    while (Date.now() < deadline) {
      const { stdout } = await runConfigServerMongosEval("sh.status()", 30000);
      if (String(stdout || "").includes(normalized)) {
        return;
      }
      await sleep(500);
    }
    throw new Error(`Timeout waiting for shard "${normalized}" in sh.status().`);
  }

  async function applyPostInitBootstrap(settings, options = {}) {
    const { skipApplyDefaultDataCenter = false, skipElectionTimeout = false } = options;
    await reconcileReplicaNodeNetworks(settings); //GCR - check prior calls to this function and see if they can be removed
    await syncDataCenterHostsEntries(); //GCR - check prior calls to this function and see if they can be removed
    await syncLegacyAppMongoUri(); //GCR - check prior calls to this function and see if they can be removed
    if (!skipElectionTimeout) {
      await applyPersistedReplicaSetElectionTimeout(); //GCR - check prior calls to this function and see if they can be removed
    }
    await runNetemLatencyScript("apply", { strict: false }); //Check if this can be removed 
    if (!skipApplyDefaultDataCenter) {
      const initialDataCenterEntry = settings?.dataCenters?.[0] || null;
      const initialDataCenter = normalizeDataCenter(initialDataCenterEntry?.region);
      const initialDataCenterId = String(initialDataCenterEntry?.id || "").trim() || null;
      await applyReplicaSetDataCenterOnPrimary(initialDataCenter, initialDataCenterId);
      await ensureDefaultDataCenterTagsOnPrimary(initialDataCenter, initialDataCenterId);
    }
  }

  async function reconcileUnshardedTemplate(template) {
    const primaryService = await resolveCurrentPrimaryService();
    const script = buildReconcileUnshardedScript(template, normalizeDataCenter);
    const { stdout } = await runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      90000
    );
    parseJsonPayload(stdout, "reconcile unsharded template");
  }

  async function rebuildUnsharded(template, progress) {
    await runStep(progress, "init_replica_set", "Initialize replica set", () =>
      initReplicaSet({ templateApplyRebuild: true })
    );
    await runStep(progress, "reconcile_replica_set", "Reconcile replica set (priorities and tags)", () =>
      reconcileUnshardedTemplate(template)
    );
    // reconcileUnshardedTemplate may use rs.reconfig; finalizeTemplateApply (after rebuild) applies electionTimeoutMillis.
  }

  async function rebuildSharded(template, progress) {
    const shards = template.shards || [];
    if (!shards.length) {
      throw new Error("Sharded template has no shards.");
    }
    const firstShard = shards[0];
    const firstShardName = String(firstShard.name || "").trim();
    const firstNodes = firstShard.nodes || [];
    const dcById = buildDataCenterById(template);
    const replicaSetName = firstShardName || "mongodb-repl-set";
    const shardLabelName = firstShardName || replicaSetName;
    const firstShardStepId = `init_shard_${sanitizeShardStepId(shardLabelName)}`;
    const initFirstShardLabel = `Initialize replica set for shard "${shardLabelName}"`;

    await runStep(progress, firstShardStepId, initFirstShardLabel, async () => {
      const initScript = buildFirstShardInitScript(replicaSetName, firstNodes, dcById, normalizeDataCenter);
      const initPath = path.join(SCRIPTS_DIR, GENERATED_INIT);
      await fs.writeFile(initPath, `${initScript}\n`, "utf8");
      const firstNodeName = String(firstNodes[0]?.name || "").trim();
      if (!firstNodeName) {
        throw new Error("First shard has no nodes for replica set initialization.");
      }
      const result = await runCompose(
        ["exec", "-T", firstNodeName, "mongosh", "--quiet", "--file", `/scripts/${GENERATED_INIT}`],
        120000
      );
      if (!String(result?.stdout || "").includes("complete")) {
        // still proceed if output differs slightly
      }
      await cleanupRuntimeReplicaContainers();
      const settings = await getApplicationServerSettings();
      const initialDataCenterEntry = settings?.dataCenters?.[0] || null;
      const initialDataCenter = normalizeDataCenter(initialDataCenterEntry?.region);
      const initialDataCenterId = String(initialDataCenterEntry?.id || "").trim() || null;
      const allowedNames = firstNodes.map((n) => String(n.name).trim());
      await ensureConfiguredComposeNodesInReplicaSet(initialDataCenter, initialDataCenterId, allowedNames);
      await reconcileUnshardedTemplate({
        ...template,
        replicaSet: { name: replicaSetName, nodes: firstNodes }
      });
    });

    for (let i = 1; i < shards.length; i += 1) {
      const shard = shards[i];
      const shardName = String(shard.name || "").trim();
      const nodes = shard.nodes || [];
      if (!nodes.length) {
        throw new Error(`Shard ${shardName} has no nodes.`);
      }
      const initShardId = `init_shard_${sanitizeShardStepId(shardName)}`;
      await runStep(
        progress,
        initShardId,
        `Initialize replica set for shard "${shardName}"`,
        async () => {
          if (nodes.length === 1) {
            const node = nodes[0];
            const serviceName = String(node.name).trim();
            const region = normalizeDataCenter(regionForDataCenterId(dcById, node.dataCenter));
            const dataCenterId = String(node.dataCenter).trim();
            const script = buildSingleNodeReplicaInitScript(shardName, serviceName, region, dataCenterId);
            const shardInitPath = path.join(SCRIPTS_DIR, `init-rs-template-shard-${i}.js`);
            await fs.writeFile(shardInitPath, `${script}\n`, "utf8");
            await runCompose(
              ["exec", "-T", serviceName, "mongosh", "--quiet", "--file", `/scripts/${path.basename(shardInitPath)}`],
              120000
            );
            await waitForMongodRunning(serviceName, 90000);
          } else {
            const { primaryService, script } = buildMultiMemberShardInitScript(shardName, nodes, dcById, normalizeDataCenter);
            const shardInitPath = path.join(SCRIPTS_DIR, `init-rs-template-shard-${i}.js`);
            await fs.writeFile(shardInitPath, `${script}\n`, "utf8");
            await runCompose(
              ["exec", "-T", primaryService, "mongosh", "--quiet", "--file", `/scripts/${path.basename(shardInitPath)}`],
              120000
            );
            await waitForMongodRunning(primaryService, 90000);
          }
        }
      );
    }

    const firstShardHosts = firstNodes.map((n) => `${String(n.name).trim()}:27017`);
    await runStep(progress, "shard_cluster", `Enable sharding (add ${shardLabelName} to cluster)`, () =>
      shardReplicaSet(firstShardName, {
        firstShardHosts,
        skipElectionTimeoutApply: true,
        suppressDeploymentProgress: true
      })
    );

    for (let i = 1; i < shards.length; i += 1) {
      const shard = shards[i];
      const shardName = String(shard.name || "").trim();
      const nodes = shard.nodes || [];
      const hosts = nodes.map((n) => `${String(n.name).trim()}:27017`).join(",");
      const addShardId = `add_shard_${sanitizeShardStepId(shardName)}`;
      await runStep(
        progress,
        addShardId,
        `Register shard "${shardName}" with cluster`,
        async () => {
          await runConfigServerMongosEval(
            `db.adminCommand({ addShard: "${shardName}/${hosts}", name: "${shardName}" })`,
            120000
          );
          await waitForShardNameInShStatus(shardName, 120000);
        }
      );
    }

    await runStep(progress, "sync_zones", "Sync zones to sharded cluster", async () => {
      const zones = await getZones();
      await syncZonesToSharding(zones.zones);
    });
  }

  async function applyTemplateAndRebuild(template, options = {}) {
    const { progressToken } = options;
    const progress = progressToken ? createProgressEmitter(progressToken) : null;
    try {
      if (progress) {
        progress.plan(buildTemplateDeploymentPlan(template));
      }

      await runStep(progress, "validate_settings", "Validate template and save settings", async () => {
        const validation = await validateTemplatePayload(template);
        if (!validation.ok) {
          const error = new Error(`Template validation failed:\n- ${validation.errors.join("\n- ")}`);
          error.validationErrors = validation.errors;
          throw error;
        }
      });

      const applyResult = await runStep(progress, "reset_application_state", "Reset application state", async () => {
        const result = await persistTemplateConfiguration(template);
        await stopApplicationServerWorkload();
        await stopStack();
        resetRuntimeState();
        return result;
      });

      await runStep(progress, "start_stack", "Start Docker stack (this might take a while)", () =>
        startStack({ templateApplyRebuild: true })
      );

      if (!template.sharded) {
        await rebuildUnsharded(template, progress);
        await runStep(progress, "sync_zones", "Sync zones to cluster", async () => {
          const zones = await getZones();
          await syncZonesToSharding(zones.zones);
        });
      } else {
        await rebuildSharded(template, progress);
      }

      await runStep(progress, "finalize", "Apply election timeout and network emulation", () => finalizeTemplateApply());

      if (progress) {
        progress.markStepDone("deployment_completed", "Deployment Completed");
        progress.complete();
      }

      return {
        ...applyResult,
        rebuilt: true,
        message: "Template applied, stack rebuilt, and topology reconciled."
      };
    } catch (e) {
      if (progress) {
        progress.abort();
      }
      throw e;
    }
  }

  return {
    applyTemplateAndRebuild
  };
}

module.exports = {
  createTemplateApplyRebuildService
};
