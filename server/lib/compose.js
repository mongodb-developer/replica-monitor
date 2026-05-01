const path = require("path");
const fsSync = require("fs");
const fs = require("fs/promises");
const os = require("os");
const net = require("net");
const { execFile, spawnSync } = require("child_process");
const { createDockerRuntime } = require("./services/dockerRuntime");
const { createNetemService } = require("./services/netemService");
const { createNetworkIsolationService } = require("./services/networkIsolationService");
const { createShardingZoneService } = require("./services/shardingZoneService");
const { createShardingLifecycleService } = require("./services/shardingLifecycleService");
const { createReplicaNodeLifecycleService } = require("./services/replicaNodeLifecycleService");
const { createStatusQueryService } = require("./services/statusQueryService");
const { createApplicationServerLocationService } = require("./services/applicationServerLocationService");
const { createStatusNodeSelectionService } = require("./services/statusNodeSelectionService");
const { createStatusAggregationService } = require("./services/statusAggregationService");
const { createRuntimeStatusService, runningServicesContains } = require("./services/runtimeStatusService");
const { createConfigServerProcessService } = require("./services/configServerProcessService");
const { createNetworkIpAllocationService } = require("./services/networkIpAllocationService");
const { createComposeOverrideService } = require("./services/composeOverrideService");
const { createDockerNetworkService } = require("./services/dockerNetworkService");
const { createMongoContainerControlService } = require("./services/mongoContainerControlService");
const { createConfigServerSetupService } = require("./services/configServerSetupService");
const { createHostPortAllocationService } = require("./services/hostPortAllocationService");
const { createReplicaMembershipScriptService } = require("./services/replicaMembershipScriptService");
const { createScriptCleanupService } = require("./services/scriptCleanupService");
const { createStackLifecycleService } = require("./services/stackLifecycleService");
const { createStatusParsingService } = require("./services/statusParsingService");
const { createComposeDiscoveryService } = require("./services/composeDiscoveryService");
const { createMemberStateCacheService } = require("./services/memberStateCacheService");
const { createClusterDescriptorService } = require("./services/clusterDescriptorService");
const { createContainerInspectService } = require("./services/containerInspectService");
const { createLegacyMongoUriService } = require("./services/legacyMongoUriService");
const { createDataCenterHostsService } = require("./services/dataCenterHostsService");
const { createReplicaBootstrapService } = require("./services/replicaBootstrapService");
const { createElectionTimeoutService } = require("./services/electionTimeoutService");
const { createRuntimeCleanupService } = require("./services/runtimeCleanupService");
const { createPrimaryReelectionService } = require("./services/primaryReelectionService");
const { createNetworkPlacementService } = require("./services/networkPlacementService");
const { createShardMetadataService } = require("./services/shardMetadataService");
const { createComposeUtilityService } = require("./services/composeUtilityService");
const {
  APPLICATION_SERVER_SERVICE,
  isApplicationServerWorkloadRunning,
  applyApplicationServerRuntimeMongoSettings,
  signalApplicationServerTopologyChange,
  startApplicationServerWorkload,
  stopApplicationServerWorkload
} = require("./applicationServer");
const {
  VALID_DATA_CENTERS,
  normalizeDataCenter,
  normalizeElectionTimeoutMs,
  getApplicationServerSettings,
  getApplicationServerLocation,
  getReplicaSetElectionTimeoutMs,
  setApplicationServerSettings,
  resolveDataCenterRegion,
  normalizeTopologyShowShardLabels
} = require("./applicationServerLocation");
const { getCountryCodeBoundaries } = require("./zones");
const { COMPOSE_PROJECT_NAME, normalizeComposeArgs } = require("./composeFileArgs");
const {
  DEFAULT_STATUS_QUERY_SERVICES,
  computeLegacyAppDefaultMongoUriFromSettings,
  readReplicaServiceNamesFromPersistedSettings,
  getDefaultReplicaSetNameFromPersistedSettings
} = require("./persistedSettingsHelpers");
const { createComposeStackGenerationService } = require("./services/composeStackGenerationService");
const {
  isApplicationServerComposeServiceName,
  listApplicationServerServiceNames,
  getPrimaryApplicationServerServiceName
} = require("./applicationServerNaming");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SCRIPTS_DIR = path.resolve(PROJECT_ROOT, "scripts");
const COMPOSE_TIMEOUT_MS = 30000;
/** `docker compose up -d` can exceed default exec timeouts when many services wait on healthchecks (e.g. multi-shard + ApplicationServer depends_on). */
const COMPOSE_UP_TIMEOUT_MS = 300000;
const PRIMARY_REELECTION_CHECK_INTERVAL_MS = 3000;
/** Per–ApplicationServer wait after `compose up`; large sharded stacks can be slow to report running in `docker compose ps`. */
const APPLICATION_SERVER_START_TIMEOUT_MS = 180000;
const APPLICATION_SERVER_READY_POLL_INTERVAL_MS = 2000;
const LEGACY_APP_SCRIPT_PATH = path.resolve(PROJECT_ROOT, "scripts/workload.js");
const SERVICE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/;
const SHARD_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const REGION_NETWORKS = {
  AMER: "amer-net",
  EMEA: "emea-net",
  LATAM: "latam-net",
  APAC: "apac-net"
};
const INTER_REGION_NETWORKS = [
  "amer-emea-net",
  "amer-apac-net",
  "amer-latam-net",
  "latam-emea-net",
  "latam-apac-net",
  "emea-apac-net"
];
const BASE_MANAGED_NETWORKS = [...new Set([...Object.values(REGION_NETWORKS), ...INTER_REGION_NETWORKS])];
const MAX_VOTING_MEMBERS = 7;
const CONFIG_SERVER_CONTAINER_NAME = "ConfigServer";
const NETEM_HELPER_SERVICE = "NetemHelper";
const NON_REPLICA_COMPOSE_SERVICES = new Set([
  APPLICATION_SERVER_SERVICE,
  CONFIG_SERVER_CONTAINER_NAME,
  NETEM_HELPER_SERVICE
]);
const NETWORK_IP_ALLOCATIONS_PATH = path.resolve(
  PROJECT_ROOT,
  "server/data/network-ip-allocations.json"
);
const CONFIG_SERVER_MONGO_URI = "mongodb://ConfigServer:27017?authSource=admin";
let preferredStatusService = null;
const preferredStatusServiceByShard = new Map();
let lastKnownPrimaryService = null;
let autoStatusNodeSelectionEnabled = true;
const isolatedContainers = new Set();
const trackedReplicaServices = new Set(readReplicaServiceNamesFromPersistedSettings());
const runtimeAddedReplicaServices = new Set();
const lastKnownMemberStateByService = new Map();
const lastManagedHostsEntriesByService = new Map();
const ALLOWED_LOCAL_SCRIPT_FILES = new Set([
  "init-rs.js",
  "init-rs-template-generated.js",
  "summary.js",
  "workload.js"
]);
const dockerRuntime = createDockerRuntime({
  projectRoot: PROJECT_ROOT,
  defaultTimeoutMs: COMPOSE_TIMEOUT_MS
});
const netemService = createNetemService({
  projectRoot: PROJECT_ROOT
});
const { runCompose: runComposeCore, runDocker } = dockerRuntime;

