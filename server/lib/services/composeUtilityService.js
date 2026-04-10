function createComposeUtilityService(deps) {
  const {
    SERVICE_NAME_PATTERN,
    VALID_DATA_CENTERS,
    fetchRunningServices,
    runningServicesContains,
    applicationServerReadyPollIntervalMs
  } = deps;

  function assertValidServiceName(serviceName) {
    if (!SERVICE_NAME_PATTERN.test(serviceName || "")) {
      throw new Error(`Invalid service name: ${serviceName}`);
    }
  }

  function assertValidDataCenter(dataCenter) {
    if (!VALID_DATA_CENTERS.includes(dataCenter)) {
      throw new Error(`Invalid data center: ${dataCenter}`);
    }
  }

  function normalizeSiteId(value, configuredDataCenters, fallbackSiteId = null) {
    const raw = String(value || "").trim();
    if (!raw) {
      return fallbackSiteId;
    }
    const byId = (configuredDataCenters || []).find((entry) => String(entry?.id || "").trim() === raw);
    if (byId) {
      return String(byId.id);
    }
    const normalizedRegion = raw.toUpperCase();
    if (VALID_DATA_CENTERS.includes(normalizedRegion)) {
      const firstInRegion = (configuredDataCenters || []).find(
        (entry) => String(entry?.region || "").trim().toUpperCase() === normalizedRegion
      );
      if (firstInRegion) {
        return String(firstInRegion.id);
      }
    }
    return fallbackSiteId;
  }

  function buildDataCenterLocalNetworkName(siteId) {
    const normalized = String(siteId || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9_.-]+/g, "-")
      .replace(/^-+|-+$/g, "");
    return normalized ? `dc-${normalized}-net` : null;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForServiceRunning(serviceName, timeoutMs) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      const runningServices = await fetchRunningServices();
      if (runningServicesContains(runningServices, serviceName)) {
        return;
      }
      await sleep(applicationServerReadyPollIntervalMs);
    }
    throw new Error(`Timed out waiting for ${serviceName} to start.`);
  }

  return {
    assertValidServiceName,
    assertValidDataCenter,
    normalizeSiteId,
    buildDataCenterLocalNetworkName,
    sleep,
    waitForServiceRunning
  };
}

module.exports = {
  createComposeUtilityService
};
