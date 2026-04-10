function createStatusNodeSelectionService(deps) {
  const {
    assertValidServiceName,
    getStatusQueryServices,
    buildServiceRuntimeStatus,
    getApplicationServerSettings,
    doesContainerExist,
    CONFIG_SERVER_CONTAINER_NAME,
    listShardsFromConfigServer,
    preferredStatusServiceByShard,
    getPreferredStatusService,
    setPreferredStatusServiceValue,
    setAutoStatusNodeSelectionEnabled,
    stopPrimaryReelectionChecks
  } = deps;

  async function setPreferredStatusService(serviceName, shardName = null) {
    assertValidServiceName(serviceName);
    const statusServices = await getStatusQueryServices();
    if (!statusServices.includes(serviceName)) {
      throw new Error(`Unsupported status query service: ${serviceName}`);
    }
    const serviceRuntime = await buildServiceRuntimeStatus();
    const runtime = serviceRuntime[serviceName];
    if (!runtime?.containerRunning || !runtime?.mongodRunning) {
      throw new Error(`Service ${serviceName} is not eligible as a status node.`);
    }
    const configServerExists = await doesContainerExist(CONFIG_SERVER_CONTAINER_NAME);
    let topologySharded = false;
    try {
      const settings = await getApplicationServerSettings();
      topologySharded = Boolean(settings?.templateTopology?.sharded);
    } catch (_error) {
      topologySharded = false;
    }
    if (configServerExists && topologySharded) {
      let resolvedShardName = String(shardName || "").trim();
      const shards = await listShardsFromConfigServer();
      if (!resolvedShardName) {
        const host = `${serviceName}:27017`;
        const matched = shards.find((shard) => (shard.hosts || []).includes(host));
        if (!matched) {
          throw new Error(`Unable to resolve shard for service ${serviceName}.`);
        }
        resolvedShardName = matched.shardName;
      }
      const shard = shards.find((entry) => entry.shardName === resolvedShardName);
      if (!shard) {
        throw new Error(`Unknown shard: ${resolvedShardName}`);
      }
      const host = `${serviceName}:27017`;
      if (!(shard.hosts || []).includes(host)) {
        throw new Error(`Service ${serviceName} is not a member of shard ${resolvedShardName}.`);
      }
      preferredStatusServiceByShard.set(resolvedShardName, serviceName);
      return {
        preferredStatusService: serviceName,
        preferredStatusServiceByShard: Object.fromEntries(preferredStatusServiceByShard),
        serviceRuntime,
        shardName: resolvedShardName
      };
    }
    setPreferredStatusServiceValue(serviceName);
    setAutoStatusNodeSelectionEnabled(false);
    stopPrimaryReelectionChecks();
    return {
      preferredStatusService: getPreferredStatusService(),
      preferredStatusServiceByShard: Object.fromEntries(preferredStatusServiceByShard),
      serviceRuntime
    };
  }

  return {
    setPreferredStatusService
  };
}

module.exports = {
  createStatusNodeSelectionService
};
