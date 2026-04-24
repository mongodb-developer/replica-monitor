const { APPLICATION_SERVER_MESH_NETWORK_NAME } = require("../applicationServerNaming");
const { createProgressEmitter } = require("../deploymentProgressHub");

function buildShardReplicaSetPlan(skipElectionTimeoutApply) {
  const steps = [
    { id: "prepare_networks", label: "Prepare Docker networks" },
    { id: "config_server_storage", label: "Configure config server storage" },
    { id: "config_server_running", label: "Ensure config server is running" },
    { id: "shard_mongod_configs", label: "Configure shard MongoDB processes" },
    { id: "start_mongos", label: "Start config server routing (mongos)" },
    { id: "add_shard", label: "Add shard to cluster" },
    { id: "shard_collection", label: "Shard application collection" },
    { id: "verify_sh_status", label: "Verify sharding metadata" },
    { id: "wait_shard_labels", label: "Wait for shard labels on replica members" },
    { id: "workload_connectivity", label: "Refresh workload connectivity" }
  ];
  if (!skipElectionTimeoutApply) {
    steps.push({ id: "election_timeout", label: "Apply replica set election timeout" });
  }
  steps.push(
    { id: "persist_topology", label: "Save sharded topology to settings" },
    { id: "deployment_completed", label: "Deployment Completed" }
  );
  return steps;
}