function runCompose(args, timeoutMs) {
  return runComposeCore(normalizeComposeArgs(PROJECT_ROOT, args), timeoutMs);
}
const composeDiscoveryService = createComposeDiscoveryService({
  runCompose,
  nonReplicaComposeServices: NON_REPLICA_COMPOSE_SERVICES,
  isApplicationServerComposeServiceName,
  defaultStatusQueryServices: DEFAULT_STATUS_QUERY_SERVICES,
  getDefaultStatusQueryServices: readReplicaServiceNamesFromPersistedSettings,
  trackedReplicaServices,
  getPreferredStatusService: () => preferredStatusService,
  getPreferredStatusServiceForShard: (shardName) => preferredStatusServiceByShard.get(shardName)
});
const statusParsingService = createStatusParsingService({
  isReplicaServiceCandidate,
  inspectContainerAddresses
});
const clusterDescriptorService = createClusterDescriptorService();
const memberStateCacheService = createMemberStateCacheService({
  lastKnownMemberStateByService,
  memberNameToService: (memberName) => statusParsingService.memberNameToService(memberName)
});
const statusQueryService = createStatusQueryService({
  runCompose,
  parseSummaryOutput,
  normalizeStatus,
  getStatusQueryServices,
  buildPreferredFirstOrder,
  memberNameToService,
  DEFAULT_STATUS_QUERY_SERVICES,
  getDefaultStatusQueryServices: readReplicaServiceNamesFromPersistedSettings,
  trackedReplicaServices,
  PROJECT_ROOT
});
const runtimeStatusService = createRuntimeStatusService({
  runCompose,
  getStatusQueryServices
});
const configServerProcessService = createConfigServerProcessService({
  runCompose,
  doesContainerExist,
  getApplicationServerSettings,
  COMPOSE_PROJECT_NAME,
  sleep
});
const networkIpAllocationService = createNetworkIpAllocationService({
  networkIpAllocationsPath: NETWORK_IP_ALLOCATIONS_PATH,
  runDocker,
  getApplicationServerSettings,
  getAllManagedNetworkNames
});
const composeOverrideService = createComposeOverrideService({
  DEFAULT_STATUS_QUERY_SERVICES
});
const dockerNetworkService = createDockerNetworkService({
  PROJECT_ROOT,
  COMPOSE_TIMEOUT_MS,
  COMPOSE_PROJECT_NAME,
  resolveContainerNetworkIpAllocation: (networkName, containerName) =>
    resolveContainerNetworkIpAllocation(networkName, containerName),
  refreshNetworkIpAllocationsFromDocker: () => refreshNetworkIpAllocationsFromDocker(),
  getContainerAttachedNetworks
});
const mongoContainerControlService = createMongoContainerControlService({
  runCompose,
  runDocker,
  assertValidServiceName,
  doesContainerExist,
  CONFIG_SERVER_CONTAINER_NAME,
  listShardsFromConfigServer,
  resolvePrimaryServiceForReplicaSet,
  resolveCurrentPrimaryService,
  COMPOSE_PROJECT_NAME
});
const hostPortAllocationService = createHostPortAllocationService({
  execFile,
  net,
  PROJECT_ROOT,
  COMPOSE_TIMEOUT_MS
});
const replicaMembershipScriptService = createReplicaMembershipScriptService({
  MAX_VOTING_MEMBERS,
  runCompose,
  parseJsonPayload
});
const scriptCleanupService = createScriptCleanupService({
  path,
  fs,
  fsSync,
  scriptsDir: SCRIPTS_DIR,
  allowedLocalScriptFiles: ALLOWED_LOCAL_SCRIPT_FILES
});
const containerInspectService = createContainerInspectService({
  execFile,
  runDocker,
  PROJECT_ROOT,
  COMPOSE_TIMEOUT_MS
});
const configServerSetupService = createConfigServerSetupService({
  runCompose,
  COMPOSE_PROJECT_NAME,
  sleep,
  fetchReplicaStatus,
  memberNameToService,
  checkMongodRunning,
  escapeSingleQuotes,
  getApplicationServerSettings,
  inspectContainerNetworkIp: (containerName, networkName) =>
    containerInspectService.inspectContainerNetworkIp(containerName, networkName),
  isApplicationServerComposeServiceName
});
const dataCenterHostsService = createDataCenterHostsService({
  assertValidServiceName,
  runCompose,
  getApplicationServerSettings,
  VALID_DATA_CENTERS,
  resolveDataCenterRegion,
  normalizeSiteId,
  fetchRunningServices,
  runningServicesContains,
  fetchReplicaStatus,
  memberNameToService,
  isReplicaServiceCandidate,
  configServerContainerName: CONFIG_SERVER_CONTAINER_NAME,
  REGION_NETWORKS,
  buildDataCenterLocalNetworkName,
  inspectContainerNetworkIp,
  lastManagedHostsEntriesByService
});
const legacyMongoUriService = createLegacyMongoUriService({
  fs,
  fsSync,
  legacyAppScriptPath: LEGACY_APP_SCRIPT_PATH,
  getLegacyAppDefaultMongoUri: computeLegacyAppDefaultMongoUriFromSettings,
  configServerMongoUri: CONFIG_SERVER_MONGO_URI,
  defaultStatusQueryServices: DEFAULT_STATUS_QUERY_SERVICES,
  configServerContainerName: CONFIG_SERVER_CONTAINER_NAME,
  doesContainerExist,
  listShardsFromConfigServer,
  fetchReplicaStatus,
  isApplicationServerWorkloadRunning,
  stopApplicationServerWorkload,
  startApplicationServerWorkload
});
const replicaBootstrapService = createReplicaBootstrapService({
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
});
const electionTimeoutService = createElectionTimeoutService({
  normalizeElectionTimeoutMs,
  listShardsFromConfigServer,
  resolvePrimaryServiceForReplicaSet,
  resolveCurrentPrimaryService,
  runCompose,
  getReplicaSetElectionTimeoutMs,
  getDefaultReplicaSetName: getDefaultReplicaSetNameFromPersistedSettings,
  getApplicationServerSettings,
  sleep
});
const runtimeCleanupService = createRuntimeCleanupService({
  assertValidServiceName,
  execFile,
  PROJECT_ROOT,
  COMPOSE_TIMEOUT_MS,
  runCompose,
  parseJsonPayload,
  spawnSync,
  configServerContainerName: CONFIG_SERVER_CONTAINER_NAME,
  runtimeAddedReplicaServices,
  trackedReplicaServices,
  isolatedContainers,
  resolveCurrentPrimaryService,
  resolveCurrentPrimaryServiceSync,
  doesContainerExist,
  listShardsFromConfigServer,
  resolvePrimaryServiceForReplicaSet
});
const primaryReelectionService = createPrimaryReelectionService({
  isAutoStatusNodeSelectionEnabled: () => autoStatusNodeSelectionEnabled,
  getLastKnownPrimaryService: () => lastKnownPrimaryService,
  isContainerIsolated: (serviceName) => isolatedContainers.has(serviceName),
  getStatusQueryServices,
  queryStatusFromService,
  memberNameToService,
  setPreferredStatusService: (serviceName) => {
    preferredStatusService = serviceName;
  },
  setLastKnownPrimaryService: (serviceName) => {
    lastKnownPrimaryService = serviceName;
  },
  primaryReelectionCheckIntervalMs: PRIMARY_REELECTION_CHECK_INTERVAL_MS
});
const networkPlacementService = createNetworkPlacementService({
  INTER_REGION_NETWORKS,
  BASE_MANAGED_NETWORKS,
  REGION_NETWORKS,
  normalizeDataCenter,
  buildDataCenterLocalNetworkName,
  resolveDataCenterRegion,
  normalizeSiteId,
  getApplicationServerSettings,
  VALID_DATA_CENTERS,
  applicationServerService: APPLICATION_SERVER_SERVICE,
  configServerContainerName: CONFIG_SERVER_CONTAINER_NAME,
  getStatusQueryServices,
  queryStatusFromService,
  fetchRunningServices,
  runningServicesContains,
  isReplicaServiceCandidate,
  fetchReplicaStatus,
  getContainerAttachedNetworks,
  reconcileContainerToNetworks,
  doesContainerExist,
  syncDataCenterHostsEntries,
  applyPersistedReplicaSetElectionTimeout,
  runNetemLatencyScript
});
const composeStackGenerationService = createComposeStackGenerationService({
  PROJECT_ROOT,
  getNetworksForReplicaNode: networkPlacementService.getNetworksForReplicaNode,
  getNetworksForApplicationOrConfig: networkPlacementService.getNetworksForApplicationOrConfig,
  resolveDataCenterRegion,
  normalizeSiteId,
  normalizeDataCenter,
  buildDataCenterLocalNetworkName
});

