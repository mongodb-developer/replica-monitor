const fs = require("fs/promises");
const path = require("path");
const { buildFirstShardInitScript, buildDataCenterById } = require("../replicaInitScriptBuilder");

const GENERATED_INIT = "init-rs-template-generated.js";

function createReplicaBootstrapService(deps) {
  const {
    MAX_VOTING_MEMBERS,
    getApplicationServerSettings,
    normalizeDataCenter,
    runCompose,
    cleanupRuntimeReplicaContainers,
    listConfiguredComposeServices,
    isReplicaServiceCandidate,
    resolveCurrentPrimaryService,
    parseJsonPayload,
    reconcileReplicaNodeNetworks,
    syncDataCenterHostsEntries,
    syncLegacyAppMongoUri,
    applyPersistedReplicaSetElectionTimeout,
    runNetemLatencyScript,
    SCRIPTS_DIR
  } = deps;

  async function initReplicaSet(options = {}) {
    const templateApplyRebuild = options.templateApplyRebuild === true;
    const settings = await getApplicationServerSettings();
    const initialDataCenterEntry = settings?.dataCenters?.[0] || null;
    const initialDataCenter = normalizeDataCenter(initialDataCenterEntry?.region);
    const initialDataCenterId = String(initialDataCenterEntry?.id || "").trim() || null;
    const topology = settings?.templateTopology;
    if (!topology) {
      throw new Error("No template topology in settings. Apply a configuration template first.");
    }
    if (topology.sharded) {
      throw new Error(
        "Sharded cluster initialization runs when applying a sharded configuration template. Use Configurations to apply."
      );
    }
    const rs = topology.replicaSet;
    if (!rs?.nodes?.length || !String(rs.name || "").trim()) {
      throw new Error("Unsharded template topology is missing replicaSet.name or replicaSet.nodes.");
    }
    const template = { dataCenters: settings.dataCenters, replicaSet: rs };
    const dcById = buildDataCenterById(template);
    const replicaSetName = String(rs.name).trim();
    const script = buildFirstShardInitScript(replicaSetName, rs.nodes, dcById, normalizeDataCenter);
    const initPath = path.join(SCRIPTS_DIR, GENERATED_INIT);
    await fs.writeFile(initPath, `${script}\n`, "utf8");
    const primaryService = String(rs.nodes[0].name).trim();
    const result = await runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--file", `/scripts/${GENERATED_INIT}`],
      60000
    );
    await cleanupRuntimeReplicaContainers();
    await ensureConfiguredComposeNodesInReplicaSet(initialDataCenter, initialDataCenterId);
    await applyReplicaSetDataCenterOnPrimary(initialDataCenter, initialDataCenterId);
    await ensureDefaultDataCenterTagsOnPrimary(initialDataCenter, initialDataCenterId);
    if (!templateApplyRebuild) {
      await reconcileReplicaNodeNetworks(settings); //GCR - moved first three call in to if statement to avoid duplicate calls on template deploy.
      await syncDataCenterHostsEntries();
      await syncLegacyAppMongoUri();
      await applyPersistedReplicaSetElectionTimeout();
      await runNetemLatencyScript("apply", { strict: false });
    }
    return result;
  }

  function buildEnsureConfiguredNodesScript(
    services,
    defaultDataCenter = "AMER",
    defaultDataCenterId = null
  ) {
    return `
const targetServices = ${JSON.stringify(services)};
const maxVotingMembers = ${MAX_VOTING_MEMBERS};
const defaultDataCenter = ${JSON.stringify(defaultDataCenter)};
const defaultDataCenterId = ${JSON.stringify(defaultDataCenterId)};
const cfg = rs.conf();
const existingHosts = new Set(cfg.members.map((member) => member.host));
let votingCount = cfg.members.filter((member) => Number(member.votes ?? 1) > 0).length;
const added = [];

for (const serviceName of targetServices) {
  const host = serviceName + ":27017";
  if (existingHosts.has(host)) {
    continue;
  }

  const isAnalyticsNode = /^analytics/i.test(serviceName);
  if (isAnalyticsNode) {
    rs.add({
      host,
      priority: 0,
      votes: 0,
      tags: defaultDataCenterId
        ? { role: "analytics", dataCenter: defaultDataCenter, dataCenterId: defaultDataCenterId }
        : { role: "analytics", dataCenter: defaultDataCenter }
    });
    added.push({ host, role: "analytics" });
    existingHosts.add(host);
    continue;
  }

  if (votingCount >= maxVotingMembers) {
    throw new Error(
      "Cannot add " + host + ": maximum of " + maxVotingMembers + " voting members reached."
    );
  }

  rs.add({
    host,
    priority: 1,
    tags: defaultDataCenterId
      ? { dataCenter: defaultDataCenter, dataCenterId: defaultDataCenterId }
      : { dataCenter: defaultDataCenter }
  });
  votingCount += 1;
  added.push({ host, role: "voting" });
  existingHosts.add(host);
}

print(JSON.stringify({ added, votingCount }));
`.trim();
  }

  async function ensureConfiguredComposeNodesInReplicaSet(
    defaultDataCenter = "AMER",
    defaultDataCenterId = null,
    allowedServiceNames = null
  ) {
    const configuredServices = await listConfiguredComposeServices();
    let targetServices = configuredServices.filter(
      (serviceName) => isReplicaServiceCandidate(serviceName)
    );
    if (Array.isArray(allowedServiceNames) && allowedServiceNames.length) {
      const allow = new Set(allowedServiceNames.map((name) => String(name || "").trim()).filter(Boolean));
      targetServices = targetServices.filter((serviceName) => allow.has(serviceName));
    }
    if (!targetServices.length) {
      return { added: [], votingCount: 0 };
    }
    const primaryService = await resolveCurrentPrimaryService();
    const script = buildEnsureConfiguredNodesScript(
      targetServices,
      normalizeDataCenter(defaultDataCenter),
      defaultDataCenterId
    );
    const { stdout } = await runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      60000
    );
    return parseJsonPayload(stdout, "ensure configured compose nodes");
  }

  function buildEnsureDefaultDataCenterTagsScript(defaultDataCenter = "AMER", defaultDataCenterId = null) {
    return `
const cfg = rs.conf();
const defaultDataCenter = ${JSON.stringify(defaultDataCenter)};
const defaultDataCenterId = ${JSON.stringify(defaultDataCenterId)};
let changed = false;
const updatedHosts = [];
for (const member of cfg.members) {
  const tags = member.tags || {};
  if (!tags.dataCenter) {
    member.tags = {
      ...tags,
      dataCenter: defaultDataCenter,
      ...(defaultDataCenterId ? { dataCenterId: defaultDataCenterId } : {})
    };
    updatedHosts.push(member.host);
    changed = true;
  }
}
if (changed) {
  rs.reconfig(cfg);
}
print(JSON.stringify({ changed, updatedHosts }));
`.trim();
  }

  function buildApplyReplicaSetDataCenterScript(defaultDataCenter = "AMER", defaultDataCenterId = null) {
    return `
const cfg = rs.conf();
const defaultDataCenter = ${JSON.stringify(defaultDataCenter)};
const defaultDataCenterId = ${JSON.stringify(defaultDataCenterId)};
let changed = false;
const updatedHosts = [];
for (const member of cfg.members) {
  const tags = member.tags || {};
  if (
    tags.dataCenter !== defaultDataCenter ||
    (defaultDataCenterId && tags.dataCenterId !== defaultDataCenterId)
  ) {
    member.tags = {
      ...tags,
      dataCenter: defaultDataCenter,
      ...(defaultDataCenterId ? { dataCenterId: defaultDataCenterId } : {})
    };
    updatedHosts.push(member.host);
    changed = true;
  }
}
if (changed) {
  rs.reconfig(cfg);
}
print(
  JSON.stringify({
    changed,
    updatedHosts,
    dataCenter: defaultDataCenter,
    dataCenterId: defaultDataCenterId || null
  })
);
`.trim();
  }

  async function applyReplicaSetDataCenterOnPrimary(defaultDataCenter = "AMER", defaultDataCenterId = null) {
    let primaryService;
    try {
      primaryService = await resolveCurrentPrimaryService();
    } catch (_error) {
      return {
        changed: false,
        updatedHosts: [],
        dataCenter: normalizeDataCenter(defaultDataCenter),
        dataCenterId: defaultDataCenterId || null
      };
    }
    const script = buildApplyReplicaSetDataCenterScript(
      normalizeDataCenter(defaultDataCenter),
      defaultDataCenterId
    );
    const { stdout } = await runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      30000
    );
    return parseJsonPayload(stdout, "apply replica-set data center");
  }

  async function ensureDefaultDataCenterTagsOnPrimary(defaultDataCenter = "AMER", defaultDataCenterId = null) {
    let primaryService;
    try {
      primaryService = await resolveCurrentPrimaryService();
    } catch (_error) {
      return { changed: false, updatedHosts: [] };
    }
    const script = buildEnsureDefaultDataCenterTagsScript(
      normalizeDataCenter(defaultDataCenter),
      defaultDataCenterId
    );
    const { stdout } = await runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      30000
    );
    return parseJsonPayload(stdout, "ensure default data center tags");
  }

  return {
    initReplicaSet,
    ensureConfiguredComposeNodesInReplicaSet,
    applyReplicaSetDataCenterOnPrimary,
    ensureDefaultDataCenterTagsOnPrimary
  };
}

module.exports = {
  createReplicaBootstrapService
};