function createShardingLifecycleService(deps) {
  const {
    SHARD_NAME_PATTERN,
    resolveActiveConfigServerContainerName,
    getApplicationServerSettings,
    setApplicationServerSettings,
    resolveDataCenterRegion,
    normalizeSiteId,
    getNetworksForApplicationOrConfig,
    ensureDockerNetworkExists,
    reconcileAllApplicationServerNetworks,
    runCompose,
    configureConfigServerMongodConfig,
    assertConfigServerMongodProcessRunning,
    configureShardServerMongodConfigs,
    reconcileReplicaNodeNetworks,
    syncDataCenterHostsEntries,
    runNetemLatencyScript,
    startConfigServerMongosProcess,
    fetchReplicaStatus,
    memberNameToService,
    runConfigServerMongosEval,
    refreshWorkloadMongoConnectivity,
    applyPersistedReplicaSetElectionTimeout
  } = deps;

  async function waitForShardLabels(expectedHosts, timeoutMs = 30000, intervalMs = 1000) {
    const normalizedHosts = [...new Set((expectedHosts || []).map((host) => String(host || "").trim()))]
      .filter(Boolean);
    if (!normalizedHosts.length) {
      return { ready: true, observedHosts: [] };
    }
    const deadline = Date.now() + timeoutMs;
    while (Date.now() <= deadline) {
      try {
        const status = await fetchReplicaStatus();
        const shardByHost = new Map(
          (status.members || []).map((member) => [String(member.name || "").trim(), member.shard || null])
        );
        const allReady = normalizedHosts.every((host) => Boolean(shardByHost.get(host)));
        if (allReady) {
          return { ready: true, observedHosts: normalizedHosts };
        }
      } catch (_error) {
        // Retry while status settles.
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error("Timed out waiting for shard labels to appear in replica topology status.");
  }

  async function shardReplicaSet(initialShardName = "shard1", options = {}) {
    const normalizedShardName = String(initialShardName || "").trim();
    const firstShardHosts = Array.isArray(options.firstShardHosts)
      ? options.firstShardHosts.map((h) => String(h || "").trim()).filter(Boolean)
      : [];
    const {
      skipElectionTimeoutApply,
      suppressDeploymentProgress,
      progressToken,
      suppressProgressComplete = false
    } = options;

    if (!normalizedShardName) {
      throw new Error("shard name is required.");
    }
    if (!SHARD_NAME_PATTERN.test(normalizedShardName)) {
      throw new Error("Invalid shard name. Allowed characters: letters, numbers, hyphen, underscore.");
    }

    const progress =
      progressToken && !suppressDeploymentProgress ? createProgressEmitter(progressToken) : null;

    if (progress) {
      progress.plan(buildShardReplicaSetPlan(skipElectionTimeoutApply));
    }

    async function run(id, label, fn) {
      if (!progress) {
        return fn();
      }
      return progress.runStep(id, label, fn);
    }

    let workloadRestarted = false;

    try {
      const settings = await getApplicationServerSettings();
      const activeConfigServerContainerName = await resolveActiveConfigServerContainerName();
      const applicationServerRegion = resolveDataCenterRegion(settings.location, settings.dataCenters);
      const applicationServerSiteId = normalizeSiteId(
        settings.location,
        settings.dataCenters,
        String(settings?.dataCenters?.[0]?.id || "")
      );
      const targetNetworks = getNetworksForApplicationOrConfig(applicationServerRegion, applicationServerSiteId);

      await run("prepare_networks", "Prepare Docker networks", async () => {
        for (const networkName of targetNetworks) {
          await ensureDockerNetworkExists(networkName);
        }
        await ensureDockerNetworkExists(APPLICATION_SERVER_MESH_NETWORK_NAME);
        // Conversion runs before templateTopology.sharded is persisted; mesh must be attached anyway
        // so the primary ApplicationServer has an IPv4 on application-server-mesh-net for secondary mongos configDB.
        await reconcileAllApplicationServerNetworks(settings, { forceApplicationServerMesh: true });
      });

      await run("config_server_storage", "Configure config server storage", () => configureConfigServerMongodConfig());
      await run("config_server_running", "Ensure config server is running", () =>
        assertConfigServerMongodProcessRunning()
      );
      await run("shard_mongod_configs", "Configure shard MongoDB processes", () => configureShardServerMongodConfigs());
      await run("start_mongos", "Start config server routing (mongos)", () =>
        startConfigServerMongosProcess({ force: true })
      );

      let latestStatus;
      await run("add_shard", "Add shard to cluster", async () => {
        latestStatus = await fetchReplicaStatus();
        const primaryNode = memberNameToService(latestStatus.primaryName);
        if (!primaryNode) {
          throw new Error("Unable to determine current PRIMARY node for addShard.");
        }
        const hostListForAddShard =
          firstShardHosts.length > 0 ? firstShardHosts.join(",") : `${primaryNode}:27017`;
        const tpl = settings.templateTopology;
        let replSetId = "mongodb-repl-set";
        if (tpl?.replicaSet?.name) {
          replSetId = String(tpl.replicaSet.name).trim() || replSetId;
        } else if (tpl?.sharded && Array.isArray(tpl.shards) && tpl.shards[0]?.name) {
          replSetId = String(tpl.shards[0].name).trim() || replSetId;
        }
        await runConfigServerMongosEval(
          `db.adminCommand({addShard: "${replSetId}/${hostListForAddShard}", name: "${normalizedShardName}"})`,
          30000
        );
      });

      await run("shard_collection", "Shard application collection", () =>
        runCompose(
          [
            "exec",
            "-T",
            activeConfigServerContainerName,
            "mongosh",
            "--quiet",
            "--eval",
            'const adminDB = db.getSiblingDB("admin"); adminDB.runCommand({ shardCollection: "architect_day.counter", key: { country: 1 } })'
          ],
          30000
        )
      );

      let shardStatusOutput;
      await run("verify_sh_status", "Verify sharding metadata", async () => {
        const result = await runConfigServerMongosEval("sh.status()", 30000);
        shardStatusOutput = result.stdout;
        if (!String(shardStatusOutput || "").includes(normalizedShardName)) {
          throw new Error(`sh.status() does not include ${normalizedShardName}.`);
        }
        const missingHosts = (latestStatus.members || [])
          .map((member) => String(member.name || "").trim())
          .filter(Boolean)
          .filter((host) => !String(shardStatusOutput || "").includes(host));
        if (missingHosts.length) {
          throw new Error(`sh.status() is missing replica set hosts: ${missingHosts.join(", ")}`);
        }
      });

      await run("wait_shard_labels", "Wait for shard labels on replica members", () =>
        waitForShardLabels(
          (latestStatus.members || []).map((member) => String(member.name || "").trim()),
          30000,
          1000
        )
      );

      await run("workload_connectivity", "Refresh workload connectivity", async () => {
        const connectivityRefresh = await refreshWorkloadMongoConnectivity({ restartWhenRunning: true });
        workloadRestarted = connectivityRefresh.workloadRestarted;
      });

      if (!skipElectionTimeoutApply) {
        await run("election_timeout", "Apply replica set election timeout", () =>
          applyPersistedReplicaSetElectionTimeout()
        );
      }

      await run("persist_topology", "Save sharded topology to settings", async () => {
        const persistedAfterShard = await getApplicationServerSettings();
        const prevTopo = persistedAfterShard.templateTopology || {};
        let replicaNodes = Array.isArray(prevTopo.replicaSet?.nodes)
          ? prevTopo.replicaSet.nodes.map((node) => ({ ...node }))
          : [];
        if (!replicaNodes.length && prevTopo.sharded && Array.isArray(prevTopo.shards)) {
          const shardEntry =
            prevTopo.shards.find((s) => String(s.name || "").trim() === normalizedShardName) ||
            prevTopo.shards[0];
          if (shardEntry && Array.isArray(shardEntry.nodes) && shardEntry.nodes.length) {
            replicaNodes = shardEntry.nodes.map((node) => ({ ...node }));
          }
        }
        await setApplicationServerSettings({
          ...persistedAfterShard,
          templateTopology: {
            sharded: true,
            replicaSet: null,
            shards: [
              {
                name: normalizedShardName,
                nodes: replicaNodes
              }
            ]
          }
        });
      });

      const shardResult = {
        alreadyExists: false,
        container: activeConfigServerContainerName,
        hostPort: null,
        networks: targetNetworks,
        workloadRestarted,
        message: `Replica set sharded as ${normalizedShardName}. ApplicationServer configured as config/mongos host.`,
        deploymentProfile: "consolidated"
      };

      if (progress) {
        progress.markStepDone("deployment_completed", "Deployment Completed");
        if (!suppressProgressComplete) {
          progress.complete(shardResult);
        }
      }

      return shardResult;
    } catch (error) {
      if (progress) {
        progress.fatal(error.message);
        return null;
      }
      throw error;
    }
  }

  return {
    shardReplicaSet
  };
}

module.exports = {
  createShardingLifecycleService
};