async function resolveConfigServerContainerNameForMongos() {
  try {
    const settings = await getApplicationServerSettings();
    return getPrimaryApplicationServerServiceName(settings) || APPLICATION_SERVER_SERVICE;
  } catch (_error) {
    return APPLICATION_SERVER_SERVICE;
  }
}

const shardMetadataService = createShardMetadataService({
  runCompose,
  runDocker,
  COMPOSE_PROJECT_NAME,
  resolveConfigServerContainerName: resolveConfigServerContainerNameForMongos,
  parseJsonPayload,
  parseShardHostDescriptor,
  memberNameToService,
  queryStatusFromService,
  assertValidServiceName
});
const composeUtilityService = createComposeUtilityService({
  SERVICE_NAME_PATTERN,
  VALID_DATA_CENTERS,
  fetchRunningServices,
  runningServicesContains,
  applicationServerReadyPollIntervalMs: APPLICATION_SERVER_READY_POLL_INTERVAL_MS
});
const stackLifecycleService = createStackLifecycleService({
  resetNetworkIpAllocations,
  runCompose,
  waitForServiceRunning,
  listApplicationServerServiceNames,
  COMPOSE_UP_TIMEOUT_MS,
  APPLICATION_SERVER_START_TIMEOUT_MS,
  runNetemLatencyScript,
  syncLegacyAppMongoUri,
  ensureApplicationServerLocationApplied,
  getApplicationServerSettings,
  normalizeDataCenter,
  ensureDefaultDataCenterTagsOnPrimary,
  syncDataCenterHostsEntries,
  refreshNetworkIpAllocationsFromDocker,
  runNetemLatencyScriptSync,
  spawnSync,
  PROJECT_ROOT,
  collectReplicaNodesFromSettings: composeStackGenerationService.collectReplicaNodesFromSettings,
  writeGeneratedComposeFile: composeStackGenerationService.writeGeneratedComposeFile,
  removeGeneratedComposeFile: composeStackGenerationService.removeGeneratedComposeFile,
  ensureComposeRegionalNetworks: () => dockerNetworkService.ensureComposeRegionalNetworks()
});

