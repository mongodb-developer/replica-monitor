const { spawnSync } = require("child_process");
const { normalizeComposeArgs } = require("../composeFileArgs");

function createStatusQueryService(deps) {
  const {
    runCompose,
    parseSummaryOutput,
    normalizeStatus,
    getStatusQueryServices,
    buildPreferredFirstOrder,
    memberNameToService,
    DEFAULT_STATUS_QUERY_SERVICES,
    getDefaultStatusQueryServices,
    trackedReplicaServices,
    PROJECT_ROOT
  } = deps;

  function resolveDefaultStatusQueryServicesSync() {
    if (typeof getDefaultStatusQueryServices === "function") {
      return getDefaultStatusQueryServices();
    }
    return DEFAULT_STATUS_QUERY_SERVICES;
  }

  async function queryStatusFromService(serviceName) {
    const { stdout } = await runCompose(
      ["exec", "-T", serviceName, "mongosh", "--quiet", "--file", "/scripts/summary.js"],
      20000
    );
    const payload = parseSummaryOutput(stdout);
    return normalizeStatus(payload);
  }

  async function resolveCurrentPrimaryService() {
    const services = await getStatusQueryServices();
    for (const serviceName of services) {
      try {
        const status = await queryStatusFromService(serviceName);
        const primaryService = memberNameToService(status.primaryName);
        if (services.includes(primaryService)) {
          return primaryService;
        }
      } catch (_error) {
        // Try next service.
      }
    }
    throw new Error("Unable to determine current primary service.");
  }

  async function getStatusQueryOrder() {
    const services = await getStatusQueryServices();
    return buildPreferredFirstOrder(services);
  }

  function queryStatusFromServiceSync(serviceName) {
    const result = spawnSync(
      "docker",
      [
        "compose",
        ...normalizeComposeArgs(PROJECT_ROOT, [
          "exec",
          "-T",
          serviceName,
          "mongosh",
          "--quiet",
          "--file",
          "/scripts/summary.js"
        ])
      ],
      { cwd: PROJECT_ROOT, encoding: "utf8" }
    );
    if (result.status !== 0) {
      throw new Error((result.stderr || "").trim() || `status query failed for ${serviceName}`);
    }
    const payload = parseSummaryOutput(result.stdout || "");
    return normalizeStatus(payload);
  }

  function resolveCurrentPrimaryServiceSync() {
    const services = [...resolveDefaultStatusQueryServicesSync(), ...trackedReplicaServices];
    for (const serviceName of services) {
      try {
        const status = queryStatusFromServiceSync(serviceName);
        const primaryService = memberNameToService(status.primaryName);
        if (primaryService) {
          return primaryService;
        }
      } catch (_error) {
        // Try next service.
      }
    }
    throw new Error("Unable to determine current primary service (sync).");
  }

  return {
    queryStatusFromService,
    resolveCurrentPrimaryService,
    getStatusQueryOrder,
    queryStatusFromServiceSync,
    resolveCurrentPrimaryServiceSync
  };
}

module.exports = {
  createStatusQueryService
};
