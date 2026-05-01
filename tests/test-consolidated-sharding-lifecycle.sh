#!/usr/bin/env bash
set -euo pipefail

node - <<'EOF'
const assert = require("assert/strict");
const { createShardingLifecycleService } = require("./server/lib/services/shardingLifecycleService");

(async () => {
  const composeCalls = [];

  const service = createShardingLifecycleService({
    SHARD_NAME_PATTERN: /^[A-Za-z0-9_-]+$/,
    resolveActiveConfigServerContainerName: async () => "ApplicationServer-ireland",
    getApplicationServerSettings: async () => ({
      location: "ireland",
      dataCenters: [{ id: "ireland", region: "europe" }],
      templateTopology: {
        sharded: false,
        replicaSet: {
          name: "mongodb-repl-set",
          nodes: [{ name: "Default_1", dataCenter: "ireland" }]
        },
        shards: null
      }
    }),
    setApplicationServerSettings: async (next) => next,
    resolveDataCenterRegion: () => "europe",
    normalizeSiteId: () => "ireland",
    getNetworksForApplicationOrConfig: () => ["europe-shared", "europe-ireland-local"],
    ensureDockerNetworkExists: async () => {},
    reconcileAllApplicationServerNetworks: async () => {},
    runCompose: async (args) => {
      composeCalls.push(args);
      return { stdout: "", stderr: "" };
    },
    configureConfigServerMongodConfig: async () => {},
    assertConfigServerMongodProcessRunning: async () => {},
    configureShardServerMongodConfigs: async () => {},
    reconcileReplicaNodeNetworks: async () => {},
    syncDataCenterHostsEntries: async () => {},
    writeNetemTargetContainersFile: async () => {},
    runNetemLatencyScript: async () => {},
    startConfigServerMongosProcess: async () => {},
    fetchReplicaStatus: async () => ({
      primaryName: "Default_1:27017",
      members: [{ name: "Default_1:27017", shard: "shard1" }]
    }),
    memberNameToService: (memberName) => String(memberName || "").split(":")[0],
    runConfigServerMongosEval: async (evalJs) => {
      if (String(evalJs || "").includes("sh.status()")) {
        return { stdout: "shard1\nDefault_1:27017\n" };
      }
      return { stdout: "" };
    },
    refreshWorkloadMongoConnectivity: async () => ({ workloadRestarted: false }),
    applyPersistedReplicaSetElectionTimeout: async () => {}
  });

  const result = await service.shardReplicaSet("shard1");

  assert.equal(result.deploymentProfile, "consolidated");
  assert.equal(result.container, "ApplicationServer-ireland");

  const configServerComposeUpCall = composeCalls.find((args) =>
    Array.isArray(args)
      && args.includes("up")
      && args.includes("-d")
      && args.includes("ConfigServer")
  );
  assert.equal(Boolean(configServerComposeUpCall), false, "Should not run compose up for ConfigServer.");

  const shardCollectionExecCall = composeCalls.find((args) =>
    Array.isArray(args)
      && args[0] === "exec"
      && args[2] === "ApplicationServer-ireland"
      && args.includes("mongosh")
      && args.some((entry) => String(entry).includes("architect_day.counter"))
  );
  assert.equal(Boolean(shardCollectionExecCall), true, "Expected shardCollection to execute against ApplicationServer.");

  console.log("PASS: consolidated sharding lifecycle uses primary ApplicationServer without ConfigServer container create/remove.");
})().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
EOF