const networkIsolationService = createNetworkIsolationService({
  assertValidServiceName,
  resolveServicePlacement,
  normalizeDataCenter,
  REGION_NETWORKS,
  CONFIG_SERVER_CONTAINER_NAME,
  getNetworksForApplicationOrConfig,
  getNetworksForReplicaNode,
  updateContainerNetworks,
  isolatedContainers,
  isAutoStatusNodeSelectionEnabled: () => autoStatusNodeSelectionEnabled,
  getLastKnownPrimaryService: () => lastKnownPrimaryService,
  startPrimaryReelectionChecksIfNeeded,
  stopPrimaryReelectionChecks,
  getApplicationServerSettings,
  getAllManagedNetworkNames,
  fetchReplicaStatus,
  memberNameToService,
  resolveDataCenterRegion,
  doesContainerExist,
  getInterRegionNetworksForRegion,
  ensureDockerNetworkExists,
  resolveContainerNetworkIpAllocation,
  runDockerNetworkCommand,
  isIgnorableNetworkError,
    refreshNetworkIpAllocationsFromDocker,
    runNetemLatencyScript,
    stopMongosOnApplicationServers,
    startMongosOnApplicationServers,
    resolveActiveConfigServerContainerName
});
const shardingZoneService = createShardingZoneService({
  getCountryCodeBoundaries,
  doesContainerExist,
  resolveConfigServerContainerName: resolveConfigServerContainerNameForMongos,
  ensureConfigServerMongosProcessRunning,
  runConfigServerMongosEval,
  parseJsonPayload,
  sleep
});
const shardingLifecycleService = createShardingLifecycleService({
  SHARD_NAME_PATTERN,
  resolveActiveConfigServerContainerName,
  getApplicationServerSettings,
  setApplicationServerSettings,
  resolveDataCenterRegion,
  normalizeSiteId,
  getNetworksForApplicationOrConfig,
  ensureDockerNetworkExists,
  reconcileAllApplicationServerNetworks: (settings, options) =>
    networkPlacementService.reconcileAllApplicationServerNetworks(settings, options),
  runCompose,
  configureConfigServerMongodConfig,
  assertConfigServerMongodProcessRunning,
  configureShardServerMongodConfigs,
  reconcileReplicaNodeNetworks,
  syncDataCenterHostsEntries,
  writeNetemTargetContainersFile: composeStackGenerationService.writeNetemTargetContainersFile,
  runNetemLatencyScript,
  startConfigServerMongosProcess,
  fetchReplicaStatus,
  memberNameToService,
  runConfigServerMongosEval,
  refreshWorkloadMongoConnectivity,
  applyPersistedReplicaSetElectionTimeout
});
const replicaNodeLifecycleService = createReplicaNodeLifecycleService({
  PROJECT_ROOT,
  getDefaultReplicaSeedHosts: () =>
    readReplicaServiceNamesFromPersistedSettings().map((service) => `${service}:27017`),
  getDefaultReplicaSetName: getDefaultReplicaSetNameFromPersistedSettings,
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
  writeNetemTargetContainersFile: composeStackGenerationService.writeNetemTargetContainersFile,
  syncLegacyAppMongoUri,
  removeContainer,
  isolatedContainers,
  resolvePrimaryServiceForTargetMember,
  removeReplicaMemberFromSet
});
const applicationServerLocationService = createApplicationServerLocationService({
  getApplicationServerSettings,
  setApplicationServerSettings,
  normalizeTopologyShowShardLabels,
  applyPersistedReplicaSetElectionTimeout,
  isApplicationServerWorkloadRunning,
  stopApplicationServerWorkload,
  startApplicationServerWorkload,
  applyApplicationServerRuntimeMongoSettings
});
const statusNodeSelectionService = createStatusNodeSelectionService({
  assertValidServiceName,
  getStatusQueryServices,
  buildServiceRuntimeStatus,
  getApplicationServerSettings,
  doesContainerExist,
  CONFIG_SERVER_CONTAINER_NAME,
  listShardsFromConfigServer,
  preferredStatusServiceByShard,
  getPreferredStatusService: () => preferredStatusService,
  setPreferredStatusServiceValue: (serviceName) => {
    preferredStatusService = serviceName;
  },
  setAutoStatusNodeSelectionEnabled: (enabled) => {
    autoStatusNodeSelectionEnabled = Boolean(enabled);
  },
  stopPrimaryReelectionChecks
});
const statusAggregationService = createStatusAggregationService({
  getApplicationServerSettings,
  doesContainerExist,
  CONFIG_SERVER_CONTAINER_NAME,
  listShardsFromConfigServer,
  preferredStatusServiceByShard,
  buildPreferredFirstOrderForShard,
  queryStatusFromService,
  memberNameToService,
  trackedReplicaServices,
  buildUnavailableMember,
  rememberMemberState,
  buildServiceRuntimeStatus,
  buildMemberAddressMap,
  setLastKnownPrimaryService: (serviceName) => {
    lastKnownPrimaryService = serviceName;
  },
  getPreferredStatusService: () => preferredStatusService,
  getStatusQueryOrder,
  resolveShardByHostFromConfigServer,
  isReplicaServiceCandidate
});

