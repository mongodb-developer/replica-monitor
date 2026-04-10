const fs = require("fs/promises");
const path = require("path");
const os = require("os");

function createReplicaNodeLifecycleService(deps) {
  const {
    PROJECT_ROOT,
    getDefaultReplicaSeedHosts,
    getDefaultReplicaSetName,
    SHARD_NAME_PATTERN,
    assertValidServiceName,
    assertValidDataCenter,
    getApplicationServerSettings,
    setApplicationServerSettings,
    normalizeSiteId,
    listComposeServices,
    resolveShardTarget,
    resolvePrimaryServiceForReplicaSet,
    resolveReplicaSetNameFromService,
    assertReplicaAddPreconditions,
    resolveCurrentPrimaryService,
    findFirstAvailableHostPort,
    getNetworksForReplicaNode,
    ensureDockerNetworkExists,
    buildReplicaNodeComposeOverride,
    runCompose,
    runtimeAddedReplicaServices,
    trackedReplicaServices,
    getAllManagedNetworkNames,
    reconcileContainerToNetworks,
    startMongoDB,
    waitForMongodRunning,
    configureNewShardNodeMongodConfig,
    restartMongodForConfigUpdate,
    buildSingleNodeReplicaInitScript,
    runConfigServerMongosEval,
    buildReplicaAddScript,
    reconcileReplicaNodeNetworks,
    syncDataCenterHostsEntries,
    waitForReplicaMemberHealthy,
    isApplicationServerWorkloadRunning,
    signalApplicationServerTopologyChange,
    refreshWorkloadMongoConnectivity,
    applyPersistedReplicaSetElectionTimeout,
    runNetemLatencyScript,
    syncLegacyAppMongoUri,
    removeContainer,
    isolatedContainers,
    resolvePrimaryServiceForTargetMember,
    removeReplicaMemberFromSet
  } = deps;

  function escapeSingleQuotes(value) {
    return String(value || "").replace(/'/g, `'\\''`);
  }

  function buildTemplateNodeEntry(serviceName, role, dataCenterId) {
    const name = String(serviceName || "").trim();
    const dc = String(dataCenterId || "").trim();
    if (role === "analytics") {
      return { name, type: "readOnly", priority: 0, dataCenter: dc };
    }
    return { name, type: "voting", priority: 1, dataCenter: dc };
  }

  async function persistAddedReplicaNodeToTemplateTopology(
    serviceName,
    role,
    normalizedDataCenterId,
    isShardedTopology,
    targetShardName,
    creatingNewShard
  ) {
    const settings = await getApplicationServerSettings();
    const topo = settings.templateTopology;
    if (!topo) {
      return;
    }
    const entry = buildTemplateNodeEntry(serviceName, role, normalizedDataCenterId);
    if (!isShardedTopology) {
      const replicaSet = topo.replicaSet
        ? { ...topo.replicaSet, nodes: [...(topo.replicaSet.nodes || [])] }
        : null;
      if (!replicaSet?.name) {
        return;
      }
      if (replicaSet.nodes.some((n) => String(n.name).trim() === entry.name)) {
        return;
      }
      replicaSet.nodes.push(entry);
      await setApplicationServerSettings({
        ...settings,
        templateTopology: {
          ...topo,
          replicaSet
        }
      });
      return;
    }
    const shardKey = String(targetShardName || "").trim();
    if (!shardKey) {
      return;
    }
    const shards = Array.isArray(topo.shards) ? [...topo.shards] : [];
    const shardIndex = shards.findIndex((s) => String(s.name || "").trim() === shardKey);
    if (shardIndex >= 0) {
      const shard = shards[shardIndex];
      const nodes = [...(shard.nodes || [])];
      if (nodes.some((n) => String(n.name).trim() === entry.name)) {
        return;
      }
      nodes.push(entry);
      shards[shardIndex] = { ...shard, nodes };
    } else if (creatingNewShard) {
      shards.push({ name: shardKey, nodes: [entry] });
    } else {
      return;
    }
    await setApplicationServerSettings({
      ...settings,
      templateTopology: {
        ...topo,
        shards
      }
    });
  }

  async function persistRemovedReplicaNodeFromTemplateTopology(serviceName) {
    const settings = await getApplicationServerSettings();
    const topo = settings.templateTopology;
    if (!topo) {
      return;
    }
    const sid = String(serviceName || "").trim();
    if (!topo.sharded) {
      const prevNodes = topo.replicaSet?.nodes || [];
      const nodes = prevNodes.filter((n) => String(n.name).trim() !== sid);
      if (nodes.length === prevNodes.length) {
        return;
      }
      await setApplicationServerSettings({
        ...settings,
        templateTopology: {
          ...topo,
          replicaSet: { ...topo.replicaSet, nodes }
        }
      });
      return;
    }
    const shards = (topo.shards || []).map((shard) => ({
      ...shard,
      nodes: (shard.nodes || []).filter((n) => String(n.name).trim() !== sid)
    }));
    await setApplicationServerSettings({
      ...settings,
      templateTopology: {
        ...topo,
        shards
      }
    });
  }

  async function configureReplicaNodeReplSetName(serviceName, replicaSetName) {
    const escapedReplicaSetName = escapeSingleQuotes(replicaSetName);
    await runCompose(
      [
        "exec",
        "-T",
        serviceName,
        "bash",
        "-lc",
        `set -e
if grep -q '^[[:space:]]*replSetName:' /etc/mongod.conf; then
  sed -i 's/^[[:space:]]*replSetName:[[:space:]]*.*$/  replSetName: ${escapedReplicaSetName}/' /etc/mongod.conf
else
  printf '\\nreplication:\\n  replSetName: ${escapedReplicaSetName}\\n' >> /etc/mongod.conf
fi`
      ],
      30000
    );
  }

  /**
   * Before rs.add(), the new node is not yet in the replica set, so rs.conf() fails with
   * "no replset config has been received". Verify replSetName from mongod.conf instead.
   */
  async function assertMongodReplSetNameInConfig(serviceName, expectedReplicaSetName) {
    const expected = String(expectedReplicaSetName || "").trim();
    const { stdout } = await runCompose(
      [
        "exec",
        "-T",
        serviceName,
        "bash",
        "-lc",
        `set -e
raw=$(grep -E '^[[:space:]]*replSetName:' /etc/mongod.conf | head -1 || true)
val=$(echo "$raw" | sed -E 's/^[[:space:]]*replSetName:[[:space:]]*//' | tr -d "'\\r")
echo "$val"`
      ],
      15000
    );
    const actual = String(stdout || "").trim();
    if (actual !== expected) {
      throw new Error(
        `replSetName in /etc/mongod.conf mismatch for ${serviceName}: expected "${expected}", got "${actual}".`
      );
    }
  }

  async function removeReplicaNode(serviceName) {
    assertValidServiceName(serviceName);
    const primaryService = await resolvePrimaryServiceForTargetMember(serviceName);
    if (serviceName === primaryService) {
      throw new Error(`${serviceName} cannot be removed while it is the PRIMARY node.`);
    }
    const removalResult = await removeReplicaMemberFromSet(primaryService, serviceName, {
      enforceVotingFloor: true,
      allowMissing: false
    });
    await removeContainer(serviceName);
    runtimeAddedReplicaServices.delete(serviceName);
    trackedReplicaServices.delete(serviceName);
    isolatedContainers.delete(serviceName);
    await reconcileReplicaNodeNetworks();
    await syncDataCenterHostsEntries();
    await runNetemLatencyScript("apply", { strict: false });
    await syncLegacyAppMongoUri();
    await persistRemovedReplicaNodeFromTemplateTopology(serviceName);
    return { service: serviceName, primaryService, removalResult };
  }

  async function addReplicaNode(serviceName, role, dataCenter, shardName = null, dataCenterId = null) {
    assertValidServiceName(serviceName);
    if (role !== "voting" && role !== "analytics") {
      throw new Error(`Unsupported replica node role: ${role}`);
    }
    assertValidDataCenter(dataCenter);
    const settings = await getApplicationServerSettings();
    const configuredDataCenters = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
    const normalizedDataCenterId = normalizeSiteId(
      dataCenterId,
      configuredDataCenters,
      normalizeSiteId(dataCenter, configuredDataCenters, String(configuredDataCenters[0]?.id || ""))
    );
    const normalizedShardName = String(shardName || "").trim();
    if (normalizedShardName && !SHARD_NAME_PATTERN.test(normalizedShardName)) {
      throw new Error("Invalid shard name. Allowed characters: letters, numbers, hyphen, underscore.");
    }

    const existingServices = await listComposeServices(true);
    if (existingServices.includes(serviceName)) {
      throw new Error(`Service already exists: ${serviceName}`);
    }

    const isShardedTopology = Boolean(settings?.templateTopology?.sharded);
    let primaryService = null;
    let targetReplicaSetName = getDefaultReplicaSetName();
    let targetShardName = null;
    let creatingNewShard = false;
    let seedHosts = getDefaultReplicaSeedHosts();

    if (isShardedTopology) {
      if (!normalizedShardName) {
        throw new Error("shardName is required when sharding is enabled.");
      }
      const existingShard = await resolveShardTarget(normalizedShardName);
      targetShardName = normalizedShardName;
      if (existingShard) {
        primaryService = await resolvePrimaryServiceForReplicaSet(
          existingShard.replSetName,
          existingShard.hosts
        );
        targetReplicaSetName =
          (await resolveReplicaSetNameFromService(primaryService)) || existingShard.replSetName;
        seedHosts = existingShard.hosts.length
          ? existingShard.hosts
          : [`${primaryService}:27017`];
        await assertReplicaAddPreconditions(primaryService, serviceName, role);
      } else {
        if (role !== "voting") {
          throw new Error("Cannot create a new shard with an analytics node. First node must be voting.");
        }
        creatingNewShard = true;
        targetReplicaSetName = normalizedShardName;
        seedHosts = [`${serviceName}:27017`];
      }
    } else {
      primaryService = await resolveCurrentPrimaryService();
      targetReplicaSetName =
        (await resolveReplicaSetNameFromService(primaryService)) || targetReplicaSetName;
      await assertReplicaAddPreconditions(primaryService, serviceName, role);
      seedHosts = [`${primaryService}:27017`];
    }

    const hostPort = await findFirstAvailableHostPort(27004);
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "failover-monitor-node-"));
    const overridePath = path.join(tmpDir, "docker-compose.override.generated.yml");
    let createdContainer = false;
    try {
      const targetNetworks = getNetworksForReplicaNode(dataCenter, normalizedDataCenterId);
      for (const networkName of targetNetworks) {
        await ensureDockerNetworkExists(networkName);
      }
      const overrideContent = buildReplicaNodeComposeOverride(
        serviceName,
        hostPort,
        targetNetworks,
        targetReplicaSetName,
        seedHosts
      );
      await fs.writeFile(overridePath, overrideContent, "utf8");
      await runCompose(["-f", overridePath, "up", "-d", serviceName], 60000);
      createdContainer = true;
      runtimeAddedReplicaServices.add(serviceName);
      trackedReplicaServices.add(serviceName);
      const managedNetworks = getAllManagedNetworkNames(configuredDataCenters);
      await reconcileContainerToNetworks(serviceName, targetNetworks, managedNetworks);
      await startMongoDB(serviceName);
      await waitForMongodRunning(serviceName, 30000);
      if (isShardedTopology) {
        await configureNewShardNodeMongodConfig(serviceName, targetReplicaSetName);
        await restartMongodForConfigUpdate(serviceName);
        await assertMongodReplSetNameInConfig(serviceName, targetReplicaSetName);
      } else {
        await configureReplicaNodeReplSetName(serviceName, targetReplicaSetName);
        await restartMongodForConfigUpdate(serviceName);
        await assertMongodReplSetNameInConfig(serviceName, targetReplicaSetName);
      }
      if (isShardedTopology && creatingNewShard) {
        const initScript = buildSingleNodeReplicaInitScript(
          targetReplicaSetName,
          serviceName,
          dataCenter,
          normalizedDataCenterId
        );
        const initScriptPath = `/scripts/init-${normalizedShardName}-rs.js`;
        const localInitScriptPath = path.resolve(
          PROJECT_ROOT,
          "scripts",
          `init-${normalizedShardName}-rs.js`
        );
        await fs.writeFile(localInitScriptPath, `${initScript}\n`, "utf8");
        await runCompose(
          ["exec", "-T", serviceName, "mongosh", "--quiet", "--file", initScriptPath],
          60000
        );
        await runConfigServerMongosEval(
          `db.adminCommand({addShard: "${normalizedShardName}/${serviceName}:27017", name: "${normalizedShardName}"})`,
          30000
        );
        const { stdout: shardStatusOutput } = await runConfigServerMongosEval("sh.status()", 30000);
        if (!String(shardStatusOutput || "").includes(normalizedShardName)) {
          throw new Error(`sh.status() does not include new shard ${normalizedShardName}.`);
        }
        if (!String(shardStatusOutput || "").includes(`${serviceName}:27017`)) {
          throw new Error(`sh.status() does not include new shard host ${serviceName}:27017.`);
        }
        primaryService = serviceName;
      } else {
        if (!primaryService) {
          primaryService = await resolveCurrentPrimaryService();
        }
        const script = buildReplicaAddScript(serviceName, role, dataCenter, normalizedDataCenterId);
        await runCompose(
          ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
          30000
        );
      }
      await reconcileReplicaNodeNetworks();
      await syncDataCenterHostsEntries();
      await waitForReplicaMemberHealthy(serviceName, 90000, 1000);
      let workloadTopologySignalResult = { signaled: false, skipped: true, reason: "Workload app not running." };
      if (isApplicationServerWorkloadRunning()) {
        workloadTopologySignalResult = await signalApplicationServerTopologyChange({
          scope: isShardedTopology && targetShardName ? "shard" : "all",
          shardName: isShardedTopology ? targetShardName : null
        });
      }
      const connectivityRefresh = await refreshWorkloadMongoConnectivity({
        restartWhenRunning: false
      });
      await applyPersistedReplicaSetElectionTimeout();
      await runNetemLatencyScript("apply", { strict: false });
      await persistAddedReplicaNodeToTemplateTopology(
        serviceName,
        role,
        normalizedDataCenterId,
        isShardedTopology,
        targetShardName,
        creatingNewShard
      );
      return {
        service: serviceName,
        role,
        dataCenter,
        hostPort,
        primaryService,
        createdNewShard: creatingNewShard,
        shardName: targetShardName,
        replicaSetName: targetReplicaSetName,
        workloadRestarted: connectivityRefresh.workloadRestarted,
        workloadTopologySignal: workloadTopologySignalResult
      };
    } catch (error) {
      if (createdContainer) {
        try {
          await removeContainer(serviceName);
        } catch (_removeError) {
          // Preserve original add-node failure.
        }
        runtimeAddedReplicaServices.delete(serviceName);
        trackedReplicaServices.delete(serviceName);
        isolatedContainers.delete(serviceName);
      }
      throw error;
    } finally {
      await fs.rm(tmpDir, { recursive: true, force: true });
    }
  }

  return {
    addReplicaNode,
    removeReplicaNode
  };
}

module.exports = {
  createReplicaNodeLifecycleService
};
