/**
 * `docker compose ps --services` may report names in a different case than compose file keys (e.g. lowercase).
 */
function runningServicesContains(runningServices, serviceName) {
  if (!runningServices || serviceName == null || serviceName === "") {
    return false;
  }
  if (runningServices.has(serviceName)) {
    return true;
  }
  const want = String(serviceName).toLowerCase();
  for (const s of runningServices) {
    if (String(s).toLowerCase() === want) {
      return true;
    }
  }
  return false;
}

function createRuntimeStatusService(deps) {
  const {
    runCompose,
    getStatusQueryServices
  } = deps;

  async function fetchRunningServices() {
    const { stdout } = await runCompose(["ps", "--status", "running", "--services"], 10000);
    return new Set(
      String(stdout || "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    );
  }

  async function checkMongodRunning(serviceName) {
    try {
      await runCompose(["exec", "-T", serviceName, "bash", "-lc", "pidof mongod"], 8000);
      return true;
    } catch (_error) {
      return false;
    }
  }

  async function buildServiceRuntimeStatus() {
    const services = await getStatusQueryServices();
    const runningServices = await fetchRunningServices();
    const entries = await Promise.all(
      services.map(async (serviceName) => {
        const containerRunning = runningServicesContains(runningServices, serviceName);
        const mongodRunning = containerRunning ? await checkMongodRunning(serviceName) : false;
        return [serviceName, { containerRunning, mongodRunning }];
      })
    );
    return Object.fromEntries(entries);
  }

  return {
    fetchRunningServices,
    checkMongodRunning,
    buildServiceRuntimeStatus
  };
}

module.exports = {
  createRuntimeStatusService,
  runningServicesContains
};