function resetRuntimeState() {
  preferredStatusService = null;
  preferredStatusServiceByShard.clear();
  lastKnownPrimaryService = null;
  autoStatusNodeSelectionEnabled = true;
  stopPrimaryReelectionChecks();
  isolatedContainers.clear();
  trackedReplicaServices.clear();
  readReplicaServiceNamesFromPersistedSettings().forEach((serviceName) => trackedReplicaServices.add(serviceName));
  runtimeAddedReplicaServices.clear();
  lastKnownMemberStateByService.clear();
  lastManagedHostsEntriesByService.clear();
}

async function runNetemLatencyScript(action, options = {}) {
  return netemService.run(action, options);
}

function runNetemLatencyScriptSync(action) {
  return netemService.runSync(action);
}

/** Mongos is only used for sharded clusters; unsharded consolidated stacks use ApplicationServer as a normal replica-set host (no /etc/mongos.conf). */
async function isPersistedTopologySharded() {
  try {
    const settings = await getApplicationServerSettings();
    return Boolean(settings?.templateTopology?.sharded);
  } catch (_error) {
    return false;
  }
}

async function resolveActiveConfigServerContainerName() {
  try {
    const settings = await getApplicationServerSettings();
    const primary = getPrimaryApplicationServerServiceName(settings);
    return primary || APPLICATION_SERVER_SERVICE;
  } catch (_error) {
    return APPLICATION_SERVER_SERVICE;
  }
}

async function setLegacyAppMongoUriToDefault() {
  return legacyMongoUriService.setLegacyAppMongoUriToDefault();
}

function setLegacyAppMongoUriToDefaultSync() {
  return legacyMongoUriService.setLegacyAppMongoUriToDefaultSync();
}

async function syncLegacyAppMongoUri() {
  return legacyMongoUriService.syncLegacyAppMongoUri();
}

async function refreshWorkloadMongoConnectivity(options = {}) {
  return legacyMongoUriService.refreshWorkloadMongoConnectivity(options);
}

async function inspectContainerNetworkIp(containerName, networkName) {
  return containerInspectService.inspectContainerNetworkIp(containerName, networkName);
}

async function getContainerAttachedNetworks(containerName) {
  return containerInspectService.getContainerAttachedNetworks(containerName);
}

async function inspectContainerAddresses(containerName) {
  return containerInspectService.inspectContainerAddresses(containerName);
}

async function buildMemberAddressMap(members) {
  return statusParsingService.buildMemberAddressMap(members);
}

function escapeSingleQuotes(text) {
  return dataCenterHostsService.escapeSingleQuotes(text);
}

async function syncDataCenterHostsEntries() {
  return dataCenterHostsService.syncDataCenterHostsEntries();
}

function parseSummaryOutput(rawOutput) {
  return statusParsingService.parseSummaryOutput(rawOutput);
}

function memberNameToService(memberName) {
  return statusParsingService.memberNameToService(memberName);
}

function parseShardHostDescriptor(hostDescriptor) {
  return clusterDescriptorService.parseShardHostDescriptor(hostDescriptor);
}

function isReplicaServiceCandidate(serviceName) {
  return composeDiscoveryService.isReplicaServiceCandidate(serviceName);
}

async function listComposeServices(includeStopped = true) {
  return composeDiscoveryService.listComposeServices(includeStopped);
}

async function listConfiguredComposeServices() {
  return composeDiscoveryService.listConfiguredComposeServices();
}

async function getStatusQueryServices() {
  return composeDiscoveryService.getStatusQueryServices();
}

function buildPreferredFirstOrder(services) {
  return composeDiscoveryService.buildPreferredFirstOrder(services);
}

function buildPreferredFirstOrderForShard(shardName, services) {
  return composeDiscoveryService.buildPreferredFirstOrderForShard(shardName, services);
}

function normalizeStatus(payload) {
  return statusParsingService.normalizeStatus(payload);
}

function rememberMemberState(member) {
  return memberStateCacheService.rememberMemberState(member);
}

function buildUnavailableMember(serviceName, overrides = {}) {
  return memberStateCacheService.buildUnavailableMember(serviceName, overrides);
}

async function startStack(options) {
  return stackLifecycleService.startStack(options);
}

async function stopStack() {
  return stackLifecycleService.stopStack();
}

function stopStackSync() {
  return stackLifecycleService.stopStackSync();
}

async function cleanupGeneratedReplicaInitScripts() {
  return scriptCleanupService.cleanupGeneratedReplicaInitScripts();
}

function cleanupGeneratedReplicaInitScriptsSync() {
  return scriptCleanupService.cleanupGeneratedReplicaInitScriptsSync();
}

function parseJsonPayload(rawOutput, contextLabel) {
  return statusParsingService.parseJsonPayload(rawOutput, contextLabel);
}

