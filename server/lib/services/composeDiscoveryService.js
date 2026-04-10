function createComposeDiscoveryService(deps) {
  const {
    runCompose,
    nonReplicaComposeServices,
    isApplicationServerComposeServiceName,
    defaultStatusQueryServices,
    getDefaultStatusQueryServices,
    trackedReplicaServices,
    getPreferredStatusService,
    getPreferredStatusServiceForShard
  } = deps;

  function resolveDefaultStatusQueryServices() {
    if (typeof getDefaultStatusQueryServices === "function") {
      return getDefaultStatusQueryServices();
    }
    return defaultStatusQueryServices;
  }

  function parseServiceListOutput(stdout) {
    return String(stdout || "")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }

  function isReplicaServiceCandidate(serviceName) {
    const name = String(serviceName || "").trim();
    if (nonReplicaComposeServices.has(name)) {
      return false;
    }
    if (typeof isApplicationServerComposeServiceName === "function" && isApplicationServerComposeServiceName(name)) {
      return false;
    }
    return true;
  }

  async function listComposeServices(includeStopped = true) {
    const args = includeStopped ? ["ps", "-a", "--services"] : ["ps", "--services"];
    const { stdout } = await runCompose(args, 10000);
    return parseServiceListOutput(stdout);
  }

  async function listConfiguredComposeServices() {
    const { stdout } = await runCompose(["config", "--services"], 10000);
    return parseServiceListOutput(stdout);
  }

  async function getStatusQueryServices() {
    const discovered = await listComposeServices(true);
    const candidates = new Set([...resolveDefaultStatusQueryServices(), ...trackedReplicaServices]);
    for (const serviceName of discovered) {
      if (isReplicaServiceCandidate(serviceName)) {
        candidates.add(serviceName);
      }
    }
    return [...candidates].filter((serviceName) => isReplicaServiceCandidate(serviceName));
  }

  function buildPreferredFirstOrder(services) {
    const preferredStatusService = getPreferredStatusService();
    if (!preferredStatusService || !services.includes(preferredStatusService)) {
      return services;
    }
    return [
      preferredStatusService,
      ...services.filter((serviceName) => serviceName !== preferredStatusService)
    ];
  }

  function buildPreferredFirstOrderForShard(shardName, services) {
    const preferredForShard = getPreferredStatusServiceForShard(shardName);
    if (!preferredForShard || !services.includes(preferredForShard)) {
      return services;
    }
    return [
      preferredForShard,
      ...services.filter((serviceName) => serviceName !== preferredForShard)
    ];
  }

  return {
    isReplicaServiceCandidate,
    listComposeServices,
    listConfiguredComposeServices,
    getStatusQueryServices,
    buildPreferredFirstOrder,
    buildPreferredFirstOrderForShard
  };
}

module.exports = {
  createComposeDiscoveryService
};