async function initReplicaSet(options) {
  return replicaBootstrapService.initReplicaSet(options);
}

async function ensureConfiguredComposeNodesInReplicaSet(
  defaultDataCenter = "AMER",
  defaultDataCenterId = null,
  allowedServiceNames = null
) {
  return replicaBootstrapService.ensureConfiguredComposeNodesInReplicaSet(
    defaultDataCenter,
    defaultDataCenterId,
    allowedServiceNames
  );
}

async function applyReplicaSetDataCenterOnPrimary(defaultDataCenter = "AMER", defaultDataCenterId = null) {
  return replicaBootstrapService.applyReplicaSetDataCenterOnPrimary(defaultDataCenter, defaultDataCenterId);
}

async function ensureDefaultDataCenterTagsOnPrimary(defaultDataCenter = "AMER", defaultDataCenterId = null) {
  return replicaBootstrapService.ensureDefaultDataCenterTagsOnPrimary(defaultDataCenter, defaultDataCenterId);
}

async function queryStatusFromService(serviceName) {
  return statusQueryService.queryStatusFromService(serviceName);
}

async function resolveCurrentPrimaryService() {
  return statusQueryService.resolveCurrentPrimaryService();
}

async function getStatusQueryOrder() {
  return statusQueryService.getStatusQueryOrder();
}

function stopPrimaryReelectionChecks() {
  return primaryReelectionService.stopPrimaryReelectionChecks();
}

function sleep(ms) {
  return composeUtilityService.sleep(ms);
}

async function waitForServiceRunning(serviceName, timeoutMs) {
  return composeUtilityService.waitForServiceRunning(serviceName, timeoutMs);
}

async function fetchRunningServices() {
  return runtimeStatusService.fetchRunningServices();
}

async function checkMongodRunning(serviceName) {
  return runtimeStatusService.checkMongodRunning(serviceName);
}

async function buildServiceRuntimeStatus() {
  return runtimeStatusService.buildServiceRuntimeStatus();
}

async function fetchReplicaStatus() {
  return statusAggregationService.fetchReplicaStatus();
}

async function runConfigServerMongosEval(script, timeoutMs = 30000) {
  return shardMetadataService.runConfigServerMongosEval(script, timeoutMs);
}

async function listShardsFromConfigServer(options = {}) {
  return shardMetadataService.listShardsFromConfigServer(options);
}

async function resolveShardByHostFromConfigServer() {
  return shardMetadataService.resolveShardByHostFromConfigServer();
}

async function resolveShardTarget(shardName) {
  return shardMetadataService.resolveShardTarget(shardName);
}

async function resolveReplicaSetNameFromService(serviceName) {
  return shardMetadataService.resolveReplicaSetNameFromService(serviceName);
}

async function resolvePrimaryServiceForReplicaSet(replSetName, memberHosts = []) {
  return shardMetadataService.resolvePrimaryServiceForReplicaSet(replSetName, memberHosts);
}

async function doesContainerExist(containerName) {
  const normalized = String(containerName || "").trim();
  if (normalized === CONFIG_SERVER_CONTAINER_NAME) {
    try {
      const settings = await getApplicationServerSettings();
      const primary = getPrimaryApplicationServerServiceName(settings);
      return shardMetadataService.doesContainerExist(primary || APPLICATION_SERVER_SERVICE);
    } catch (_error) {
      return shardMetadataService.doesContainerExist(APPLICATION_SERVER_SERVICE);
    }
  }
  return shardMetadataService.doesContainerExist(containerName);
}

function assertValidServiceName(serviceName) {
  return composeUtilityService.assertValidServiceName(serviceName);
}

function assertValidDataCenter(dataCenter) {
  return composeUtilityService.assertValidDataCenter(dataCenter);
}

function normalizeSiteId(value, configuredDataCenters, fallbackSiteId = null) {
  return composeUtilityService.normalizeSiteId(value, configuredDataCenters, fallbackSiteId);
}

function buildDataCenterLocalNetworkName(siteId) {
  return composeUtilityService.buildDataCenterLocalNetworkName(siteId);
}

function getInterRegionNetworksForRegion(region) {
  return networkPlacementService.getInterRegionNetworksForRegion(region);
}

function getAllManagedNetworkNames(configuredDataCenters = []) {
  return networkPlacementService.getAllManagedNetworkNames(configuredDataCenters);
}

function getNetworksForReplicaNode(region, siteId) {
  return networkPlacementService.getNetworksForReplicaNode(region, siteId);
}

function getNetworksForApplicationOrConfig(region, siteId) {
  return networkPlacementService.getNetworksForApplicationOrConfig(region, siteId);
}

async function resolveServicePlacement(serviceName) {
  return networkPlacementService.resolveServicePlacement(serviceName);
}

async function resetNetworkIpAllocations() {
  await networkIpAllocationService.resetNetworkIpAllocations();
}

async function resolveContainerNetworkIpAllocation(networkName, containerName) {
  return networkIpAllocationService.resolveContainerNetworkIpAllocation(networkName, containerName);
}

async function refreshNetworkIpAllocationsFromDocker() {
  return networkIpAllocationService.refreshNetworkIpAllocationsFromDocker();
}

async function runDockerNetworkCommand(command, networkName, containerName, options = {}) {
  return dockerNetworkService.runDockerNetworkCommand(command, networkName, containerName, options);
}

async function ensureDockerNetworkExists(networkName) {
  return dockerNetworkService.ensureDockerNetworkExists(networkName);
}

function isIgnorableNetworkError(action, message) {
  return dockerNetworkService.isIgnorableNetworkError(action, message);
}

async function updateContainerNetworks(containerName, networks, action) {
  return dockerNetworkService.updateContainerNetworks(containerName, networks, action);
}

async function reconcileContainerToNetworks(containerName, desiredNetworks, managedNetworks) {
  return dockerNetworkService.reconcileContainerToNetworks(containerName, desiredNetworks, managedNetworks);
}

async function reconcileApplicationServerNetworks(targetRegion, targetSiteId, configuredDataCenters) {
  return networkPlacementService.reconcileApplicationServerNetworks(targetRegion, targetSiteId, configuredDataCenters);
}

async function reconcileConfigServerNetworks(targetRegion, targetSiteId, configuredDataCenters) {
  return networkPlacementService.reconcileConfigServerNetworks(targetRegion, targetSiteId, configuredDataCenters);
}

async function reconcileReplicaNodeNetworks(settings) {
  return networkPlacementService.reconcileReplicaNodeNetworks(settings);
}

async function ensureApplicationServerLocationApplied(options) {
  return networkPlacementService.ensureApplicationServerLocationApplied(options);
}

async function applyReplicaSetElectionTimeout(electionTimeoutMs, options = {}) {
  return electionTimeoutService.applyReplicaSetElectionTimeout(electionTimeoutMs, options);
}

async function applyPersistedReplicaSetElectionTimeout(options = {}) {
  return electionTimeoutService.applyPersistedReplicaSetElectionTimeout(options);
}

async function updateApplicationServerLocation(nextLocation, electionTimeoutMs = null, mongoSettings = {}) {
  return applicationServerLocationService.updateApplicationServerLocation(
    nextLocation,
    electionTimeoutMs,
    mongoSettings
  );
}

async function updateApplicationServerUserLocation(nextUserLocation) {
  return applicationServerLocationService.updateApplicationServerUserLocation(nextUserLocation);
}

async function setPreferredStatusService(serviceName, shardName = null) {
  return statusNodeSelectionService.setPreferredStatusService(serviceName, shardName);
}

async function checkAndAdoptNewPrimary() {
  return primaryReelectionService.checkAndAdoptNewPrimary();
}

function startPrimaryReelectionChecksIfNeeded() {
  return primaryReelectionService.startPrimaryReelectionChecksIfNeeded();
}

async function stopMongoDBGraceful(serviceName) {
  return mongoContainerControlService.stopMongoDBGraceful(serviceName);
}

async function stopMongoDBHard(serviceName) {
  return mongoContainerControlService.stopMongoDBHard(serviceName);
}

async function startMongoDB(serviceName) {
  return mongoContainerControlService.startMongoDB(serviceName);
}

async function stopContainer(serviceName) {
  return mongoContainerControlService.stopContainer(serviceName);
}

async function startContainer(serviceName) {
  return mongoContainerControlService.startContainer(serviceName);
}

async function resolvePrimaryServiceForTargetMember(serviceName) {
  return runtimeCleanupService.resolvePrimaryServiceForTargetMember(serviceName);
}

async function increaseMongoDBPriority(serviceName) {
  return mongoContainerControlService.increaseMongoDBPriority(serviceName);
}

async function decreaseMongoDBPriority(serviceName) {
  return mongoContainerControlService.decreaseMongoDBPriority(serviceName);
}

async function removeContainer(containerName) {
  return runtimeCleanupService.removeContainer(containerName);
}

async function removeReplicaMemberFromSet(primaryService, serviceName, options = {}) {
  return runtimeCleanupService.removeReplicaMemberFromSet(primaryService, serviceName, options);
}

function queryStatusFromServiceSync(serviceName) {
  return statusQueryService.queryStatusFromServiceSync(serviceName);
}

function resolveCurrentPrimaryServiceSync() {
  return statusQueryService.resolveCurrentPrimaryServiceSync();
}

async function cleanupRuntimeReplicaContainers() {
  return runtimeCleanupService.cleanupRuntimeReplicaContainers();
}

async function cleanupConfigServerContainer() {
  return runtimeCleanupService.cleanupConfigServerContainer();
}

function cleanupRuntimeReplicaContainersSync() {
  return runtimeCleanupService.cleanupRuntimeReplicaContainersSync();
}

function cleanupConfigServerContainerSync() {
  return runtimeCleanupService.cleanupConfigServerContainerSync();
}

async function removeReplicaNode(serviceName) {
  return replicaNodeLifecycleService.removeReplicaNode(serviceName);
}

async function findFirstAvailableHostPort(startPort = 27004) {
  return hostPortAllocationService.findFirstAvailableHostPort(startPort);
}

function buildReplicaNodeComposeOverride(
  serviceName,
  hostPort,
  networkNames,
  replicaSetName,
  seedHosts
) {
  const rsName =
    replicaSetName ||
    (() => {
      try {
        const uri = computeLegacyAppDefaultMongoUriFromSettings();
        const match = String(uri).match(/replicaSet=([^&]+)/);
        return match ? decodeURIComponent(match[1]) : "mongodb-repl-set";
      } catch (_e) {
        return "mongodb-repl-set";
      }
    })();
  const seeds =
    seedHosts ||
    readReplicaServiceNamesFromPersistedSettings().map((service) => `${service}:27017`);
  return composeOverrideService.buildReplicaNodeComposeOverride(
    serviceName,
    hostPort,
    networkNames,
    rsName,
    seeds
  );
}

async function configureConfigServerMongodConfig() {
  return configServerSetupService.configureConfigServerMongodConfig();
}

async function assertConfigServerMongodProcessRunning() {
  return configServerProcessService.assertConfigServerMongodProcessRunning();
}

async function stopConfigServerMongosProcess() {
  if (!(await isPersistedTopologySharded())) {
    return { stopped: false, wasRunning: false };
  }
  return configServerProcessService.stopConfigServerMongosProcess();
}

async function stopMongosOnApplicationServers(containerNames) {
  if (!(await isPersistedTopologySharded())) {
    return { stopped: false, wasRunning: false };
  }
  return configServerProcessService.stopMongosOnApplicationServers(containerNames);
}

/**
 * @param {{ force?: boolean }} [options]
 * force: when true, start mongos even if persisted template is not yet marked sharded (e.g. shardReplicaSet from an unsharded consolidated deploy).
 */
async function startConfigServerMongosProcess(options = {}) {
  if (!options.force && !(await isPersistedTopologySharded())) {
    return { started: false };
  }
  return configServerProcessService.startConfigServerMongosProcess();
}

async function startMongosOnApplicationServers(containerNames, options = {}) {
  if (!options.force && !(await isPersistedTopologySharded())) {
    return { started: false };
  }
  return configServerProcessService.startMongosOnApplicationServers(containerNames);
}

async function ensureConfigServerMongosProcessRunning() {
  if (!(await isPersistedTopologySharded())) {
    return { ensured: false, started: false };
  }
  return configServerProcessService.ensureConfigServerMongosProcessRunning();
}

async function restartConfigServerMongosProcess() {
  if (!(await isPersistedTopologySharded())) {
    return { restarted: false };
  }
  return configServerProcessService.restartConfigServerMongosProcess();
}

async function configureShardServerMongodConfigs() {
  return configServerSetupService.configureShardServerMongodConfigs();
}

async function waitForMongodRunning(serviceName, timeoutMs = 30000) {
  return configServerSetupService.waitForMongodRunning(serviceName, timeoutMs);
}

async function waitForReplicaMemberHealthy(serviceName, timeoutMs = 60000, pollIntervalMs = 1000) {
  return configServerSetupService.waitForReplicaMemberHealthy(serviceName, timeoutMs, pollIntervalMs);
}

async function configureNewShardNodeMongodConfig(serviceName, replicaSetName) {
  return configServerSetupService.configureNewShardNodeMongodConfig(serviceName, replicaSetName);
}

async function restartMongodForConfigUpdate(serviceName) {
  return configServerSetupService.restartMongodForConfigUpdate(serviceName);
}

function buildSingleNodeReplicaInitScript(replicaSetName, serviceName, dataCenter, dataCenterId = null) {
  return replicaMembershipScriptService.buildSingleNodeReplicaInitScript(
    replicaSetName,
    serviceName,
    dataCenter,
    dataCenterId
  );
}

async function assertReplicaAddPreconditions(primaryService, serviceName, role) {
  return replicaMembershipScriptService.assertReplicaAddPreconditions(primaryService, serviceName, role);
}

function buildReplicaAddScript(serviceName, role, dataCenter, dataCenterId = null) {
  return replicaMembershipScriptService.buildReplicaAddScript(serviceName, role, dataCenter, dataCenterId);
}

async function addReplicaNode(serviceName, role, dataCenter, shardName = null, dataCenterId = null) {
  return replicaNodeLifecycleService.addReplicaNode(serviceName, role, dataCenter, shardName, dataCenterId);
}

async function isolateContainerNetwork(containerName) {
  return networkIsolationService.isolateContainerNetwork(containerName);
}

async function connectContainerNetwork(containerName) {
  return networkIsolationService.connectContainerNetwork(containerName);
}

async function isolateDataCenterNetwork(dataCenterId) {
  return networkIsolationService.isolateDataCenterNetwork(dataCenterId);
}

async function connectDataCenterNetwork(dataCenterId) {
  return networkIsolationService.connectDataCenterNetwork(dataCenterId);
}

async function syncZonesToSharding(zones) {
  if (!(await isPersistedTopologySharded())) {
    return {
      deferred: true,
      zonesAppliedToSharding: false,
      message: "Unsharded topology: zones were saved; shard tag and balancer wiring applies only to sharded clusters."
    };
  }
  return shardingZoneService.syncZonesToSharding(zones);
}

async function shardReplicaSet(initialShardName = "shard1", options = {}) {
  return shardingLifecycleService.shardReplicaSet(initialShardName, options);
}

const { getZones } = require("./zones");
const { createTemplateApplyRebuildService } = require("./services/templateApplyRebuildService");

const templateApplyRebuildService = createTemplateApplyRebuildService({
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
});

async function applyTemplateAndRebuild(template, options = {}) {
  return templateApplyRebuildService.applyTemplateAndRebuild(template, options);
}

module.exports = {
  VALID_DATA_CENTERS,
  startStack,
  stopStack,
  stopStackSync,
  resetRuntimeState,
  initReplicaSet,
  fetchReplicaStatus,
  stopMongoDBGraceful,
  stopMongoDBHard,
  startMongoDB,
  stopContainer,
  startContainer,
  increaseMongoDBPriority,
  decreaseMongoDBPriority,
  addReplicaNode,
  removeReplicaNode,
  isolateContainerNetwork,
  connectContainerNetwork,
  isolateDataCenterNetwork,
  connectDataCenterNetwork,
  shardReplicaSet,
  syncZonesToSharding,
  setPreferredStatusService,
  cleanupGeneratedReplicaInitScripts,
  cleanupGeneratedReplicaInitScriptsSync,
  setLegacyAppMongoUriToDefault,
  setLegacyAppMongoUriToDefaultSync,
  getApplicationServerLocation,
  updateApplicationServerLocation,
  updateApplicationServerUserLocation,
  applyTemplateAndRebuild
};
