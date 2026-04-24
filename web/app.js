const statusText = document.getElementById("statusText");
const tableBody = document.getElementById("membersTableBody");
const topologySvg = document.getElementById("topology");
const applyConfigurationBtn = document.getElementById("applyConfigurationBtn");
const saveConfigurationBtn = document.getElementById("saveConfigurationBtn");
const saveConfigurationAsBtn = document.getElementById("saveConfigurationAsBtn");
const connectionBadge = document.getElementById("connectionBadge");
const applicationServerStartBtn = document.getElementById("applicationServerStartBtn");
const applicationServerStopBtn = document.getElementById("applicationServerStopBtn");
const applicationServerSettingsBtn = document.getElementById("applicationServerSettingsBtn");
const helpBtn = document.getElementById("helpBtn");
const adminBtn = document.getElementById("adminBtn");
const adminModalOverlay = document.getElementById("adminModalOverlay");
const adminModalForm = document.getElementById("adminModalForm");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const adminModalCancelBtn = document.getElementById("adminModalCancelBtn");
const adminModalSubmitBtn = document.getElementById("adminModalSubmitBtn");
const adminModalTitle = document.getElementById("adminModalTitle");
const adminModalHint = document.getElementById("adminModalHint");
const adminPasswordFieldGroup = document.getElementById("adminPasswordFieldGroup");
const applicationServerToggleConsoleBtn = document.getElementById("applicationServerToggleConsoleBtn");
const applicationServerConsoleContent = document.getElementById("applicationServerConsoleContent");
const userLocationSelect = document.getElementById("userLocationSelect");
const applicationServerConsole = document.getElementById("applicationServerConsole");
const workloadConsoleLabel = document.getElementById("workloadConsoleLabel");
const replicaMembersSection = document.getElementById("replicaMembersSection");
const replicaMembersContent = document.getElementById("replicaMembersContent");
const toggleReplicaMembersBtn = document.getElementById("toggleReplicaMembersBtn");
const shardDataSection = document.getElementById("shardDataSection");
const shardDataContent = document.getElementById("shardDataContent");
const toggleShardDataBtn = document.getElementById("toggleShardDataBtn");
const shardDataTableBody = document.getElementById("shardDataTableBody");
const nodeContextMenu = document.getElementById("nodeContextMenu");
const canvasContextMenu = document.getElementById("canvasContextMenu");
const canvasShardReplicaSetMenuItem = document.getElementById("canvasShardReplicaSetMenuItem");
const canvasDataCenterNetworkMenuItem = document.getElementById("canvasDataCenterNetworkMenuItem");
const addNodeModalOverlay = document.getElementById("addNodeModalOverlay");
const addNodeForm = document.getElementById("addNodeForm");
const addNodeNameInput = document.getElementById("addNodeName");
const addNodeRoleSelect = document.getElementById("addNodeRole");
const addNodeDataCenterSelect = document.getElementById("addNodeDataCenter");
const addNodeShardGroup = document.getElementById("addNodeShardGroup");
const addNodeShardNameInput = document.getElementById("addNodeShardName");
const addNodeCancelBtn = document.getElementById("addNodeCancelBtn");
const addNodeSubmitBtn = document.getElementById("addNodeSubmitBtn");
const applicationServerLocationModalOverlay = document.getElementById(
  "applicationServerLocationModalOverlay"
);
const applicationServerLocationForm = document.getElementById("applicationServerLocationForm");
const applicationServerLocationSelect = document.getElementById("applicationServerLocationSelect");
const applicationServerWriteConcernSelect = document.getElementById(
  "applicationServerWriteConcernSelect"
);
const applicationServerReadConcernSelect = document.getElementById(
  "applicationServerReadConcernSelect"
);
const applicationServerReadPreferenceSelect = document.getElementById(
  "applicationServerReadPreferenceSelect"
);
const replicaSetElectionTimeoutInput = document.getElementById("replicaSetElectionTimeoutInput");
const topologyShowShardLabelsCheckbox = document.getElementById("topologyShowShardLabelsCheckbox");
const applicationServerLocationCancelBtn = document.getElementById(
  "applicationServerLocationCancelBtn"
);
const applicationServerLocationSaveBtn = document.getElementById("applicationServerLocationSaveBtn");
const editZonesBtn = document.getElementById("editZonesBtn");
const zonesModalOverlay = document.getElementById("zonesModalOverlay");
const zonesList = document.getElementById("zonesList");
const addZoneBtn = document.getElementById("addZoneBtn");
const zonesCancelBtn = document.getElementById("zonesCancelBtn");
const zonesSaveBtn = document.getElementById("zonesSaveBtn");
const configurationTemplateModalOverlay = document.getElementById("configurationTemplateModalOverlay");
const configurationTemplateList = document.getElementById("configurationTemplateList");
const configurationTemplateDescription = document.getElementById("configurationTemplateDescription");
const configurationTemplateOkBtn = document.getElementById("configurationTemplateOkBtn");
const configurationTemplateCancelBtn = document.getElementById("configurationTemplateCancelBtn");
const configurationSaveModalOverlay = document.getElementById("configurationSaveModalOverlay");
const configurationSaveModalTitle = document.getElementById("configurationSaveModalTitle");
const configurationSaveOverwriteHint = document.getElementById("configurationSaveOverwriteHint");
const configurationSaveFilenameGroup = document.getElementById("configurationSaveFilenameGroup");
const saveTemplateFilenameInput = document.getElementById("saveTemplateFilenameInput");
const saveTemplateNameInput = document.getElementById("saveTemplateNameInput");
const saveTemplateDescriptionInput = document.getElementById("saveTemplateDescriptionInput");
const configurationSaveCancelBtn = document.getElementById("configurationSaveCancelBtn");
const configurationSaveSubmitBtn = document.getElementById("configurationSaveSubmitBtn");
const deploymentProgressModalOverlay = document.getElementById("deploymentProgressModalOverlay");
const deploymentProgressModalTitle = document.getElementById("deploymentProgressModalTitle");
const deploymentProgressSubtitle = document.getElementById("deploymentProgressSubtitle");
const deploymentProgressErrorLine = document.getElementById("deploymentProgressErrorLine");
const deploymentProgressStepsList = document.getElementById("deploymentProgressStepsList");
const deploymentProgressModalCloseBtn = document.getElementById("deploymentProgressModalCloseBtn");
const helpModalOverlay = document.getElementById("helpModalOverlay");
const helpModalCloseBtn = document.getElementById("helpModalCloseBtn");
const helpTopicList = document.getElementById("helpTopicList");
const helpContent = document.getElementById("helpContent");
const sinceWriteChart = document.getElementById("sinceWriteChart");
const sinceReadChart = document.getElementById("sinceReadChart");
const writeLatencyChart = document.getElementById("writeLatencyChart");
const readLatencyChart = document.getElementById("readLatencyChart");
const lastCurrentValueValue = document.getElementById("lastCurrentValueValue");
const sinceWriteChartCard = document.getElementById("sinceWriteChartCard");
const sinceReadChartCard = document.getElementById("sinceReadChartCard");
const writeLatencyChartCard = document.getElementById("writeLatencyChartCard");
const readLatencyChartCard = document.getElementById("readLatencyChartCard");
const toggleSinceWriteChart = document.getElementById("toggleSinceWriteChart");
const toggleSinceReadChart = document.getElementById("toggleSinceReadChart");
const toggleNodeWriteLatencyChart = document.getElementById("toggleNodeWriteLatencyChart");
const toggleNodeReadLatencyChart = document.getElementById("toggleNodeReadLatencyChart");
const toggleGeoWriteLatencyChart = document.getElementById("toggleGeoWriteLatencyChart");
const toggleGeoReadLatencyChart = document.getElementById("toggleGeoReadLatencyChart");
const chartVisibilityLabel = document.getElementById("chartVisibilityLabel");
const standardLayoutBtn = document.getElementById("standardLayoutBtn");
const geographicLayoutBtn = document.getElementById("geographicLayoutBtn");
const geographicMapSection = document.getElementById("geographicMapSection");
const geographicMapEl = document.getElementById("geographicMap");
const mapPulseLegend = document.getElementById("mapPulseLegend");
const mapZoneLegend = document.getElementById("mapZoneLegend");
const geoNodeTableSection = document.getElementById("geoNodeTableSection");
const geoNodeTableContent = document.getElementById("geoNodeTableContent");
const toggleGeoNodeTableBtn = document.getElementById("toggleGeoNodeTableBtn");
const geoNodeTableBody = document.getElementById("geoMembersTableBody");
const geoNodeTableHint = document.getElementById("geoNodeTableHint");
const workloadConsolePanelContent = document.getElementById("workloadConsolePanelContent");
const toggleWorkloadConsolePanelBtn = document.getElementById("toggleWorkloadConsolePanelBtn");
const workloadConsoleCollapsedRail = document.getElementById("workloadConsoleCollapsedRail");
const workloadConsoleRailExpandBtn = document.getElementById("workloadConsoleRailExpandBtn");

let configurationSaveContext = {
  configurationDeployed: false,
  lastAppliedTemplateId: null,
  lastAppliedTemplateName: null,
  lastAppliedTemplateDescription: null
};
let pendingConfigurationSaveMode = "saveAs";

const applicationServerState = {
  logs: [],
  running: false,
  lastIncrementedAt: null,
  lastCurrentValueAt: null,
  lastCurrentValue: null,
  readByTarget: {},
  writeElapsedSeries: [],
  readElapsedSeries: [],
  writeLatencySeries: [],
  readLatencySeries: []
};
const APPLICATION_SERVER_MAX_LINES = 120;
const APPLICATION_SERVER_CHART_WINDOW_SECONDS = 30;
const STREAM_DISCONNECT_GRACE_MS = 10000;
let mainStreamConnectionState = "reconnecting";
let mainStreamElapsedFreezeWrite = null;
let mainStreamElapsedFreezeRead = null;
const HELP_TOPICS = [
  {
    id: "replica-topology-context-menus",
    title: "Replica Topology Context Menus",
    path: "/help/replica-topology-context-menus.md"
  },
  {
    id: "workload-application",
    title: "Workload Application",
    path: "/help/workload-application.md"
  },
  {
    id: "shard-zones",
    title: "Shard Zones",
    path: "/help/shard-zones.md"
  },
  {
    id: "other-controls",
    title: "Other Controls",
    path: "/help/other-controls.md"
  }
];
let applicationServerConsoleHidden = false;
let applicationServerLocation = "amer-denver-us";
let applicationServerUserLocation = "US";
let userLocationCountryOptions = [];
const FALLBACK_DATA_CENTERS = [
  { id: "amer-denver-us", region: "AMER", name: "AMER", city: "Denver", country: "US", lat: 39.7392, lng: -104.9903 },
  { id: "emea-london-gb", region: "EMEA", name: "EMEA", city: "London", country: "GB", lat: 51.5072, lng: -0.1276 },
  { id: "apac-sydney-au", region: "APAC", name: "APAC", city: "Sydney", country: "AU", lat: -33.8688, lng: 151.2093 },
  {
    id: "latam-sao-paulo-br",
    region: "LATAM",
    name: "LATAM",
    city: "Sao Paulo",
    country: "BR",
    lat: -23.5505,
    lng: -46.6333
  }
];
let configuredDataCenters = [...FALLBACK_DATA_CENTERS];
let dataCenterConfigRefreshPromise = null;
let lastDataCenterConfigRefreshAt = 0;
const DATA_CENTER_CONFIG_REFRESH_INTERVAL_MS = 5000;
const WRITE_CONCERN_MAJORITY = "majority";
const READ_CONCERN_OPTIONS = ["local", "available", "majority", "linearizable", "snapshot"];
const READ_PREFERENCE_OPTIONS = [
  "primary",
  "primaryPreferred",
  "secondary",
  "secondaryPreferred",
  "nearest"
];
const DEFAULT_READ_CONCERN = "local";
const DEFAULT_READ_PREFERENCE = "primary";
const ELECTION_TIMEOUT_MIN_MS = 1000;
const ELECTION_TIMEOUT_MAX_MS = 10000;
const DEFAULT_ELECTION_TIMEOUT_MS = 10000;
const SHARD_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;
const ZONE_NAME_PATTERN = /^[A-Za-z0-9]+$/;
const applicationServerMongoSettings = {
  writeConcern: WRITE_CONCERN_MAJORITY,
  readConcern: DEFAULT_READ_CONCERN,
  readPreference: DEFAULT_READ_PREFERENCE,
  electionTimeoutMs: DEFAULT_ELECTION_TIMEOUT_MS
};
let topologyShowShardLabels = true;
const DEFAULT_MENU_ITEMS = [
  { action: "stop-mongodb-graceful", label: "Stop MongoDB (Graceful)" },
  { action: "stop-mongodb-hard", label: "Crash MongoDB (Hard Stop)" },
  { action: "stop-container", label: "Stop Server" },
  { action: "network-isolate-container", label: "Server Network Failure" },
  { action: "increase-mongodb-priority", label: "Increase MongoDB Priority" },
  { action: "decrease-mongodb-priority", label: "Decrease MongoDB Priority" }
];
const MONGODB_STOPPED_MENU_ITEMS = [
  { action: "start-mongodb", label: "Start MongoDB" },
  { action: "stop-container", label: "Stop Server" },
  { action: "network-isolate-container", label: "Server Network Failure" }
];
const mongodStoppedServices = new Set();
const isolatedContainers = new Set();
const isolatedDataCenters = new Set();
const stoppedContainers = new Set();
let latestServiceRuntime = {};
let latestClusterStatus = null;

let noPasswordUiControlFlowInFlight = false;
let noPasswordSecondUserPromptDone = false;

const UI_SESSION_STORAGE_KEY = "fmSessionId";
const UI_CONTROLLER_TOKEN_KEY = "fmControllerToken";

function getOrCreateSessionId() {
  let id = sessionStorage.getItem(UI_SESSION_STORAGE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `fm-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(UI_SESSION_STORAGE_KEY, id);
  }
  return id;
}

function buildApiHeaders() {
  const headers = {
    "X-Session-Id": getOrCreateSessionId()
  };
  const token = sessionStorage.getItem(UI_CONTROLLER_TOKEN_KEY);
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function passwordRequiredForUiControlClaim() {
  const uc = latestClusterStatus?.uiControl;
  if (!uc) {
    return true;
  }
  if (uc.passwordRequiredForClaim === false) {
    return false;
  }
  if (uc.adminClaimRequired === false) {
    return false;
  }
  return true;
}

function isEffectiveUiController() {
  if (!latestClusterStatus?.uiControl) {
    return false;
  }
  const token = sessionStorage.getItem(UI_CONTROLLER_TOKEN_KEY);
  if (!token) {
    return false;
  }
  const sid = getOrCreateSessionId();
  return latestClusterStatus.uiControl.controllerSessionId === sid;
}

function applyReadOnlyGuardOverrides() {
  if (isEffectiveUiController()) {
    return;
  }
  for (const control of [
    userLocationSelect,
    applicationServerLocationSelect,
    applicationServerReadPreferenceSelect,
    saveConfigurationBtn,
    saveConfigurationAsBtn
  ]) {
    if (control) {
      control.disabled = true;
    }
  }
}

const nodePositionOverrides = new Map();
let latestTopologySections = {};
let latestNodeRadius = 52;
const dragState = {
  active: false,
  memberName: null
};
const TOPOLOGY_DC_LAYOUT_STORAGE_KEY = "failoverMonitor.topologyDcLayout.v1";
const dcLayoutDragState = {
  active: false,
  sourceDcId: null,
  pointerId: null,
  handleEl: null
};
let latestTopologyLayout = null;
const menuState = {
  isVisible: false,
  memberName: null,
  x: 0,
  y: 0
};
const canvasMenuState = {
  isVisible: false,
  x: 0,
  y: 0,
  dataCenter: null
};
const OPERATION_LOCK_REASON = {
  STARTUP: "startup",
  SHARD_REPLICA_SET: "shard-replica-set",
  CONSOLE_SETTINGS: "console-settings",
  TEMPLATE_APPLY: "template-apply"
};
const OPERATION_LOCKED_STATUS = "Another operation is still in progress. Please wait.";
const operationLockState = {
  active: false,
  token: 0,
  reason: null,
  metadata: {},
  disabledSnapshot: null
};
const zonesEditorState = {
  loadedZones: [],
  draftZones: [],
  countryOptions: [],
  updatedAt: null,
  validationIssue: null
};
const tableVisibilityState = {
  replicaMembersExpanded: true,
  shardDataExpanded: true,
  geoNodeTableExpanded: true
};
let workloadConsolePanelExpanded = true;
const chartVisibilityState = {
  sinceWrite: true,
  sinceRead: true,
  nodeWriteLatency: true,
  nodeReadLatency: true,
  geoWriteLatency: false,
  geoReadLatency: true
};
const helpState = {
  initialized: false,
  selectedTopicId: null,
  contentByTopicId: new Map()
};
let deploymentProgressStream = null;
const deploymentProgressRows = new Map();
let nextZoneDraftId = 1;
let activeView = "standard";
let selectedMapDataCenterId = null;
let mapZones = [];
let mapZonesUpdatedAt = null;
let mapZonesLastFetchedAt = 0;
let hoveredZoneName = null;
let geoMap = null;
let geoCountryLayer = null;
let geoCountryCenterByCode = new Map();
const geoMarkersByDataCenterId = new Map();
const geoPulseMarkersByDataCenterId = new Map();
const latestReadAddressByTarget = new Map();
let addressToMemberName = new Map();
const pulseRolesByDataCenterId = new Map();
const PULSE_ROLE_ORDER = ["app", "write", "read"];
const PULSE_ROLE_CLASS_BY_NAME = {
  app: "role-app",
  write: "role-write",
  read: "role-read"
};
const PULSE_ROLE_COLOR_BY_NAME = {
  app: "#ff0000",
  write: "#00ff00",
  read: "#0000ff"
};
const PULSE_ROLE_LABEL_BY_NAME = {
  app: "Application Server",
  write: "Write Operations",
  read: "Read Operations"
};
const READ_SUCCEEDED_ADDRESS_PATTERN =
  /\[READ:([^\]]+)\]\s+\[SUCCEEDED\][^\n]*?\bon\s+([^\s]+)/i;
const READ_CURRENT_VALUE_TARGET_PATTERN = /\[READ:([^\]]+)\]\s+Current value:/i;
const LEGACY_DEFAULT_SUCCEEDED_MAX_AGE_MS = 4000;
let pulseTick = 0;
let mapPulseIntervalId = null;
let latestDefaultReadAddressEntry = null;
const MAP_ZONES_REFRESH_INTERVAL_MS = 10000;
const DEFAULT_COORDINATES_BY_REGION = {
  AMER: { lat: 39.5, lng: -98.35 },
  EMEA: { lat: 50.11, lng: 8.68 },
  APAC: { lat: 1.35, lng: 103.82 },
  LATAM: { lat: -23.55, lng: -46.63 }
};
const MAP_ZONE_COLORS = [
  "#2563eb",
  "#e11d48",
  "#0d9488",
  "#7c3aed",
  "#ea580c",
  "#059669",
  "#db2777",
  "#0891b2",
  "#65a30d",
  "#d97706"
];

function getConfiguredDataCenters() {
  return Array.isArray(configuredDataCenters) && configuredDataCenters.length
    ? configuredDataCenters
    : [...FALLBACK_DATA_CENTERS];
}

function getConfiguredDataCenterIds() {
  return getConfiguredDataCenters().map((entry) => String(entry.id || "").trim()).filter(Boolean);
}

function normalizeDataCenterLocationId(value) {
  const raw = String(value || "").trim();
  const ids = getConfiguredDataCenterIds();
  if (ids.includes(raw)) {
    return raw;
  }
  const byRegion = getConfiguredDataCenters().find(
    (entry) => String(entry.region || "").trim().toUpperCase() === raw.toUpperCase()
  );
  if (byRegion) {
    return String(byRegion.id || ids[0] || "amer-denver-us");
  }
  return String(ids[0] || "amer-denver-us");
}

function sanitizeCityForNodeName(city) {
  const sanitized = String(city || "")
    .trim()
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return sanitized || "Node";
}

function getInitialReplicaSetDisplayName(member) {
  const rawName = String(member?.name || "").trim();
  const match = /^Default_(\d+):27017$/i.exec(rawName);
  if (!match) {
    return rawName;
  }
  const nodeIndex = Number.parseInt(match[1], 10);
  if (!Number.isInteger(nodeIndex) || nodeIndex < 1) {
    return rawName;
  }
  const normalizedDataCenterId = normalizeDataCenter(member?.dataCenter);
  const entry = getDataCenterEntryById(normalizedDataCenterId) || getConfiguredDataCenters()[0];
  const cityName = sanitizeCityForNodeName(entry?.city || "");
  return `${cityName}_${nodeIndex}:27017`;
}

function getMemberDisplayName(member) {
  return getInitialReplicaSetDisplayName(member);
}

function getConfiguredDataCenterRegions() {
  return [...new Set(getConfiguredDataCenters().map((entry) => String(entry.region || "").trim().toUpperCase()))];
}

function getDataCenterEntryByRegion(region) {
  const normalized = String(region || "")
    .trim()
    .toUpperCase();
  return (
    getConfiguredDataCenters().find(
      (entry) => String(entry?.region || "").trim().toUpperCase() === normalized
    ) || null
  );
}

function getDataCenterEntryById(id) {
  const normalized = String(id || "").trim();
  if (!normalized) {
    return null;
  }
  return (
    getConfiguredDataCenters().find(
      (entry) => String(entry?.id || "").trim() === normalized
    ) || null
  );
}

function parseCoordinate(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" && !value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLatitude(value) {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -90 && parsed <= 90 ? parsed : null;
}

function parseLongitude(value) {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -180 && parsed <= 180 ? parsed : null;
}

function normalizeConfiguredDataCenters(dataCenters) {
  if (!Array.isArray(dataCenters) || !dataCenters.length) {
    return [...FALLBACK_DATA_CENTERS];
  }
  const normalized = [];
  const seenIds = new Set();
  for (const entry of dataCenters) {
    const id = String(entry?.id || "")
      .trim()
      .toLowerCase();
    const region = String(entry?.region || "")
      .trim()
      .toUpperCase();
    if (!region || !id || seenIds.has(id)) {
      continue;
    }
    seenIds.add(id);
    normalized.push({
      id,
      region,
      name: String(entry?.name || region).trim() || region,
      city: String(entry?.city || "").trim(),
      country: String(entry?.country || "").trim().toUpperCase(),
      lat: parseLatitude(entry?.lat),
      lng: parseLongitude(entry?.lng)
    });
  }
  return normalized.length ? normalized : [...FALLBACK_DATA_CENTERS];
}

function renderDataCenterSelectOptions() {
  const entries = getConfiguredDataCenters();
  const selects = [applicationServerLocationSelect, addNodeDataCenterSelect];
  for (const select of selects) {
    if (!select) {
      continue;
    }
    const currentValue = String(select.value || "").trim().toLowerCase();
    select.innerHTML = "";
    for (const entry of entries) {
      const option = document.createElement("option");
      option.value = entry.id;
      const flag = countryCodeToFlagEmoji(entry.country);
      const locationName = String(entry.name || entry.region).trim();
      const city = String(entry.city || "").trim();
      option.textContent = city
        ? `${flag ? `${flag} ` : ""}${locationName} (${city})`
        : `${flag ? `${flag} ` : ""}${locationName}`;
      select.appendChild(option);
    }
    select.value = currentValue;
    if (select.value !== currentValue) {
      select.value = String(entries[0]?.id || "amer-denver-us");
    }
  }
}

function shouldSkipUserLocationOptionsRender(incomingUserLocation) {
  if (!userLocationSelect) {
    return true;
  }
  if (document.activeElement === userLocationSelect) {
    return true;
  }
  const incoming = String(incomingUserLocation || "US").trim().toUpperCase();
  if (incoming !== applicationServerUserLocation) {
    return false;
  }
  const n = Array.isArray(userLocationCountryOptions) ? userLocationCountryOptions.length : 0;
  const expectedLen = n > 0 ? n : 1;
  return userLocationSelect.options.length === expectedLen;
}

function applyApplicationServerLocationPayload(locationPayload) {
  if (!locationPayload) {
    return;
  }
  if (isApplicationServerLocationModalOpen()) {
    return;
  }
  const incomingUserLocation = String(locationPayload.userLocation || "US").trim().toUpperCase();
  const skipUserLocationRender = shouldSkipUserLocationOptionsRender(incomingUserLocation);
  configuredDataCenters = normalizeConfiguredDataCenters(locationPayload.dataCenters);
  renderDataCenterSelectOptions();
  applicationServerLocation = normalizeDataCenterLocationId(locationPayload.location);
  applicationServerUserLocation = incomingUserLocation;
  const persistedElectionTimeoutMs = normalizeElectionTimeoutMs(locationPayload.electionTimeoutMs);
  if (persistedElectionTimeoutMs !== null) {
    applicationServerMongoSettings.electionTimeoutMs = persistedElectionTimeoutMs;
  }
  const persistedWriteConcern = normalizeWriteConcern(locationPayload.writeConcern);
  if (persistedWriteConcern !== null) {
    applicationServerMongoSettings.writeConcern = persistedWriteConcern;
  }
  const persistedReadConcern = String(locationPayload.readConcern || "").trim();
  if (READ_CONCERN_OPTIONS.includes(persistedReadConcern)) {
    applicationServerMongoSettings.readConcern = persistedReadConcern;
  }
  const persistedReadPreference = String(locationPayload.readPreference || "").trim();
  if (READ_PREFERENCE_OPTIONS.includes(persistedReadPreference)) {
    applicationServerMongoSettings.readPreference = persistedReadPreference;
  }
  applicationServerLocationSelect.value = normalizeDataCenterLocationId(applicationServerLocation);
  applicationServerReadPreferenceSelect.value = applicationServerMongoSettings.readPreference;
  topologyShowShardLabels =
    locationPayload.topologyShowShardLabels === false ? false : true;
  if (topologyShowShardLabelsCheckbox) {
    topologyShowShardLabelsCheckbox.checked = topologyShowShardLabels;
  }
  if (!skipUserLocationRender) {
    renderUserLocationOptions();
  }
  renderWorkloadConsoleLabel();
  renderDataCenterPins();
  refreshGeographicPulseRoles();
}

async function refreshDataCenterConfigIfNeeded(force = false) {
  if (isApplicationServerLocationModalOpen()) {
    return;
  }
  const now = Date.now();
  if (!force && now - lastDataCenterConfigRefreshAt < DATA_CENTER_CONFIG_REFRESH_INTERVAL_MS) {
    return;
  }
  if (dataCenterConfigRefreshPromise) {
    return dataCenterConfigRefreshPromise;
  }
  dataCenterConfigRefreshPromise = (async () => {
    try {
      const locationPayload = await requestJson("/api/application-server/location");
      applyApplicationServerLocationPayload(locationPayload);
      renderGeographicMembersTable();
    } catch (_error) {
      // Keep existing UI state when refresh fails.
    } finally {
      lastDataCenterConfigRefreshAt = Date.now();
      dataCenterConfigRefreshPromise = null;
    }
  })();
  return dataCenterConfigRefreshPromise;
}

function setStatus(message) {
  statusText.textContent = message;
}

function setConnectionState(state) {
  connectionBadge.classList.remove("live", "reconnecting", "disconnected");
  connectionBadge.classList.add(state);
  if (state === "live") {
    connectionBadge.textContent = "Live";
  } else if (state === "disconnected") {
    connectionBadge.textContent = "Disconnected";
  } else {
    connectionBadge.textContent = "Reconnecting";
  }
  if (state === "live" || state === "disconnected") {
    mainStreamElapsedFreezeWrite = null;
    mainStreamElapsedFreezeRead = null;
  }
  mainStreamConnectionState = state;
}

function clearDisplay() {
  closeNodeContextMenu();
  closeCanvasContextMenu();
  topologySvg.innerHTML = "";
  tableBody.innerHTML = "";
  if (shardDataTableBody) {
    shardDataTableBody.innerHTML = "";
  }
  if (shardDataSection) {
    shardDataSection.classList.add("hidden");
  }
  if (geoNodeTableBody) {
    geoNodeTableBody.innerHTML = "";
  }
}

function setTableSectionExpanded(contentEl, toggleButton, expanded) {
  if (!contentEl || !toggleButton) {
    return;
  }
  contentEl.classList.toggle("collapsed", !expanded);
  toggleButton.setAttribute("aria-expanded", expanded ? "true" : "false");
  toggleButton.textContent = expanded ? "Collapse" : "Expand";
}

function setChartCardVisible(cardEl, visible) {
  if (!cardEl) {
    return;
  }
  cardEl.classList.toggle("chart-hidden", !visible);
}

function applyChartVisibility() {
  const geographic = activeView === "geographic";
  setChartCardVisible(sinceWriteChartCard, chartVisibilityState.sinceWrite);
  setChartCardVisible(sinceReadChartCard, chartVisibilityState.sinceRead);
  setChartCardVisible(
    writeLatencyChartCard,
    geographic ? chartVisibilityState.geoWriteLatency : chartVisibilityState.nodeWriteLatency
  );
  setChartCardVisible(
    readLatencyChartCard,
    geographic ? chartVisibilityState.geoReadLatency : chartVisibilityState.nodeReadLatency
  );
}

function closeNodeContextMenu() {
  if (!menuState.isVisible) {
    return;
  }
  menuState.isVisible = false;
  menuState.memberName = null;
  nodeContextMenu.classList.add("hidden");
  nodeContextMenu.setAttribute("aria-hidden", "true");
}

function closeCanvasContextMenu() {
  if (!canvasMenuState.isVisible) {
    return;
  }
  canvasMenuState.isVisible = false;
  canvasMenuState.dataCenter = null;
  canvasContextMenu.classList.add("hidden");
  canvasContextMenu.setAttribute("aria-hidden", "true");
}

function isOperationLocked() {
  return operationLockState.active;
}

function getOperationGuardedControls() {
  return [
    applyConfigurationBtn,
    saveConfigurationBtn,
    saveConfigurationAsBtn,
    applicationServerSettingsBtn,
    applicationServerStartBtn,
    applicationServerStopBtn,
    userLocationSelect,
    applicationServerLocationSelect,
    applicationServerReadPreferenceSelect
  ];
}

function setOperationLockedUi(locked, disabledSnapshot = null) {
  document.body.classList.toggle("busy-cursor", locked);
  const guardedControls = getOperationGuardedControls();
  for (const control of guardedControls) {
    if (!control) {
      continue;
    }
    if (locked) {
      control.disabled = true;
      continue;
    }
    if (disabledSnapshot instanceof Map && disabledSnapshot.has(control)) {
      control.disabled = Boolean(disabledSnapshot.get(control));
      continue;
    }
    control.disabled = false;
  }
  applyReadOnlyGuardOverrides();
  if (locked) {
    closeNodeContextMenu();
    closeCanvasContextMenu();
  }
}

function applyUiControlUiMode() {
  if (latestClusterStatus?.uiControl) {
    const sid = getOrCreateSessionId();
    const serverCtrl = latestClusterStatus.uiControl.controllerSessionId;
    if (sessionStorage.getItem(UI_CONTROLLER_TOKEN_KEY) && serverCtrl !== sid) {
      sessionStorage.removeItem(UI_CONTROLLER_TOKEN_KEY);
    }
  }
  const effective = isEffectiveUiController();
  document.body.classList.toggle("ui-controller", effective);
  document.body.classList.toggle("ui-readonly", !effective);

  if (operationLockState.active) {
    setOperationLockedUi(true, operationLockState.disabledSnapshot);
  } else {
    setOperationLockedUi(false, operationLockState.disabledSnapshot);
  }
  if (isEffectiveUiController()) {
    void refreshConfigurationSaveContext();
  }
}

async function requestUiControlClaim({ password = "", forceTakeover = false } = {}) {
  const response = await fetch("/api/ui-control/claim", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Session-Id": getOrCreateSessionId()
    },
    body: JSON.stringify({
      sessionId: getOrCreateSessionId(),
      password,
      forceTakeover
    })
  });
  let payload = {};
  try {
    payload = await response.json();
  } catch (_e) {
    payload = {};
  }
  if (response.status === 409 && payload.conflict) {
    const err = new Error(payload.error || "Another session holds control");
    err.isConflict = true;
    throw err;
  }
  if (!response.ok) {
    throw new Error(payload.error || "Claim failed");
  }
  if (payload.controllerToken) {
    sessionStorage.setItem(UI_CONTROLLER_TOKEN_KEY, payload.controllerToken);
  }
  return payload;
}

async function maybeNoPasswordUiControlFlow() {
  const uc = latestClusterStatus?.uiControl;
  if (!uc) {
    return;
  }
  if (passwordRequiredForUiControlClaim()) {
    return;
  }
  if (sessionStorage.getItem(UI_CONTROLLER_TOKEN_KEY)) {
    return;
  }
  if (noPasswordUiControlFlowInFlight) {
    return;
  }

  const sid = getOrCreateSessionId();
  const ctrl = uc.controllerSessionId;

  if (ctrl && ctrl !== sid) {
    if (noPasswordSecondUserPromptDone) {
      return;
    }
    noPasswordSecondUserPromptDone = true;
    const ok = window.confirm(
      "Another browser session currently has admin control. Do you want to assume admin control? The other user will switch to read-only."
    );
    if (ok) {
      noPasswordUiControlFlowInFlight = true;
      try {
        await requestUiControlClaim({ password: "", forceTakeover: true });
        await refreshNow();
        applyUiControlUiMode();
        setStatus("You now have admin control.");
      } catch (error) {
        setStatus(error.message || "Could not take control");
        noPasswordSecondUserPromptDone = false;
      } finally {
        noPasswordUiControlFlowInFlight = false;
      }
    } else {
      setStatus("Read-only mode. Use Admin when you want to take control.");
    }
    return;
  }

  if (ctrl === sid) {
    return;
  }

  if (!ctrl) {
    noPasswordUiControlFlowInFlight = true;
    try {
      await requestUiControlClaim({ password: "", forceTakeover: false });
      await refreshNow();
      applyUiControlUiMode();
      setStatus("Admin controls active for this session.");
    } catch (error) {
      if (error.isConflict) {
        noPasswordSecondUserPromptDone = false;
      } else {
        setStatus(error.message || "Could not claim admin");
      }
    } finally {
      noPasswordUiControlFlowInFlight = false;
    }
  }
}

function beginOperationLock(reason, metadata = {}) {
  const disabledSnapshot = new Map();
  for (const control of getOperationGuardedControls()) {
    if (!control) {
      continue;
    }
    disabledSnapshot.set(control, Boolean(control.disabled));
  }
  operationLockState.token += 1;
  operationLockState.active = true;
  operationLockState.reason = String(reason || "operation");
  operationLockState.metadata =
    metadata && typeof metadata === "object" ? { ...metadata } : {};
  operationLockState.disabledSnapshot = disabledSnapshot;
  setOperationLockedUi(true, disabledSnapshot);
  return operationLockState.token;
}

function endOperationLock(token) {
  if (!operationLockState.active || token !== operationLockState.token) {
    return false;
  }
  operationLockState.active = false;
  operationLockState.reason = null;
  operationLockState.metadata = {};
  const disabledSnapshot = operationLockState.disabledSnapshot;
  operationLockState.disabledSnapshot = null;
  setOperationLockedUi(false, disabledSnapshot);
  return true;
}

function beginOperationLockOrNotify(reason, metadata = {}) {
  if (isOperationLocked()) {
    setStatus(OPERATION_LOCKED_STATUS);
    return null;
  }
  return beginOperationLock(reason, metadata);
}

function isInitialTopologyHealthy(status) {
  const members = Array.isArray(status?.members) ? status.members : [];
  return members.length > 0 && members.every((member) => Boolean(member?.isHealthy));
}

function getExpectedShardMemberNames(status) {
  const members = Array.isArray(status?.members) ? status.members : [];
  return members
    .map((member) => String(member?.name || "").trim())
    .filter((name) => name && name.toLowerCase() !== "mongos router");
}

function areExpectedMembersSharded(status, expectedMemberNames) {
  const expected = Array.isArray(expectedMemberNames)
    ? expectedMemberNames
        .map((name) => String(name || "").trim())
        .filter(Boolean)
    : [];
  if (!expected.length) {
    return true;
  }
  const members = Array.isArray(status?.members) ? status.members : [];
  const membersByName = new Map(
    members.map((member) => [String(member?.name || "").trim(), member])
  );
  return expected.every((name) => {
    const member = membersByName.get(name);
    return Boolean(String(member?.shard || "").trim());
  });
}

function evaluateOperationLockForStatus(status) {
  if (!isOperationLocked()) {
    return;
  }
  const token = operationLockState.token;
  const reason = operationLockState.reason;
  if (reason === OPERATION_LOCK_REASON.TEMPLATE_APPLY) {
    return;
  }
  if (reason === OPERATION_LOCK_REASON.STARTUP && isInitialTopologyHealthy(status)) {
    endOperationLock(token);
    return;
  }
  if (
    reason === OPERATION_LOCK_REASON.SHARD_REPLICA_SET &&
    areExpectedMembersSharded(status, operationLockState.metadata.expectedMemberNames)
  ) {
    endOperationLock(token);
  }
}

function setCanvasDataCenterMenuItem(dataCenter) {
  if (!canvasDataCenterNetworkMenuItem) {
    return;
  }
  if (!dataCenter) {
    canvasDataCenterNetworkMenuItem.classList.add("hidden");
    canvasDataCenterNetworkMenuItem.dataset.action = "network-isolate-datacenter";
    canvasDataCenterNetworkMenuItem.textContent = "Data Center Network Failure";
    return;
  }
  const normalizedDataCenter = normalizeDataCenter(dataCenter);
  const isIsolated = isolatedDataCenters.has(normalizedDataCenter);
  canvasDataCenterNetworkMenuItem.classList.remove("hidden");
  canvasDataCenterNetworkMenuItem.dataset.action = isIsolated
    ? "network-connect-datacenter"
    : "network-isolate-datacenter";
  canvasDataCenterNetworkMenuItem.textContent = isIsolated
    ? "Data Center Network Recovery"
    : "Data Center Network Failure";
}

function setCanvasShardReplicaSetMenuItem() {
  if (!canvasShardReplicaSetMenuItem) {
    return;
  }
  if (latestClusterStatus?.topologySharded === true) {
    canvasShardReplicaSetMenuItem.classList.add("hidden");
    return;
  }
  canvasShardReplicaSetMenuItem.classList.remove("hidden");
}

function memberNameToService(memberName) {
  return String(memberName || "")
    .split(":")[0]
    .trim();
}

function getStatusSourceServiceForMember(data, member) {
  const shardName = String(member?.shard || "").trim();
  const shardSources = data?.statusSourceByShard;
  if (
    shardName &&
    shardSources &&
    typeof shardSources === "object" &&
    String(shardSources[shardName] || "").trim()
  ) {
    return String(shardSources[shardName]).trim();
  }
  return String(data?.statusSourceService || "").trim();
}

function renderNodeContextMenuItems(memberName) {
  const service = memberNameToService(memberName);
  const member = latestClusterStatus?.members?.find((entry) => entry.name === memberName);
  const isDataCenterIsolated = member
    ? isolatedDataCenters.has(normalizeDataCenter(member.dataCenter))
    : false;
  const primaryPresenceByReplicaSet = buildPrimaryPresenceByReplicaSet(latestClusterStatus);
  const hasPrimaryInReplicaSet = member
    ? Boolean(primaryPresenceByReplicaSet.get(getReplicaSetKey(member)))
    : false;
  const isPrimaryNode = member?.role === "primary" || latestClusterStatus?.primaryName === memberName;
  if (stoppedContainers.has(service)) {
    const stoppedMenuItems = [{ action: "start-container", label: "Start Server" }];
    if (hasPrimaryInReplicaSet && !isPrimaryNode) {
      stoppedMenuItems.push({ action: "remove-replica-node", label: "Remove Node" });
    }
    nodeContextMenu.innerHTML = stoppedMenuItems
      .map(
        (item) =>
          `<button type="button" class="context-menu-item" data-action="${item.action}" role="menuitem">${item.label}</button>`
      )
      .join("");
    return;
  }

  const isMongoDBStopped = mongodStoppedServices.has(service);
  const baseItems = isMongoDBStopped ? MONGODB_STOPPED_MENU_ITEMS : DEFAULT_MENU_ITEMS;
  const runtime = latestServiceRuntime[service] || { containerRunning: false, mongodRunning: false };
  const items = baseItems
    .filter((item) => {
      if (service !== "analytics") {
        return true;
      }
      return (
        item.action !== "increase-mongodb-priority" && item.action !== "decrease-mongodb-priority"
      );
    })
    .map((item) => {
      if (
        isDataCenterIsolated &&
        (item.action === "network-isolate-container" || item.action === "network-connect-container")
      ) {
        return null;
      }
      if (item.action !== "network-isolate-container") {
        return item;
      }
      if (!isolatedContainers.has(service)) {
        return item;
      }
      return { action: "network-connect-container", label: "Server Network Recovery" };
    })
    .filter(Boolean);

  if (!isMongoDBStopped && runtime.containerRunning && runtime.mongodRunning) {
    items.push({ action: "set-status-node", label: "Set as Status Node" });
  }
  if (hasPrimaryInReplicaSet && !isPrimaryNode) {
    items.push({ action: "remove-replica-node", label: "Remove Node" });
  }

  nodeContextMenu.innerHTML = items
    .map(
      (item) =>
        `<button type="button" class="context-menu-item" data-action="${item.action}" role="menuitem">${item.label}</button>`
    )
    .join("");
}

function showNodeContextMenu(event, member) {
  if (!isEffectiveUiController()) {
    return;
  }
  if (isOperationLocked()) {
    setStatus(OPERATION_LOCKED_STATUS);
    return;
  }
  closeCanvasContextMenu();
  renderNodeContextMenuItems(member.name);
  menuState.isVisible = true;
  menuState.memberName = member.name;
  menuState.x = event.clientX;
  menuState.y = event.clientY;

  nodeContextMenu.style.left = `${menuState.x}px`;
  nodeContextMenu.style.top = `${menuState.y}px`;
  nodeContextMenu.classList.remove("hidden");
  nodeContextMenu.setAttribute("aria-hidden", "false");

  const menuRect = nodeContextMenu.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
  const clampedLeft = Math.min(Math.max(8, menuState.x), maxLeft);
  const clampedTop = Math.min(Math.max(8, menuState.y), maxTop);

  nodeContextMenu.style.left = `${clampedLeft}px`;
  nodeContextMenu.style.top = `${clampedTop}px`;
}

function showCanvasContextMenu(event) {
  if (!isEffectiveUiController()) {
    return;
  }
  if (isOperationLocked()) {
    setStatus(OPERATION_LOCKED_STATUS);
    return;
  }
  closeNodeContextMenu();
  const point = getSvgPointFromClient(event.clientX, event.clientY);
  let dataCenterAtPoint = null;
  for (const [dataCenter, section] of Object.entries(latestTopologySections)) {
    if (
      point.x >= section.x &&
      point.x <= section.x + section.width &&
      point.y >= section.y &&
      point.y <= section.y + section.height
    ) {
      dataCenterAtPoint = normalizeDataCenter(dataCenter);
      break;
    }
  }
  setCanvasDataCenterMenuItem(dataCenterAtPoint);
  setCanvasShardReplicaSetMenuItem();
  canvasMenuState.isVisible = true;
  canvasMenuState.x = event.clientX;
  canvasMenuState.y = event.clientY;
  canvasMenuState.dataCenter = dataCenterAtPoint;

  canvasContextMenu.style.left = `${canvasMenuState.x}px`;
  canvasContextMenu.style.top = `${canvasMenuState.y}px`;
  canvasContextMenu.classList.remove("hidden");
  canvasContextMenu.setAttribute("aria-hidden", "false");

  const menuRect = canvasContextMenu.getBoundingClientRect();
  const maxLeft = Math.max(8, window.innerWidth - menuRect.width - 8);
  const maxTop = Math.max(8, window.innerHeight - menuRect.height - 8);
  const clampedLeft = Math.min(Math.max(8, canvasMenuState.x), maxLeft);
  const clampedTop = Math.min(Math.max(8, canvasMenuState.y), maxTop);

  canvasContextMenu.style.left = `${clampedLeft}px`;
  canvasContextMenu.style.top = `${clampedTop}px`;
}

async function openAddNodeModal() {
  await refreshDataCenterConfigIfNeeded(true);
  addNodeForm.reset();
  addNodeRoleSelect.value = "voting";
  addNodeDataCenterSelect.value = String(getConfiguredDataCenters()[0]?.id || "amer-denver-us");
  setAddNodeShardFieldState();
  addNodeModalOverlay.classList.remove("hidden");
  addNodeModalOverlay.setAttribute("aria-hidden", "false");
  addNodeNameInput.focus();
}

function closeAddNodeModal() {
  addNodeModalOverlay.classList.add("hidden");
  addNodeModalOverlay.setAttribute("aria-hidden", "true");
  addNodeSubmitBtn.disabled = false;
}

function isHelpModalOpen() {
  return Boolean(helpModalOverlay && !helpModalOverlay.classList.contains("hidden"));
}

function isApplicationServerLocationModalOpen() {
  return Boolean(
    applicationServerLocationModalOverlay &&
      !applicationServerLocationModalOverlay.classList.contains("hidden")
  );
}

function parseHelpMarkdown(markdown) {
  const parseFn =
    typeof window.marked?.parse === "function"
      ? window.marked.parse.bind(window.marked)
      : typeof window.marked === "function"
        ? window.marked
        : null;
  if (!parseFn) {
    return `<pre>${escapeHtml(markdown)}</pre>`;
  }
  return parseFn(markdown);
}

function renderHelpTopicList() {
  if (!helpTopicList) {
    return;
  }
  helpTopicList.innerHTML = HELP_TOPICS.map((topic) => {
    const isSelected = topic.id === helpState.selectedTopicId;
    return `
      <li>
        <button
          type="button"
          class="help-topic-btn${isSelected ? " active" : ""}"
          data-help-topic-id="${escapeHtml(topic.id)}"
          aria-current="${isSelected ? "true" : "false"}"
        >
          ${escapeHtml(topic.title)}
        </button>
      </li>
    `;
  }).join("");
}

function setHelpContentLoading(topicTitle) {
  if (!helpContent) {
    return;
  }
  helpContent.innerHTML = `<p>Loading ${escapeHtml(topicTitle)}...</p>`;
}

function setHelpContentError(topicTitle, message) {
  if (!helpContent) {
    return;
  }
  helpContent.innerHTML = `
    <h4>${escapeHtml(topicTitle)}</h4>
    <p>Unable to load this help topic.</p>
    <pre>${escapeHtml(message)}</pre>
  `;
}

async function loadHelpTopicHtml(topic) {
  const cached = helpState.contentByTopicId.get(topic.id);
  if (cached) {
    return cached;
  }
  const response = await fetch(topic.path);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} while fetching ${topic.path}`);
  }
  const markdown = await response.text();
  const html = parseHelpMarkdown(markdown);
  helpState.contentByTopicId.set(topic.id, html);
  return html;
}

async function setActiveHelpTopic(topicId) {
  const topic = HELP_TOPICS.find((entry) => entry.id === topicId);
  if (!topic || !helpContent) {
    return;
  }
  helpState.selectedTopicId = topic.id;
  renderHelpTopicList();
  setHelpContentLoading(topic.title);
  try {
    const html = await loadHelpTopicHtml(topic);
    if (helpState.selectedTopicId !== topic.id) {
      return;
    }
    helpContent.innerHTML = html;
    helpContent.scrollTop = 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    setHelpContentError(topic.title, message);
  }
}

function initializeHelpModal() {
  if (helpState.initialized) {
    return;
  }
  helpState.initialized = true;
  helpState.selectedTopicId = HELP_TOPICS[0]?.id || null;
  renderHelpTopicList();
}

function openHelpModal() {
  if (!helpModalOverlay) {
    return;
  }
  initializeHelpModal();
  helpModalOverlay.classList.remove("hidden");
  helpModalOverlay.setAttribute("aria-hidden", "false");
  const selectedTopicId = helpState.selectedTopicId || HELP_TOPICS[0]?.id || null;
  if (selectedTopicId) {
    void setActiveHelpTopic(selectedTopicId);
  }
  const activeButton = helpTopicList?.querySelector(".help-topic-btn.active");
  if (activeButton instanceof HTMLButtonElement) {
    activeButton.focus();
  } else {
    helpModalCloseBtn?.focus();
  }
}

function closeHelpModal() {
  if (!helpModalOverlay) {
    return;
  }
  helpModalOverlay.classList.add("hidden");
  helpModalOverlay.setAttribute("aria-hidden", "true");
}

function isShardingEnabled() {
  return latestClusterStatus?.topologySharded === true;
}

function getKnownShards() {
  const members = Array.isArray(latestClusterStatus?.members) ? latestClusterStatus.members : [];
  const shardSet = new Set();
  for (const member of members) {
    const shardName = String(member?.shard || "").trim();
    if (shardName) {
      shardSet.add(shardName);
    }
  }
  return shardSet;
}

function setAddNodeShardFieldState() {
  const sharded = isShardingEnabled();
  if (!addNodeShardGroup || !addNodeShardNameInput) {
    return;
  }
  addNodeShardGroup.classList.toggle("hidden", !sharded);
  addNodeShardNameInput.required = sharded;
  if (!sharded) {
    addNodeShardNameInput.value = "";
    closeZonesModal();
  }
  updateEditZonesButtonVisibility();
}

function updateEditZonesButtonVisibility() {
  if (!editZonesBtn) {
    return;
  }
  const sharded = isShardingEnabled();
  editZonesBtn.classList.toggle("hidden", !sharded);
  editZonesBtn.disabled = !sharded;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}

function toZoneDraft(zone = {}) {
  const id = `zone-${nextZoneDraftId}`;
  nextZoneDraftId += 1;
  const countries = Array.isArray(zone.countries)
    ? [...new Set(zone.countries.map((entry) => String(entry || "").trim().toUpperCase()).filter(Boolean))]
    : [];
  const shards = Array.isArray(zone.shards)
    ? [...new Set(zone.shards.map((entry) => String(entry || "").trim()).filter(Boolean))]
    : [];
  return {
    id,
    name: String(zone.name || "").trim(),
    countries,
    shards
  };
}

function getCountryOptionsByCode() {
  const byCode = new Map();
  for (const option of zonesEditorState.countryOptions || []) {
    const code = String(option?.code || "")
      .trim()
      .toUpperCase();
    const name = String(option?.name || "").trim();
    if (!code || !name || byCode.has(code)) {
      continue;
    }
    byCode.set(code, { code, name });
  }
  return byCode;
}

function getAssignedCountriesByZone() {
  const assignments = new Map();
  for (const zone of zonesEditorState.draftZones) {
    for (const countryCode of zone.countries) {
      assignments.set(countryCode, zone.id);
    }
  }
  return assignments;
}

function getAvailableCountryOptionsForZone(zoneId) {
  const byCode = getCountryOptionsByCode();
  const assignments = getAssignedCountriesByZone();
  const zone = getZoneDraftById(zoneId);
  const available = [];
  for (const option of byCode.values()) {
    const assignedZoneId = assignments.get(option.code);
    if (!assignedZoneId || assignedZoneId === zoneId) {
      available.push(option);
    }
  }
  if (zone) {
    for (const code of zone.countries) {
      if (available.some((entry) => entry.code === code)) {
        continue;
      }
      available.push({
        code,
        name: byCode.get(code)?.name || code
      });
    }
  }
  available.sort((a, b) => a.name.localeCompare(b.name));
  return available;
}

function getAvailableShardOptionsForZone(zone) {
  const knownShards = [...getKnownShards()].sort((a, b) => a.localeCompare(b));
  const selectedSet = new Set(zone.shards);
  return knownShards.filter((shardName) => !selectedSet.has(shardName));
}

function getSelectedShardOptionsForZone(zone) {
  const knownShards = [...getKnownShards()];
  const knownShardSet = new Set(knownShards);
  const selectedKnownShards = zone.shards.filter((shardName) => knownShardSet.has(shardName));
  const selectedUnknownShards = zone.shards.filter((shardName) => !knownShardSet.has(shardName));
  return [...selectedKnownShards.sort((a, b) => a.localeCompare(b)), ...selectedUnknownShards];
}

function buildZonesPickerMarkup({ zoneId, fieldName, availableOptions, selectedOptions, itemToValue, itemToLabel, size }) {
  const availableOptionsMarkup = availableOptions
    .map((item) => `<option value="${escapeHtml(itemToValue(item))}">${escapeHtml(itemToLabel(item))}</option>`)
    .join("");
  const selectedOptionsMarkup = selectedOptions
    .map((item) => `<option value="${escapeHtml(itemToValue(item))}">${escapeHtml(itemToLabel(item))}</option>`)
    .join("");
  const availableId = `${zoneId}-${fieldName}-available`;
  const selectedId = `${zoneId}-${fieldName}-selected`;
  const pickerLabel = fieldName === "countries" ? "Countries" : "Shards / replica sets";

  return `
    <div class="zone-picker" data-zone-picker="${escapeHtml(fieldName)}">
      <p class="zone-picker-title">${escapeHtml(pickerLabel)}</p>
      <div class="zone-picker-grid">
        <div class="zone-picker-column">
          <label for="${escapeHtml(availableId)}">Available</label>
          <select
            id="${escapeHtml(availableId)}"
            data-zone-picker="${escapeHtml(fieldName)}"
            data-zone-column="available"
            multiple
            size="${escapeHtml(size)}"
          >
            ${availableOptionsMarkup}
          </select>
        </div>
        <div class="zone-picker-controls" aria-label="${escapeHtml(`Move ${pickerLabel}`)}">
          <button
            type="button"
            data-zone-action="move-picker-items"
            data-zone-field="${escapeHtml(fieldName)}"
            data-zone-direction="add"
          >
            &gt;
          </button>
          <button
            type="button"
            data-zone-action="move-picker-items"
            data-zone-field="${escapeHtml(fieldName)}"
            data-zone-direction="remove"
          >
            &lt;
          </button>
        </div>
        <div class="zone-picker-column">
          <label for="${escapeHtml(selectedId)}">Selected</label>
          <select
            id="${escapeHtml(selectedId)}"
            data-zone-picker="${escapeHtml(fieldName)}"
            data-zone-column="selected"
            multiple
            size="${escapeHtml(size)}"
          >
            ${selectedOptionsMarkup}
          </select>
        </div>
      </div>
    </div>
  `;
}

function renderZonesEditor() {
  if (!zonesList) {
    return;
  }
  if (!zonesEditorState.draftZones.length) {
    zonesList.innerHTML = '<p class="zones-empty">No zones defined.</p>';
    return;
  }
  const shardOptions = [...getKnownShards()].sort((a, b) => a.localeCompare(b));
  zonesList.innerHTML = zonesEditorState.draftZones
    .map((zone) => {
      const countryOptions = getAvailableCountryOptionsForZone(zone.id);
      const selectedCountryOptions = zone.countries.map((code) => ({
        code,
        name: countryOptions.find((entry) => entry.code === code)?.name || code
      }));
      const availableCountryOptions = countryOptions.filter((option) => !zone.countries.includes(option.code));
      const availableShardOptions = getAvailableShardOptionsForZone(zone);
      const selectedShardOptions = getSelectedShardOptionsForZone(zone);
      const countriesPickerMarkup = buildZonesPickerMarkup({
        zoneId: zone.id,
        fieldName: "countries",
        availableOptions: availableCountryOptions,
        selectedOptions: selectedCountryOptions,
        itemToValue: (entry) => entry.code,
        itemToLabel: (entry) => entry.name,
        size: "8"
      });
      const shardsPickerMarkup = buildZonesPickerMarkup({
        zoneId: zone.id,
        fieldName: "shards",
        availableOptions: availableShardOptions,
        selectedOptions: selectedShardOptions,
        itemToValue: (entry) => entry,
        itemToLabel: (entry) => entry,
        size: "6"
      });
      const shardHint = shardOptions.length
        ? ""
        : '<p class="zones-inline-hint">No known shards yet. Shards can be assigned after sharding exists.</p>';
      const nameValidationIssue =
        zonesEditorState.validationIssue?.zoneId === zone.id && zonesEditorState.validationIssue?.field === "name"
          ? zonesEditorState.validationIssue
          : null;
      const zoneNameInputClass = nameValidationIssue ? "zone-input-invalid" : "";
      const zoneNameValidationMessage = nameValidationIssue
        ? `<p class="zone-validation-message">${escapeHtml(nameValidationIssue.message)}</p>`
        : "";
      return `
        <section class="zone-card" data-zone-id="${escapeHtml(zone.id)}">
          <div class="zone-card-header">
            <h4>Zone</h4>
            <button type="button" class="danger-action" data-zone-action="remove-zone">Remove</button>
          </div>
          <label>Zone name</label>
          <input
            type="text"
            data-zone-field="name"
            class="${zoneNameInputClass}"
            aria-invalid="${nameValidationIssue ? "true" : "false"}"
            value="${escapeHtml(zone.name)}"
            autocomplete="off"
            placeholder="e.g. NorthAmerica"
          />
          ${zoneNameValidationMessage}
          ${countriesPickerMarkup}
          <p class="zones-inline-hint">Countries already assigned to other zones are hidden.</p>
          ${shardsPickerMarkup}
          ${shardHint}
        </section>
      `;
    })
    .join("");
}

async function loadZonesDefinitions() {
  const payload = await requestJson("/api/zones");
  zonesEditorState.countryOptions = Array.isArray(payload.countryOptions) ? payload.countryOptions : [];
  zonesEditorState.updatedAt = payload.updatedAt || null;
  const zones = Array.isArray(payload.zones) ? payload.zones : [];
  zonesEditorState.loadedZones = zones.map((zone) => ({
    name: String(zone?.name || "").trim(),
    countries: Array.isArray(zone?.countries) ? zone.countries.map((code) => String(code)) : [],
    shards: Array.isArray(zone?.shards) ? zone.shards.map((shard) => String(shard)) : []
  }));
  setMapZonesFromPayload(payload);
  refreshCountryLayerStyles();
}

function openZonesModal() {
  zonesEditorState.draftZones = zonesEditorState.loadedZones.map((zone) => toZoneDraft(zone));
  zonesEditorState.validationIssue = null;
  renderZonesEditor();
  zonesModalOverlay.classList.remove("hidden");
  zonesModalOverlay.setAttribute("aria-hidden", "false");
  zonesSaveBtn.disabled = false;
}

function closeZonesModal() {
  zonesEditorState.validationIssue = null;
  zonesModalOverlay.classList.add("hidden");
  zonesModalOverlay.setAttribute("aria-hidden", "true");
  zonesSaveBtn.disabled = false;
}

function getZoneDraftById(zoneId) {
  return zonesEditorState.draftZones.find((zone) => zone.id === zoneId) || null;
}

function validateZonesDraft() {
  const namesSeen = new Set();
  for (let index = 0; index < zonesEditorState.draftZones.length; index += 1) {
    const zone = zonesEditorState.draftZones[index];
    if (!zone.name) {
      return {
        zoneId: zone.id,
        field: "name",
        message: "Zone name is required."
      };
    }
    if (!ZONE_NAME_PATTERN.test(zone.name)) {
      return {
        zoneId: zone.id,
        field: "name",
        message: `Zone "${zone.name}" is invalid. Zone names must use letters and numbers only.`
      };
    }
    const normalizedName = zone.name.toLowerCase();
    if (namesSeen.has(normalizedName)) {
      return {
        zoneId: zone.id,
        field: "name",
        message: `Zone name "${zone.name}" is duplicated.`
      };
    }
    namesSeen.add(normalizedName);
  }
  return null;
}

function buildZonesSavePayload() {
  return zonesEditorState.draftZones.map((zone) => ({
    name: zone.name,
    countries: [...zone.countries],
    shards: [...zone.shards]
  }));
}

function renderWorkloadConsoleLabel() {
  const entry = getDataCenterEntryById(applicationServerLocation) || getConfiguredDataCenters()[0];
  const flag = countryCodeToFlagEmoji(entry?.country || "");
  workloadConsoleLabel.textContent = `Workload Console ${flag}`;
}

function getDataCenterDisplayLabel(dataCenter) {
  const normalized = normalizeDataCenter(dataCenter);
  const entry = getDataCenterEntryById(normalized);
  if (!entry) {
    return normalized;
  }
  const flag = countryCodeToFlagEmoji(entry.country);
  return `${flag ? `${flag} ` : ""}${entry.name}${entry.city ? ` (${entry.city})` : ""}`;
}

function countryCodeToFlagEmoji(countryCode) {
  const code = String(countryCode || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) {
    return "";
  }
  return String.fromCodePoint(
    ...[...code].map((character) => 127397 + character.charCodeAt(0))
  );
}

function normalizeCountryCode(countryCode) {
  return String(countryCode || "")
    .trim()
    .toUpperCase();
}

function normalizeAddressToken(value) {
  return String(value || "")
    .trim()
    .replace(/^\[|\]$/g, "")
    .toLowerCase();
}

function parseAddressHostPort(address) {
  const normalized = normalizeAddressToken(address);
  if (!normalized) {
    return { host: "", port: "" };
  }
  const ipv6WithPort = /^\[([^\]]+)\]:(\d+)$/.exec(String(address || "").trim());
  if (ipv6WithPort) {
    return {
      host: normalizeAddressToken(ipv6WithPort[1]),
      port: String(ipv6WithPort[2] || "").trim()
    };
  }
  const colonCount = (normalized.match(/:/g) || []).length;
  if (colonCount === 1) {
    const [host, port] = normalized.split(":");
    if (/^\d+$/.test(port || "")) {
      return {
        host: normalizeAddressToken(host),
        port
      };
    }
  }
  return { host: normalized, port: "" };
}

function normalizeReadTargetKey(targetName) {
  return String(targetName || "")
    .trim()
    .toLowerCase();
}

function setAddressToMemberNameMapFromStatus(addressMapPayload) {
  const next = new Map();
  if (addressMapPayload && typeof addressMapPayload === "object") {
    for (const [address, memberName] of Object.entries(addressMapPayload)) {
      const normalizedAddress = normalizeAddressToken(address);
      const normalizedMemberName = String(memberName || "").trim();
      if (!normalizedAddress || !normalizedMemberName) {
        continue;
      }
      next.set(normalizedAddress, normalizedMemberName);
    }
  }
  addressToMemberName = next;
}

function extractReadSucceededAddressEntryFromLine(line) {
  const match = READ_SUCCEEDED_ADDRESS_PATTERN.exec(String(line || ""));
  if (!match) {
    return null;
  }
  const target = normalizeReadTargetKey(match[1]);
  const address = String(match[2] || "").trim();
  if (!target || !address) {
    return null;
  }
  return { target, address };
}

function recordReadAddressFromLogEntry(entry) {
  const line = String(entry?.line || "");
  const parsedSucceeded = extractReadSucceededAddressEntryFromLine(line);
  if (parsedSucceeded) {
    const normalizedTarget = normalizeReadTargetKey(parsedSucceeded.target);
    const nextEntry = {
      address: parsedSucceeded.address,
      at: entry?.receivedAt || null
    };
    latestReadAddressByTarget.set(normalizedTarget, nextEntry);
    if (normalizedTarget === "default") {
      latestDefaultReadAddressEntry = nextEntry;
    }
    return true;
  }

  // Compatibility path for legacy workload logs where SUCCEEDED lines were always tagged as READ:default.
  const currentValueMatch = READ_CURRENT_VALUE_TARGET_PATTERN.exec(line);
  if (!currentValueMatch) {
    return false;
  }
  const targetName = normalizeReadTargetKey(currentValueMatch[1]);
  if (!targetName || targetName === "default" || targetName === "mongos") {
    return false;
  }
  if (!latestDefaultReadAddressEntry?.address) {
    return false;
  }
  const nowMs = Date.parse(entry?.receivedAt || "");
  const defaultAddressMs = Date.parse(latestDefaultReadAddressEntry?.at || "");
  if (Number.isFinite(nowMs) && Number.isFinite(defaultAddressMs)) {
    if (nowMs - defaultAddressMs > LEGACY_DEFAULT_SUCCEEDED_MAX_AGE_MS) {
      return false;
    }
  }
  latestReadAddressByTarget.set(targetName, {
    address: latestDefaultReadAddressEntry.address,
    at: entry?.receivedAt || latestDefaultReadAddressEntry.at || null
  });
  return true;
}

function rebuildLatestReadAddresses(entries) {
  latestReadAddressByTarget.clear();
  latestDefaultReadAddressEntry = null;
  for (const entry of entries || []) {
    recordReadAddressFromLogEntry(entry);
  }
}

function resolveLatestReadAddressForTarget(targetName) {
  const normalized = normalizeReadTargetKey(targetName);
  if (!normalized) {
    return null;
  }
  return latestReadAddressByTarget.get(normalized) || null;
}

function resolveMemberNameFromObservedAddress(address) {
  const { host, port } = parseAddressHostPort(address);
  const normalizedAddress = normalizeAddressToken(address);
  if (normalizedAddress && addressToMemberName.has(normalizedAddress)) {
    return addressToMemberName.get(normalizedAddress);
  }
  if (host && addressToMemberName.has(host)) {
    return addressToMemberName.get(host);
  }
  if (host && port && addressToMemberName.has(`${host}:${port}`)) {
    return addressToMemberName.get(`${host}:${port}`);
  }
  if (host && addressToMemberName.has(`${host}:27017`)) {
    return addressToMemberName.get(`${host}:27017`);
  }
  return null;
}

function resolveDataCenterIdForMemberName(memberName) {
  const normalizedMemberName = String(memberName || "").trim().toLowerCase();
  if (!normalizedMemberName) {
    return null;
  }
  const members = Array.isArray(latestClusterStatus?.members) ? latestClusterStatus.members : [];
  const member = members.find((entry) => String(entry?.name || "").trim().toLowerCase() === normalizedMemberName);
  if (!member) {
    return null;
  }
  return resolveDataCenterIdForMember(member);
}

function getPrimaryMemberForShardName(shardName = null) {
  const members = Array.isArray(latestClusterStatus?.members) ? latestClusterStatus.members : [];
  const normalizedShardName = String(shardName || "").trim().toLowerCase();
  const scopedMembers = members.filter((member) => {
    const memberShardName = String(member?.shard || "").trim().toLowerCase();
    return normalizedShardName ? memberShardName === normalizedShardName : !memberShardName;
  });
  if (!scopedMembers.length) {
    return null;
  }
  const explicitPrimary = scopedMembers.find((member) => member?.role === "primary");
  if (explicitPrimary) {
    return explicitPrimary;
  }
  return scopedMembers.find((member) => String(member?.stateStr || "").trim().toUpperCase() === "PRIMARY") || null;
}

function getTopDirectReadTargetName() {
  let selected = null;
  for (const [rawTargetName, metrics] of Object.entries(applicationServerState.readByTarget || {})) {
    const targetName = normalizeReadTargetKey(rawTargetName);
    if (!targetName || targetName === "mongos" || targetName === "default") {
      continue;
    }
    const value = Number(metrics?.value);
    if (!Number.isFinite(value)) {
      continue;
    }
    const timestamp = Date.parse(metrics?.at || "");
    const scoreTime = Number.isFinite(timestamp) ? timestamp : 0;
    if (
      !selected ||
      value > selected.value ||
      (value === selected.value && scoreTime > selected.scoreTime)
    ) {
      selected = {
        targetName: rawTargetName,
        normalizedTargetName: targetName,
        value,
        scoreTime
      };
    }
  }
  return selected;
}

function resolveShardNameFromReadTargetName(targetName) {
  const normalizedTarget = normalizeReadTargetKey(targetName);
  if (!normalizedTarget) {
    return null;
  }
  const knownShards = [...getKnownShards()];
  const exact = knownShards.find(
    (entry) => String(entry || "").trim().toLowerCase() === normalizedTarget
  );
  return exact || null;
}

function resolveReadHandlingDataCenterId() {
  if (!applicationServerState.running) {
    return null;
  }
  if (!isShardingEnabled()) {
    const readEvent = resolveLatestReadAddressForTarget("default");
    const memberName = resolveMemberNameFromObservedAddress(readEvent?.address);
    return resolveDataCenterIdForMemberName(memberName);
  }
  const topDirectRead = getTopDirectReadTargetName();
  if (!topDirectRead) {
    return null;
  }
  const readEvent = resolveLatestReadAddressForTarget(topDirectRead.targetName);
  const memberName = resolveMemberNameFromObservedAddress(readEvent?.address);
  return resolveDataCenterIdForMemberName(memberName);
}

function resolveWriteHandlingDataCenterId() {
  if (!applicationServerState.running) {
    return null;
  }
  if (!isShardingEnabled()) {
    const primaryMember = getPrimaryMemberForShardName(null);
    return resolveDataCenterIdForMember(primaryMember);
  }
  const topDirectRead = getTopDirectReadTargetName();
  const shardName = resolveShardNameFromReadTargetName(topDirectRead?.targetName);
  if (!shardName) {
    return null;
  }
  const primaryMember = getPrimaryMemberForShardName(shardName);
  return resolveDataCenterIdForMember(primaryMember);
}

function refreshGeographicPulseRoles() {
  pulseRolesByDataCenterId.clear();

  const appDataCenterId = normalizeDataCenterLocationId(applicationServerLocation);
  if (appDataCenterId) {
    pulseRolesByDataCenterId.set(appDataCenterId, new Set(["app"]));
  }

  if (!applicationServerState.running) {
    refreshDataCenterPinStyles();
    return;
  }

  const readDataCenterId = resolveReadHandlingDataCenterId();
  if (readDataCenterId) {
    if (!pulseRolesByDataCenterId.has(readDataCenterId)) {
      pulseRolesByDataCenterId.set(readDataCenterId, new Set());
    }
    pulseRolesByDataCenterId.get(readDataCenterId).add("read");
  }

  const writeDataCenterId = resolveWriteHandlingDataCenterId();
  if (writeDataCenterId) {
    if (!pulseRolesByDataCenterId.has(writeDataCenterId)) {
      pulseRolesByDataCenterId.set(writeDataCenterId, new Set());
    }
    pulseRolesByDataCenterId.get(writeDataCenterId).add("write");
  }

  refreshDataCenterPinStyles();
}

function renderMapPulseLegend() {
  if (!mapPulseLegend) {
    return;
  }
  mapPulseLegend.innerHTML = PULSE_ROLE_ORDER.map((roleName) => {
    const color = PULSE_ROLE_COLOR_BY_NAME[roleName] || "#93c5fd";
    const label = PULSE_ROLE_LABEL_BY_NAME[roleName] || roleName;
    return `
      <span class="map-pulse-legend-item">
        <span class="map-pulse-legend-swatch" style="background:${escapeHtml(color)};"></span>
        <span>${escapeHtml(label)}</span>
      </span>
    `;
  }).join("");
}

function ensureMapPulseIntervalRunning() {
  if (mapPulseIntervalId) {
    return;
  }
  mapPulseIntervalId = window.setInterval(() => {
    pulseTick = (pulseTick + 1) % 1000000;
    if (pulseRolesByDataCenterId.size) {
      refreshDataCenterPinStyles();
    }
  }, 1300);
}

function toDataCenterCoordinates(dataCenter) {
  const lat = parseLatitude(dataCenter?.lat);
  const lng = parseLongitude(dataCenter?.lng);
  if (lat !== null && lng !== null) {
    return { lat, lng };
  }
  const countryCode = normalizeCountryCode(dataCenter?.country);
  if (countryCode && geoCountryCenterByCode.has(countryCode)) {
    return geoCountryCenterByCode.get(countryCode);
  }
  const region = String(dataCenter?.region || "AMER")
    .trim()
    .toUpperCase();
  return DEFAULT_COORDINATES_BY_REGION[region] || DEFAULT_COORDINATES_BY_REGION.AMER;
}

function buildPinCoordinateBuckets(dataCenters) {
  const buckets = new Map();
  for (const dataCenter of dataCenters) {
    const dataCenterId = String(dataCenter?.id || "").trim();
    if (!dataCenterId) {
      continue;
    }
    const base = toDataCenterCoordinates(dataCenter);
    const key = `${base.lat.toFixed(2)}:${base.lng.toFixed(2)}`;
    if (!buckets.has(key)) {
      buckets.set(key, []);
    }
    buckets.get(key).push({
      id: dataCenterId,
      base
    });
  }
  return buckets;
}

function buildAdjustedCoordinatesByDataCenterId(dataCenters) {
  const adjustedById = new Map();
  const buckets = buildPinCoordinateBuckets(dataCenters);
  for (const entries of buckets.values()) {
    if (!entries.length) {
      continue;
    }
    if (entries.length === 1) {
      adjustedById.set(entries[0].id, entries[0].base);
      continue;
    }
    const radius = 1.2;
    const step = (Math.PI * 2) / entries.length;
    entries.forEach((entry, index) => {
      const angle = index * step;
      adjustedById.set(entry.id, {
        lat: entry.base.lat + radius * Math.sin(angle),
        lng: entry.base.lng + radius * Math.cos(angle)
      });
    });
  }
  return adjustedById;
}

function setMapZonesFromPayload(payload) {
  const zones = Array.isArray(payload?.zones)
    ? payload.zones.map((zone) => ({
        name: String(zone?.name || "").trim(),
        countries: Array.isArray(zone?.countries)
          ? zone.countries.map((entry) => normalizeCountryCode(entry)).filter(Boolean)
          : []
      }))
    : [];
  mapZones = zones;
  mapZonesUpdatedAt = payload?.updatedAt || null;
  renderMapZoneLegend();
}

function getZoneColorByName(zoneName) {
  const uniqueZoneNames = [...new Set(mapZones.map((zone) => zone.name).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  const index = uniqueZoneNames.indexOf(zoneName);
  if (index < 0) {
    return null;
  }
  return MAP_ZONE_COLORS[index % MAP_ZONE_COLORS.length];
}

function renderMapZoneLegend() {
  if (!mapZoneLegend) {
    return;
  }
  const zoneNames = [...new Set(mapZones.map((zone) => zone.name).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  if (!zoneNames.length) {
    mapZoneLegend.innerHTML = "";
    mapZoneLegend.classList.add("hidden");
    return;
  }
  mapZoneLegend.classList.remove("hidden");
  mapZoneLegend.innerHTML = zoneNames
    .map((zoneName) => {
      const color = getZoneColorByName(zoneName) || "#2563eb";
      return `
        <button
          type="button"
          class="map-zone-legend-item"
          data-zone-name="${escapeHtml(zoneName)}"
          title="Highlight ${escapeHtml(zoneName)}"
          aria-label="Highlight zone ${escapeHtml(zoneName)}"
        >
          <span class="map-zone-legend-swatch" style="background:${escapeHtml(color)};"></span>
          <span>${escapeHtml(zoneName)}</span>
        </button>
      `;
    })
    .join("");
}

if (mapZoneLegend) {
  mapZoneLegend.addEventListener("mouseover", (event) => {
    const zoneItem = event.target.closest("[data-zone-name]");
    const zoneName = String(zoneItem?.dataset.zoneName || "").trim();
    if (!zoneName || zoneName === hoveredZoneName) {
      return;
    }
    hoveredZoneName = zoneName;
    refreshCountryLayerStyles();
  });

  mapZoneLegend.addEventListener("mouseout", (event) => {
    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Element && nextTarget.closest("#mapZoneLegend")) {
      return;
    }
    if (hoveredZoneName === null) {
      return;
    }
    hoveredZoneName = null;
    refreshCountryLayerStyles();
  });
}

function getCountryZoneName(countryCode) {
  const normalizedCountry = normalizeCountryCode(countryCode);
  if (!normalizedCountry) {
    return null;
  }
  for (const zone of mapZones) {
    if ((zone.countries || []).includes(normalizedCountry)) {
      return zone.name;
    }
  }
  return null;
}

function getCountryCodeFromFeature(feature) {
  const properties = feature?.properties || {};

  const normalizedKeyToValue = new Map();
  for (const [rawKey, rawValue] of Object.entries(properties)) {
    const normalizedKey = String(rawKey || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (!normalizedKey || normalizedKeyToValue.has(normalizedKey)) {
      continue;
    }
    normalizedKeyToValue.set(normalizedKey, rawValue);
  }

  const candidateNormalizedKeys = [
    "iso31661alpha2",
    "isoa2",
    "iso2",
    "countrycode",
    "cntrid"
  ];

  for (const key of candidateNormalizedKeys) {
    if (!normalizedKeyToValue.has(key)) {
      continue;
    }
    const normalized = normalizeCountryCode(normalizedKeyToValue.get(key));
    if (/^[A-Z]{2}$/.test(normalized)) {
      return normalized;
    }
  }
  return null;
}

function getCountryLayerStyle(feature) {
  const countryCode = getCountryCodeFromFeature(feature);
  const zoneName = getCountryZoneName(countryCode);
  const hasHoveredZone = Boolean(hoveredZoneName);
  const isHoveredZoneCountry = hasHoveredZone && zoneName === hoveredZoneName;
  if (!zoneName) {
    return {
      color: "#334155",
      weight: 0.6,
      fillColor: "#0b1220",
      fillOpacity: hasHoveredZone ? 0.12 : 0.28
    };
  }
  const fillColor = getZoneColorByName(zoneName) || "#2563eb";
  if (hasHoveredZone && !isHoveredZoneCountry) {
    return {
      color: "#334155",
      weight: 0.6,
      fillColor,
      fillOpacity: 0.16
    };
  }
  return {
    color: isHoveredZoneCountry ? "#f8fafc" : "#475569",
    weight: isHoveredZoneCountry ? 1.2 : 0.8,
    fillColor,
    fillOpacity: isHoveredZoneCountry ? 0.62 : 0.42
  };
}

function refreshCountryLayerStyles() {
  if (geoCountryLayer) {
    geoCountryLayer.setStyle(getCountryLayerStyle);
  }
}

function collectGeometryPositions(geometry, accumulator = []) {
  if (!geometry || !geometry.type) {
    return accumulator;
  }
  const type = String(geometry.type);
  const coordinates = geometry.coordinates;
  if (!coordinates) {
    return accumulator;
  }

  const pushPosition = (position) => {
    if (!Array.isArray(position) || position.length < 2) {
      return;
    }
    const lon = Number(position[0]);
    const lat = Number(position[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return;
    }
    accumulator.push({ lat, lon });
  };

  if (type === "Point") {
    pushPosition(coordinates);
    return accumulator;
  }
  if (type === "MultiPoint" || type === "LineString") {
    coordinates.forEach(pushPosition);
    return accumulator;
  }
  if (type === "MultiLineString" || type === "Polygon") {
    coordinates.forEach((line) => Array.isArray(line) && line.forEach(pushPosition));
    return accumulator;
  }
  if (type === "MultiPolygon") {
    coordinates.forEach((polygon) => {
      if (!Array.isArray(polygon)) {
        return;
      }
      polygon.forEach((line) => Array.isArray(line) && line.forEach(pushPosition));
    });
  }
  return accumulator;
}

function computeGeometryCenter(geometry) {
  const positions = collectGeometryPositions(geometry, []);
  if (!positions.length) {
    return null;
  }

  let sumLat = 0;
  let sumSinLon = 0;
  let sumCosLon = 0;
  for (const position of positions) {
    sumLat += position.lat;
    const radians = (position.lon * Math.PI) / 180;
    sumSinLon += Math.sin(radians);
    sumCosLon += Math.cos(radians);
  }

  const lat = sumLat / positions.length;
  let lon = (Math.atan2(sumSinLon, sumCosLon) * 180) / Math.PI;
  if (lon > 180) {
    lon -= 360;
  } else if (lon < -180) {
    lon += 360;
  }
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return { lat, lng: lon };
}

function computeCountryCenters(geoJson) {
  const byCountry = new Map();
  const features = Array.isArray(geoJson?.features) ? geoJson.features : [];
  for (const feature of features) {
    const countryCode = getCountryCodeFromFeature(feature);
    if (!countryCode || byCountry.has(countryCode)) {
      continue;
    }
    const geometryCenter = computeGeometryCenter(feature?.geometry);
    if (geometryCenter) {
      byCountry.set(countryCode, geometryCenter);
      continue;
    }
    try {
      const tempLayer = window.L.geoJSON(feature);
      const bounds = tempLayer.getBounds();
      if (bounds?.isValid()) {
        const center = bounds.getCenter();
        byCountry.set(countryCode, { lat: center.lat, lng: center.lng });
      }
    } catch (_error) {
      // Ignore malformed feature geometry when fallback bounds also fails.
    }
  }
  geoCountryCenterByCode = byCountry;
}

async function loadMapCountriesLayer() {
  if (!geoMap || geoCountryLayer) {
    return;
  }
  const response = await fetch("/assets/world-countries.geojson");
  if (!response.ok) {
    throw new Error(`Failed to load map data (${response.status})`);
  }
  const geoJson = await response.json();
  computeCountryCenters(geoJson);
  geoCountryLayer = window.L.geoJSON(geoJson, {
    style: getCountryLayerStyle,
    onEachFeature: (feature, layer) => {
      const countryCode = getCountryCodeFromFeature(feature);
      if (!countryCode) {
        return;
      }
      const zoneName = getCountryZoneName(countryCode);
      if (zoneName) {
        layer.bindTooltip(`${countryCode} - ${zoneName}`, {
          sticky: true
        });
      }
    }
  }).addTo(geoMap);
}

function refreshDataCenterPinStyles() {
  const activeRoleClasses = Object.values(PULSE_ROLE_CLASS_BY_NAME);
  for (const [dataCenterId, marker] of geoMarkersByDataCenterId.entries()) {
    const isSelected = dataCenterId === selectedMapDataCenterId;
    const pulseMarker = geoPulseMarkersByDataCenterId.get(dataCenterId) || null;
    const activeRoles = [...(pulseRolesByDataCenterId.get(dataCenterId) || [])].sort(
      (left, right) => PULSE_ROLE_ORDER.indexOf(left) - PULSE_ROLE_ORDER.indexOf(right)
    );
    const hasPulse = activeRoles.length > 0;
    const activePulseRole = hasPulse ? activeRoles[pulseTick % activeRoles.length] : null;
    const activePulseColor = PULSE_ROLE_COLOR_BY_NAME[activePulseRole] || "#93c5fd";
    marker.setStyle({
      color: isSelected ? "#facc15" : "#93c5fd",
      fillColor: isSelected ? "#f97316" : "#1d4ed8",
      fillOpacity: 0.95,
      weight: isSelected ? 2.8 : 1.8,
      radius: isSelected ? 9 : 7
    });

    if (!pulseMarker) {
      continue;
    }
    pulseMarker.setStyle({
      color: activePulseColor,
      fillColor: activePulseColor,
      fillOpacity: 0,
      opacity: hasPulse ? 0.95 : 0,
      weight: hasPulse ? 2.3 : 0,
      radius: isSelected ? 14 : 12
    });
    const pulseElement = pulseMarker.getElement();
    if (!pulseElement) {
      continue;
    }
    pulseElement.classList.remove("is-active", "is-selected", ...activeRoleClasses);
    if (hasPulse) {
      pulseElement.classList.add("is-active");
      const roleClass = PULSE_ROLE_CLASS_BY_NAME[activePulseRole];
      if (roleClass) {
        pulseElement.classList.add(roleClass);
      }
    }
    if (isSelected) {
      pulseElement.classList.add("is-selected");
    }
  }
}

function renderDataCenterPins() {
  if (!geoMap) {
    return;
  }
  const dataCenters = getConfiguredDataCenters();
  const adjustedCoordinatesById = buildAdjustedCoordinatesByDataCenterId(dataCenters);
  const validDataCenterIds = new Set(dataCenters.map((entry) => String(entry.id || "").trim()));
  for (const [dataCenterId, marker] of geoMarkersByDataCenterId.entries()) {
    if (validDataCenterIds.has(dataCenterId)) {
      continue;
    }
    geoMap.removeLayer(marker);
    geoMarkersByDataCenterId.delete(dataCenterId);
  }
  for (const [dataCenterId, pulseMarker] of geoPulseMarkersByDataCenterId.entries()) {
    if (validDataCenterIds.has(dataCenterId)) {
      continue;
    }
    geoMap.removeLayer(pulseMarker);
    geoPulseMarkersByDataCenterId.delete(dataCenterId);
  }
  for (const dataCenter of dataCenters) {
    const dataCenterId = String(dataCenter.id || "").trim();
    if (!dataCenterId) {
      continue;
    }
    const coordinates = adjustedCoordinatesById.get(dataCenterId) || toDataCenterCoordinates(dataCenter);
    if (!coordinates) {
      continue;
    }
    if (geoMarkersByDataCenterId.has(dataCenterId)) {
      geoMarkersByDataCenterId.get(dataCenterId).setLatLng([coordinates.lat, coordinates.lng]);
      const existingPulseMarker = geoPulseMarkersByDataCenterId.get(dataCenterId);
      if (existingPulseMarker) {
        existingPulseMarker.setLatLng([coordinates.lat, coordinates.lng]);
      }
      continue;
    }
    const pulseMarker = window.L.circleMarker([coordinates.lat, coordinates.lng], {
      className: "geo-dc-pulse",
      color: "#000000",
      fillColor: "#000000",
      fillOpacity: 0,
      opacity: 0,
      weight: 0,
      radius: 12,
      interactive: false
    }).addTo(geoMap);
    const marker = window.L.circleMarker([coordinates.lat, coordinates.lng], {
      color: "#93c5fd",
      fillColor: "#1d4ed8",
      fillOpacity: 0.95,
      weight: 1.8,
      radius: 7
    }).addTo(geoMap);
    marker.bindTooltip(getDataCenterDisplayLabel(dataCenterId), {
      permanent: false,
      direction: "top",
      className: "geo-pin-label"
    });
    marker.on("click", () => {
      selectedMapDataCenterId = dataCenterId;
      refreshDataCenterPinStyles();
      renderGeographicMembersTable();
    });
    geoMarkersByDataCenterId.set(dataCenterId, marker);
    geoPulseMarkersByDataCenterId.set(dataCenterId, pulseMarker);
  }
  refreshDataCenterPinStyles();
}

async function refreshMapZones(force = false) {
  const now = Date.now();
  if (!force && now - mapZonesLastFetchedAt < MAP_ZONES_REFRESH_INTERVAL_MS) {
    return;
  }
  try {
    const payload = await requestJson("/api/zones");
    setMapZonesFromPayload(payload);
    refreshCountryLayerStyles();
  } catch (_error) {
    // Keep last known zone colors when refresh fails.
  } finally {
    mapZonesLastFetchedAt = Date.now();
  }
}

async function ensureGeographicMapReady() {
  if (!geographicMapEl || typeof window.L === "undefined") {
    return;
  }
  if (!geoMap) {
    geoMap = window.L.map(geographicMapEl, {
      zoomControl: true,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 6,
      worldCopyJump: true
    });
    geoMap.setView([20, 10], 2);
  }
  await refreshMapZones(true);
  await loadMapCountriesLayer();
  renderMapPulseLegend();
  renderDataCenterPins();
}

function renderUserLocationOptions() {
  if (!userLocationSelect) {
    return;
  }
  const selectedCode = String(applicationServerUserLocation || "US")
    .trim()
    .toUpperCase();
  const options = Array.isArray(userLocationCountryOptions) ? userLocationCountryOptions : [];
  userLocationSelect.innerHTML = "";
  for (const option of options) {
    const countryCode = String(option?.code || "")
      .trim()
      .toUpperCase();
    const countryName = String(option?.name || "").trim();
    if (!countryCode || !countryName) {
      continue;
    }
    const element = document.createElement("option");
    element.value = countryCode;
    const flag = countryCodeToFlagEmoji(countryCode);
    element.textContent = flag ? `${flag} ${countryName}` : countryName;
    userLocationSelect.appendChild(element);
  }

  if (!options.length) {
    const fallback = document.createElement("option");
    fallback.value = "US";
    fallback.textContent = `${countryCodeToFlagEmoji("US")} United States of America`;
    userLocationSelect.appendChild(fallback);
  }

  userLocationSelect.value = selectedCode;
  if (userLocationSelect.value !== selectedCode) {
    userLocationSelect.value = "US";
    applicationServerUserLocation = "US";
  }
}

function getCountryDisplayLabelByCode(countryCode) {
  const code = String(countryCode || "")
    .trim()
    .toUpperCase();
  const match = (userLocationCountryOptions || []).find(
    (entry) => String(entry?.code || "").trim().toUpperCase() === code
  );
  if (!match) {
    return code || "Unknown";
  }
  const name = String(match.name || "").trim() || code;
  const flag = countryCodeToFlagEmoji(code);
  return flag ? `${flag} ${name}` : name;
}

function openApplicationServerLocationModal() {
  const writeConcern = renderWriteConcernOptions(applicationServerMongoSettings.writeConcern);
  applicationServerMongoSettings.writeConcern = writeConcern;
  applicationServerMongoSettings.readConcern = READ_CONCERN_OPTIONS.includes(
    applicationServerMongoSettings.readConcern
  )
    ? applicationServerMongoSettings.readConcern
    : DEFAULT_READ_CONCERN;
  applicationServerMongoSettings.readPreference = READ_PREFERENCE_OPTIONS.includes(
    applicationServerMongoSettings.readPreference
  )
    ? applicationServerMongoSettings.readPreference
    : DEFAULT_READ_PREFERENCE;
  applicationServerMongoSettings.electionTimeoutMs =
    normalizeElectionTimeoutMs(applicationServerMongoSettings.electionTimeoutMs) ??
    DEFAULT_ELECTION_TIMEOUT_MS;
  applicationServerReadConcernSelect.value = applicationServerMongoSettings.readConcern;
  replicaSetElectionTimeoutInput.value = String(applicationServerMongoSettings.electionTimeoutMs);
  if (topologyShowShardLabelsCheckbox) {
    topologyShowShardLabelsCheckbox.checked = topologyShowShardLabels;
  }
  applicationServerLocationModalOverlay.classList.remove("hidden");
  applicationServerLocationModalOverlay.setAttribute("aria-hidden", "false");
  applicationServerWriteConcernSelect.focus();
}

function closeApplicationServerLocationModal() {
  applicationServerLocationModalOverlay.classList.add("hidden");
  applicationServerLocationModalOverlay.setAttribute("aria-hidden", "true");
  applicationServerLocationSaveBtn.disabled = false;
}

async function loadApplicationServerLocation() {
  const locationPayload = await requestJson("/api/application-server/location");
  try {
    const zonesPayload = await requestJson("/api/zones");
    userLocationCountryOptions = Array.isArray(zonesPayload.countryOptions)
      ? zonesPayload.countryOptions
      : [];
  } catch (_error) {
    // Keep a US fallback option if country options cannot be loaded.
    userLocationCountryOptions = [];
  }
  applyApplicationServerLocationPayload(locationPayload);
}

async function applyApplicationServerConsoleSettings(options = {}) {
  const location = normalizeDataCenterLocationId(
    options.location === undefined ? applicationServerLocationSelect.value : options.location
  );
  const readPreference = String(
    options.readPreference === undefined
      ? applicationServerReadPreferenceSelect.value
      : options.readPreference
  ).trim();
  if (!READ_PREFERENCE_OPTIONS.includes(readPreference)) {
    throw new Error("Read Preference is invalid.");
  }
  const writeConcern = normalizeWriteConcern(applicationServerMongoSettings.writeConcern);
  if (writeConcern === null) {
    throw new Error("Write Concern is invalid.");
  }
  const readConcern = READ_CONCERN_OPTIONS.includes(applicationServerMongoSettings.readConcern)
    ? applicationServerMongoSettings.readConcern
    : DEFAULT_READ_CONCERN;
  const electionTimeoutMs =
    normalizeElectionTimeoutMs(applicationServerMongoSettings.electionTimeoutMs) ??
    DEFAULT_ELECTION_TIMEOUT_MS;
  const payload = await requestJson("/api/application-server/location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      location,
      electionTimeoutMs,
      writeConcern,
      readConcern,
      readPreference
    })
  });
  if (Array.isArray(payload.dataCenters)) {
    configuredDataCenters = normalizeConfiguredDataCenters(payload.dataCenters);
    renderDataCenterSelectOptions();
  }
  applicationServerLocation = normalizeDataCenterLocationId(payload.location || location);
  applicationServerMongoSettings.writeConcern =
    normalizeWriteConcern(payload.writeConcern) ?? writeConcern;
  applicationServerMongoSettings.readConcern = READ_CONCERN_OPTIONS.includes(payload.readConcern)
    ? payload.readConcern
    : readConcern;
  applicationServerMongoSettings.readPreference = READ_PREFERENCE_OPTIONS.includes(payload.readPreference)
    ? payload.readPreference
    : readPreference;
  applicationServerMongoSettings.electionTimeoutMs =
    normalizeElectionTimeoutMs(payload.electionTimeoutMs) ?? electionTimeoutMs;
  applicationServerLocationSelect.value = applicationServerLocation;
  applicationServerReadPreferenceSelect.value = applicationServerMongoSettings.readPreference;
  renderWorkloadConsoleLabel();
  renderDataCenterPins();
  refreshGeographicPulseRoles();
  renderGeographicMembersTable();
  return payload;
}

function getVotingNodeCount() {
  const members = Array.isArray(latestClusterStatus?.members) ? latestClusterStatus.members : [];
  return members.reduce((total, member) => total + (Number(member?.votes) > 0 ? 1 : 0), 0);
}

function normalizeWriteConcern(value, votingNodeCount = getVotingNodeCount()) {
  if (String(value || "").trim() === WRITE_CONCERN_MAJORITY) {
    return WRITE_CONCERN_MAJORITY;
  }
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > votingNodeCount) {
    return null;
  }
  return parsed;
}

function renderWriteConcernOptions(preferredValue = applicationServerMongoSettings.writeConcern) {
  if (!applicationServerWriteConcernSelect) {
    return WRITE_CONCERN_MAJORITY;
  }
  const votingNodeCount = getVotingNodeCount();
  const normalizedPreferred = normalizeWriteConcern(preferredValue, votingNodeCount);
  const selectedValue =
    normalizedPreferred === null ? WRITE_CONCERN_MAJORITY : normalizedPreferred;

  applicationServerWriteConcernSelect.innerHTML = "";
  const majorityOption = document.createElement("option");
  majorityOption.value = WRITE_CONCERN_MAJORITY;
  majorityOption.textContent = WRITE_CONCERN_MAJORITY;
  applicationServerWriteConcernSelect.appendChild(majorityOption);
  for (let value = 0; value <= votingNodeCount; value += 1) {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = String(value);
    applicationServerWriteConcernSelect.appendChild(option);
  }

  applicationServerWriteConcernSelect.value = String(selectedValue);
  return selectedValue;
}

function normalizeElectionTimeoutMs(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  if (parsed < ELECTION_TIMEOUT_MIN_MS || parsed > ELECTION_TIMEOUT_MAX_MS) {
    return null;
  }
  return parsed;
}

function elapsedSecondsFromIso(isoString) {
  if (!isoString) {
    return null;
  }
  const parsedMs = new Date(isoString).getTime();
  if (!Number.isFinite(parsedMs)) {
    return null;
  }
  const elapsedMs = Math.max(0, Date.now() - parsedMs);
  return Math.max(1, Math.round(elapsedMs / 1000));
}

function pushMetricSeriesPoint(series, value) {
  const now = Date.now();
  series.push({ ts: now, value });
  trimMetricSeriesWindow(series);
}

function pushMetricSeriesPointAt(series, value, timestampMs) {
  const ts = Number.isFinite(timestampMs) ? timestampMs : Date.now();
  series.push({ ts, value });
  trimMetricSeriesWindow(series);
}

function trimMetricSeriesWindow(series) {
  const now = Date.now();
  const cutoff = now - APPLICATION_SERVER_CHART_WINDOW_SECONDS * 1000;
  while (series.length && series[0].ts < cutoff) {
    series.shift();
  }
}

function drawElapsedChart(canvas, series, color, yOptions = {}) {
  if (!canvas) {
    return;
  }
  const cssWidth = Math.max(40, Math.round(canvas.clientWidth || canvas.width || 40));
  const cssHeight = Math.max(40, Math.round(canvas.clientHeight || canvas.height || 40));
  const deviceRatio = window.devicePixelRatio || 1;
  const pixelWidth = Math.round(cssWidth * deviceRatio);
  const pixelHeight = Math.round(cssHeight * deviceRatio);
  if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }
  ctx.setTransform(deviceRatio, 0, 0, deviceRatio, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const axisPaddingTop = 10;
  const axisPaddingBottom = 16;
  const axisPaddingLeft =
    typeof yOptions.axisPaddingLeft === "number" ? Math.max(30, yOptions.axisPaddingLeft) : 30;
  const plotLeft = axisPaddingLeft;
  const plotWidth = cssWidth - axisPaddingLeft;
  const plotTop = axisPaddingTop;
  const plotHeight = cssHeight - axisPaddingTop - axisPaddingBottom;
  ctx.strokeStyle = "#233048";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotTop + plotHeight);
  ctx.lineTo(cssWidth, plotTop + plotHeight);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(plotLeft, plotTop);
  ctx.lineTo(plotLeft, plotTop + plotHeight);
  ctx.stroke();

  const values = series.map((point) => point.value).filter((value) => value !== null);
  const minValue = typeof yOptions.minValue === "number" ? yOptions.minValue : 0;
  const minRange = typeof yOptions.minRange === "number" ? yOptions.minRange : 2;
  const yUnit = yOptions.unit || "s";
  const yStepSmall = typeof yOptions.stepSmall === "number" ? yOptions.stepSmall : 1;
  const yStepLarge = typeof yOptions.stepLarge === "number" ? yOptions.stepLarge : 2;
  const yTickCount = Number.isInteger(yOptions.tickCount) && yOptions.tickCount >= 2
    ? yOptions.tickCount
    : null;
  if (!values.length) {
    // Draw a default y-axis scale when no data exists.
    ctx.fillStyle = "#93c5fd";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const emptyTicks = yTickCount
      ? Array.from(
          { length: yTickCount },
          (_entry, index) => minValue + (minRange * index) / (yTickCount - 1)
        )
      : [minValue, minValue + minRange / 2, minValue + minRange];
    emptyTicks.forEach((tickValue) => {
      const y = plotTop + plotHeight - ((tickValue - minValue) / minRange) * plotHeight;
      ctx.strokeStyle = "#233048";
      ctx.beginPath();
      ctx.moveTo(plotLeft - 4, y);
      ctx.lineTo(plotLeft, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(tickValue)}${yUnit}`, plotLeft - 6, y);
    });
    return;
  }
  const maxValue = Math.max(minValue + minRange, ...values);
  const range = Math.max(minRange, maxValue - minValue);
  ctx.fillStyle = "#93c5fd";
  ctx.font = "10px sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const plottedTicks = yTickCount
    ? Array.from(
        { length: yTickCount },
        (_entry, index) => minValue + (range * index) / (yTickCount - 1)
      )
    : (() => {
        const yTickStep = maxValue <= minValue + minRange * 3 ? yStepSmall : yStepLarge;
        const ticks = [];
        for (let tickValue = minValue; tickValue <= maxValue; tickValue += yTickStep) {
          ticks.push(tickValue);
        }
        if (ticks[ticks.length - 1] !== maxValue) {
          ticks.push(maxValue);
        }
        return ticks;
      })();
  for (const tickValue of plottedTicks) {
    const y = plotTop + plotHeight - ((tickValue - minValue) / range) * plotHeight;
    ctx.strokeStyle = "#233048";
    ctx.beginPath();
    ctx.moveTo(plotLeft - 4, y);
    ctx.lineTo(plotLeft, y);
    ctx.stroke();
    ctx.fillText(`${Math.round(tickValue)}${yUnit}`, plotLeft - 6, y);
  }
  const now = Date.now();
  const cutoff = now - APPLICATION_SERVER_CHART_WINDOW_SECONDS * 1000;

  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  let started = false;
  for (const point of series) {
    if (point.value === null || !Number.isFinite(point.value)) {
      continue;
    }
    const x =
      plotLeft + ((point.ts - cutoff) / (APPLICATION_SERVER_CHART_WINDOW_SECONDS * 1000)) * plotWidth;
    const normalized = (point.value - minValue) / range;
    const y = plotTop + plotHeight - normalized * (plotHeight - 8) - 4;
    if (!started) {
      ctx.moveTo(x, y);
      started = true;
    } else {
      ctx.lineTo(x, y);
    }
  }
  ctx.stroke();
}

function renderApplicationServerMetrics() {
  const writeElapsed = applicationServerState.running
    ? elapsedSecondsFromIso(applicationServerState.lastIncrementedAt)
    : null;
  const readElapsed = applicationServerState.running
    ? elapsedSecondsFromIso(applicationServerState.lastCurrentValueAt)
    : null;
  const chartWriteElapsed =
    mainStreamConnectionState === "reconnecting" && mainStreamElapsedFreezeWrite !== null
      ? mainStreamElapsedFreezeWrite
      : writeElapsed;
  const chartReadElapsed =
    mainStreamConnectionState === "reconnecting" && mainStreamElapsedFreezeRead !== null
      ? mainStreamElapsedFreezeRead
      : readElapsed;
  if (chartWriteElapsed !== null) {
    pushMetricSeriesPoint(applicationServerState.writeElapsedSeries, chartWriteElapsed);
  }
  if (chartReadElapsed !== null) {
    pushMetricSeriesPoint(applicationServerState.readElapsedSeries, chartReadElapsed);
  }
  trimMetricSeriesWindow(applicationServerState.writeElapsedSeries);
  trimMetricSeriesWindow(applicationServerState.readElapsedSeries);
  trimMetricSeriesWindow(applicationServerState.writeLatencySeries);
  trimMetricSeriesWindow(applicationServerState.readLatencySeries);
  drawElapsedChart(sinceWriteChart, applicationServerState.writeElapsedSeries, "#f59e0b", {
    unit: "s",
    tickCount: 3
  });
  drawElapsedChart(sinceReadChart, applicationServerState.readElapsedSeries, "#60a5fa", {
    unit: "s",
    tickCount: 3
  });
  drawElapsedChart(writeLatencyChart, applicationServerState.writeLatencySeries, "#f97316", {
    unit: "ms",
    minRange: 10,
    stepSmall: 5,
    stepLarge: 20,
    tickCount: 3,
    axisPaddingLeft: 42
  });
  drawElapsedChart(readLatencyChart, applicationServerState.readLatencySeries, "#22d3ee", {
    unit: "ms",
    minRange: 10,
    stepSmall: 5,
    stepLarge: 20,
    tickCount: 3,
    axisPaddingLeft: 42
  });

  lastCurrentValueValue.textContent =
    applicationServerState.lastCurrentValue === null ? "N/A" : String(applicationServerState.lastCurrentValue);
}

function setApplicationServerRunning(running) {
  applicationServerState.running = Boolean(running);
  if (!applicationServerState.running) {
    applicationServerState.writeElapsedSeries = [];
    applicationServerState.readElapsedSeries = [];
    applicationServerState.writeLatencySeries = [];
    applicationServerState.readLatencySeries = [];
  }
  renderApplicationServerMetrics();
  refreshGeographicPulseRoles();
}

function renderApplicationServerConsole() {
  if (!applicationServerState.logs.length) {
    applicationServerConsole.textContent = "Waiting for ApplicationServer output...";
    return;
  }
  applicationServerConsole.textContent = applicationServerState.logs.map((entry) => entry.line).join("\n");
  applicationServerConsole.scrollTop = applicationServerConsole.scrollHeight;
}

function setApplicationServerMetrics(metrics) {
  applicationServerState.lastIncrementedAt = metrics?.lastIncrementedAt || null;
  const incomingReadByTarget = metrics?.readByTarget;
  const normalizedReadByTarget = {};
  if (incomingReadByTarget && typeof incomingReadByTarget === "object") {
    for (const [name, entry] of Object.entries(incomingReadByTarget)) {
      const key = String(name || "").trim();
      if (!key) {
        continue;
      }
      const value = Number(entry?.value);
      normalizedReadByTarget[key] = {
        value: Number.isFinite(value) ? value : null,
        at: entry?.at || null
      };
    }
  }
  applicationServerState.readByTarget = normalizedReadByTarget;
  const sharded = isShardingEnabled();
  const preferredReadSource = sharded ? "mongos" : "default";
  const preferredRead = normalizedReadByTarget[preferredReadSource];
  if (preferredRead && typeof preferredRead.value === "number") {
    applicationServerState.lastCurrentValueAt = preferredRead.at || null;
    applicationServerState.lastCurrentValue = preferredRead.value;
  } else {
    applicationServerState.lastCurrentValueAt = metrics?.lastCurrentValueAt || null;
    applicationServerState.lastCurrentValue =
      typeof metrics?.lastCurrentValue === "number" ? metrics.lastCurrentValue : null;
  }
  renderApplicationServerMetrics();
  renderShardDataTable();
  renderGeographicMembersTable();
  refreshGeographicPulseRoles();
}

function updateLatencySeriesFromLogEntry(entry) {
  if (!entry || !entry.line) {
    return;
  }
  const line = String(entry.line);
  const entryTimestamp = Date.parse(entry.receivedAt || "");
  const writeLatencyMatch = /insertOne:\s*(\d+)ms/i.exec(line);
  if (writeLatencyMatch) {
    pushMetricSeriesPointAt(
      applicationServerState.writeLatencySeries,
      Number(writeLatencyMatch[1]),
      entryTimestamp
    );
  }

  const readTargetMatch = /\[READ:([^\]]+)\]/i.exec(line);
  if (readTargetMatch) {
    const readTarget = String(readTargetMatch[1] || "")
      .trim()
      .toLowerCase();
    if (readTarget !== "mongos" && readTarget !== "default") {
      return;
    }
  }
  const readLatencyMatch = /findOne:\s*(\d+)ms/i.exec(line);
  if (readLatencyMatch) {
    pushMetricSeriesPointAt(
      applicationServerState.readLatencySeries,
      Number(readLatencyMatch[1]),
      entryTimestamp
    );
  }
}

function rebuildLatencySeriesFromLogs(entries) {
  applicationServerState.writeLatencySeries = [];
  applicationServerState.readLatencySeries = [];
  for (const entry of entries || []) {
    updateLatencySeriesFromLogEntry(entry);
  }
}

function pushApplicationServerLog(entry) {
  if (!entry || !entry.line) {
    return;
  }
  updateLatencySeriesFromLogEntry(entry);
  const hasReadAddressUpdate = recordReadAddressFromLogEntry(entry);
  applicationServerState.logs.push(entry);
  if (applicationServerState.logs.length > APPLICATION_SERVER_MAX_LINES) {
    applicationServerState.logs.shift();
  }
  renderApplicationServerConsole();
  if (hasReadAddressUpdate) {
    refreshGeographicPulseRoles();
  }
}

function setApplicationServerConsoleHidden(hidden) {
  applicationServerConsoleHidden = hidden;
  setTableSectionExpanded(
    applicationServerConsoleContent,
    applicationServerToggleConsoleBtn,
    !applicationServerConsoleHidden
  );
}

function endpointRoleLabel(member) {
  const isReadOnlyNode = Number(member.priority) === 0 && Number(member.votes) === 0;
  if (isReadOnlyNode) {
    return "Read-only";
  }
  if (member.role === "primary") {
    return "Primary";
  }
  if (member.role === "secondary") {
    return "Secondary";
  }
  return "Other";
}

function getReplicaSetKey(member) {
  const shardName = String(member?.shard || "").trim();
  return shardName ? `shard:${shardName}` : "replicaset:default";
}

function buildPrimaryPresenceByReplicaSet(data) {
  const byReplicaSet = new Map();
  const members = Array.isArray(data?.members) ? data.members : [];
  for (const member of members) {
    const key = getReplicaSetKey(member);
    if (!byReplicaSet.has(key)) {
      byReplicaSet.set(key, false);
    }
    if (member?.role === "primary" || member?.name === data?.primaryName) {
      byReplicaSet.set(key, true);
    }
  }
  return byReplicaSet;
}

function isPrimaryUnreachableSecondary(member, data, primaryPresenceByReplicaSet = null) {
  if (!member.isHealthy || member.role !== "secondary") {
    return false;
  }

  const replicaSetPrimaryPresence =
    primaryPresenceByReplicaSet || buildPrimaryPresenceByReplicaSet(data);
  if (!replicaSetPrimaryPresence.get(getReplicaSetKey(member))) {
    return true;
  }

  const state = String(member.stateStr || "").toUpperCase();
  return (
    state.includes("PRIMARY") &&
    (state.includes("NOT") || state.includes("UNREACHABLE") || state.includes("CANNOT"))
  );
}

function renderTable(data) {
  tableBody.innerHTML = "";
  const primaryPresenceByReplicaSet = buildPrimaryPresenceByReplicaSet(data);
  data.members.forEach((member) => {
    const tr = document.createElement("tr");
    if (!member.isHealthy) {
      tr.classList.add("unhealthy-row");
    } else if (isPrimaryUnreachableSecondary(member, data, primaryPresenceByReplicaSet)) {
      tr.classList.add("warning-row");
    }

    tr.innerHTML = `
      <td>${getMemberDisplayName(member)}</td>
      <td>${endpointRoleLabel(member)}</td>
      <td>${getDataCenterDisplayLabel(member.dataCenter)}</td>
      <td>${member.shard || "-"}</td>
      <td>${member.stateStr}</td>
      <td>${member.priority}</td>
      <td>${member.isHealthy ? "Healthy" : "Unhealthy"}</td>
    `;
    tableBody.appendChild(tr);
  });
  renderShardDataTable();
}

function getClusterLevelLastReadValue() {
  return applicationServerState.lastCurrentValue === null ? "-" : String(applicationServerState.lastCurrentValue);
}

function getLastReadValueForMember(member) {
  if (!isShardingEnabled()) {
    return getClusterLevelLastReadValue();
  }
  const shardName = String(member?.shard || "").trim();
  if (!shardName) {
    return "-";
  }
  const shardReadValue = getReadCounterValueForTarget(shardName);
  return shardReadValue || "-";
}

function getZonesLabelForMember(member) {
  const shardName = String(member?.shard || "").trim();
  if (shardName) {
    return getZonesLabelForShard(shardName);
  }
  return "-";
}

function renderGeographicMembersTable() {
  if (!geoNodeTableBody || !geoNodeTableHint) {
    return;
  }
  setTableSectionExpanded(geoNodeTableContent, toggleGeoNodeTableBtn, tableVisibilityState.geoNodeTableExpanded);
  geoNodeTableBody.innerHTML = "";
  if (!selectedMapDataCenterId) {
    geoNodeTableHint.textContent = "Select a data center pin to view member details.";
    geoNodeTableHint.classList.remove("hidden");
    return;
  }
  const data = latestClusterStatus;
  const members = Array.isArray(data?.members) ? data.members : [];
  const selectedEntry = getDataCenterEntryById(selectedMapDataCenterId);
  const selectedDataCenterId = String(selectedEntry?.id || normalizeDataCenter(selectedMapDataCenterId)).trim();
  const selectedRegion = String(
    selectedEntry?.region || normalizeDataCenterRegion(selectedMapDataCenterId)
  ).trim().toUpperCase();
  const filteredMembers = members.filter((member) => {
    const resolvedMemberDataCenterId = resolveDataCenterIdForMember(member);
    if (resolvedMemberDataCenterId) {
      return resolvedMemberDataCenterId === selectedDataCenterId;
    }
    const memberRegion = resolveDataCenterRegionForValue(member?.dataCenterRegion || member?.dataCenter);
    return memberRegion ? memberRegion === selectedRegion : false;
  });
  if (!filteredMembers.length) {
    geoNodeTableHint.textContent = "No members found in the selected data center.";
    geoNodeTableHint.classList.remove("hidden");
    return;
  }
  geoNodeTableHint.classList.add("hidden");
  const primaryPresenceByReplicaSet = buildPrimaryPresenceByReplicaSet(data);
  for (const member of filteredMembers) {
    const tr = document.createElement("tr");
    if (!member.isHealthy) {
      tr.classList.add("unhealthy-row");
    } else if (isPrimaryUnreachableSecondary(member, data, primaryPresenceByReplicaSet)) {
      tr.classList.add("warning-row");
    }
    tr.innerHTML = `
      <td>${escapeHtml(getMemberDisplayName(member))}</td>
      <td>${escapeHtml(endpointRoleLabel(member))}</td>
      <td>${escapeHtml(getDataCenterDisplayLabel(member.dataCenter))}</td>
      <td>${escapeHtml(member.shard || "-")}</td>
      <td>${escapeHtml(member.stateStr || "-")}</td>
      <td>${escapeHtml(String(member.priority ?? "-"))}</td>
      <td>${member.isHealthy ? "Healthy" : "Unhealthy"}</td>
      <td>${escapeHtml(getZonesLabelForMember(member))}</td>
      <td>${escapeHtml(getLastReadValueForMember(member))}</td>
    `;
    geoNodeTableBody.appendChild(tr);
  }
}

function resolveDataCenterRegionForValue(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return null;
  }
  const byId = getDataCenterEntryById(raw);
  if (byId) {
    return String(byId.region || "").trim().toUpperCase() || null;
  }
  const upper = raw.toUpperCase();
  if (getConfiguredDataCenterRegions().includes(upper)) {
    return upper;
  }
  return null;
}

function resolveDataCenterIdForMember(member) {
  const entries = getConfiguredDataCenters();
  const dataCenterRaw = String(member?.dataCenter || "").trim();
  const dataCenterUpper = dataCenterRaw.toUpperCase();
  const dataCenterLower = dataCenterRaw.toLowerCase();
  const dataCenterRegion = resolveDataCenterRegionForValue(member?.dataCenterRegion || member?.dataCenter);

  if (dataCenterRaw) {
    const byId = entries.find((entry) => String(entry.id || "").trim().toLowerCase() === dataCenterLower);
    if (byId) {
      return String(byId.id || "").trim();
    }
    const byRegion = entries.find((entry) => String(entry.region || "").trim().toUpperCase() === dataCenterUpper);
    if (byRegion) {
      return String(byRegion.id || "").trim();
    }
    const byNameOrCity = entries.find((entry) => {
      const name = String(entry.name || "").trim().toLowerCase();
      const city = String(entry.city || "").trim().toLowerCase();
      return dataCenterLower === name || dataCenterLower === city;
    });
    if (byNameOrCity) {
      return String(byNameOrCity.id || "").trim();
    }
  }

  if (dataCenterRegion) {
    const byRegionHint = entries.find(
      (entry) => String(entry.region || "").trim().toUpperCase() === dataCenterRegion
    );
    if (byRegionHint) {
      return String(byRegionHint.id || "").trim();
    }
  }

  return null;
}

function getReadCounterValueForTarget(targetName) {
  const name = String(targetName || "").trim();
  if (!name) {
    return "";
  }
  const direct = applicationServerState.readByTarget?.[name];
  if (typeof direct?.value === "number") {
    return String(direct.value);
  }
  if (name === "mongos router") {
    const mongos = applicationServerState.readByTarget?.mongos;
    if (typeof mongos?.value === "number") {
      return String(mongos.value);
    }
  }
  return "";
}

function getZonesLabelForShard(targetName) {
  const name = String(targetName || "").trim();
  if (!name || name === "mongos router") {
    return "-";
  }
  const shardZones = latestClusterStatus?.shardZones;
  const zones = Array.isArray(shardZones?.[name])
    ? shardZones[name].map((entry) => String(entry || "").trim()).filter(Boolean)
    : [];
  if (!zones.length) {
    return "-";
  }
  zones.sort((a, b) => a.localeCompare(b));
  return zones.join(", ");
}

function renderShardDataTable() {
  if (!shardDataSection || !shardDataTableBody) {
    return;
  }
  const sharded = isShardingEnabled();
  shardDataSection.classList.toggle("hidden", !sharded);
  if (!sharded) {
    shardDataTableBody.innerHTML = "";
  } else {
    setTableSectionExpanded(shardDataContent, toggleShardDataBtn, tableVisibilityState.shardDataExpanded);

    const shardNames = [...getKnownShards()].sort((a, b) => a.localeCompare(b));
    const orderedTargets = ["mongos router", ...shardNames];
    shardDataTableBody.innerHTML = "";
    for (const targetName of orderedTargets) {
      const tr = document.createElement("tr");
      const zonesLabel = getZonesLabelForShard(targetName);
      const counterValue = getReadCounterValueForTarget(targetName);
      tr.innerHTML = `
      <td>${escapeHtml(targetName)}</td>
      <td>${escapeHtml(zonesLabel)}</td>
      <td>${escapeHtml(counterValue)}</td>
    `;
      shardDataTableBody.appendChild(tr);
    }
  }
  syncShardedClusterBodyClass();
}

function syncShardedClusterBodyClass() {
  document.body.classList.toggle("sharded-cluster", isShardingEnabled());
}

function syncWorkloadConsoleCollapseUi() {
  const expanded = workloadConsolePanelExpanded;
  const standard = activeView === "standard";
  const collapsed = !expanded && standard;
  document.body.classList.toggle("workload-console-collapsed", collapsed);
  if (toggleWorkloadConsolePanelBtn) {
    toggleWorkloadConsolePanelBtn.textContent = expanded ? "Collapse" : "Expand";
    toggleWorkloadConsolePanelBtn.setAttribute("aria-expanded", expanded ? "true" : "false");
  }
  if (workloadConsolePanelContent) {
    workloadConsolePanelContent.setAttribute("aria-hidden", collapsed ? "true" : "false");
  }
  if (workloadConsoleCollapsedRail) {
    workloadConsoleCollapsedRail.setAttribute("aria-hidden", collapsed ? "false" : "true");
  }
}

function syncViewToggleButtons() {
  if (standardLayoutBtn) {
    standardLayoutBtn.classList.toggle("active", activeView === "standard");
    standardLayoutBtn.setAttribute("aria-pressed", activeView === "standard" ? "true" : "false");
  }
  if (geographicLayoutBtn) {
    geographicLayoutBtn.classList.toggle("active", activeView === "geographic");
    geographicLayoutBtn.setAttribute("aria-pressed", activeView === "geographic" ? "true" : "false");
  }
}

async function renderGeographicView() {
  if (activeView !== "geographic") {
    return;
  }
  await ensureGeographicMapReady();
  renderDataCenterPins();
  refreshGeographicPulseRoles();
  renderGeographicMembersTable();
  if (geoMap) {
    geoMap.invalidateSize(false);
  }
}

function applyViewState() {
  const geographic = activeView === "geographic";
  document.body.classList.toggle("geographic-layout", geographic);
  const nodeLayoutToggleList = document.querySelector(".node-layout-chart-toggle-list");
  const geographicToggleList = document.querySelector(".geographic-layout-chart-toggle-list");
  if (nodeLayoutToggleList) {
    nodeLayoutToggleList.classList.toggle("hidden", geographic);
  }
  if (geographicToggleList) {
    geographicToggleList.classList.toggle("hidden", !geographic);
  }
  if (chartVisibilityLabel) {
    chartVisibilityLabel.textContent = geographic ? "Latency charts" : "Visible charts";
  }
  if (geographicMapSection) {
    geographicMapSection.classList.toggle("hidden", !geographic);
  }
  if (geoNodeTableSection) {
    geoNodeTableSection.classList.toggle("hidden", !geographic);
  }
  applyChartVisibility();
  syncViewToggleButtons();
  if (geographic) {
    renderGeographicView().catch((error) => {
      setStatus(`Map unavailable: ${error.message}`);
    });
  }
  syncWorkloadConsoleCollapseUi();
}

function setActiveView(nextView) {
  const normalized = nextView === "geographic" ? "geographic" : "standard";
  if (activeView === normalized) {
    return;
  }
  activeView = normalized;
  applyViewState();
}

if (toggleReplicaMembersBtn) {
  toggleReplicaMembersBtn.addEventListener("click", () => {
    tableVisibilityState.replicaMembersExpanded = !tableVisibilityState.replicaMembersExpanded;
    setTableSectionExpanded(
      replicaMembersContent,
      toggleReplicaMembersBtn,
      tableVisibilityState.replicaMembersExpanded
    );
  });
}

if (toggleShardDataBtn) {
  toggleShardDataBtn.addEventListener("click", () => {
    tableVisibilityState.shardDataExpanded = !tableVisibilityState.shardDataExpanded;
    setTableSectionExpanded(shardDataContent, toggleShardDataBtn, tableVisibilityState.shardDataExpanded);
  });
}

if (toggleGeoNodeTableBtn) {
  toggleGeoNodeTableBtn.addEventListener("click", () => {
    tableVisibilityState.geoNodeTableExpanded = !tableVisibilityState.geoNodeTableExpanded;
    setTableSectionExpanded(geoNodeTableContent, toggleGeoNodeTableBtn, tableVisibilityState.geoNodeTableExpanded);
  });
}

if (toggleWorkloadConsolePanelBtn) {
  toggleWorkloadConsolePanelBtn.addEventListener("click", () => {
    workloadConsolePanelExpanded = !workloadConsolePanelExpanded;
    syncWorkloadConsoleCollapseUi();
    if (workloadConsolePanelExpanded) {
      requestAnimationFrame(() => {
        renderApplicationServerMetrics();
      });
    }
  });
}

if (workloadConsoleRailExpandBtn) {
  workloadConsoleRailExpandBtn.addEventListener("click", () => {
    workloadConsolePanelExpanded = true;
    syncWorkloadConsoleCollapseUi();
    requestAnimationFrame(() => {
      renderApplicationServerMetrics();
    });
  });
}

setTableSectionExpanded(
  replicaMembersContent,
  toggleReplicaMembersBtn,
  tableVisibilityState.replicaMembersExpanded
);
setTableSectionExpanded(shardDataContent, toggleShardDataBtn, tableVisibilityState.shardDataExpanded);
setTableSectionExpanded(geoNodeTableContent, toggleGeoNodeTableBtn, tableVisibilityState.geoNodeTableExpanded);
if (toggleNodeWriteLatencyChart) {
  toggleNodeWriteLatencyChart.checked = chartVisibilityState.nodeWriteLatency;
}
if (toggleNodeReadLatencyChart) {
  toggleNodeReadLatencyChart.checked = chartVisibilityState.nodeReadLatency;
}
if (toggleGeoWriteLatencyChart) {
  toggleGeoWriteLatencyChart.checked = chartVisibilityState.geoWriteLatency;
}
if (toggleGeoReadLatencyChart) {
  toggleGeoReadLatencyChart.checked = chartVisibilityState.geoReadLatency;
}
applyChartVisibility();

if (toggleSinceWriteChart) {
  toggleSinceWriteChart.addEventListener("change", () => {
    chartVisibilityState.sinceWrite = Boolean(toggleSinceWriteChart.checked);
    applyChartVisibility();
  });
}
if (toggleSinceReadChart) {
  toggleSinceReadChart.addEventListener("change", () => {
    chartVisibilityState.sinceRead = Boolean(toggleSinceReadChart.checked);
    applyChartVisibility();
  });
}
if (toggleNodeWriteLatencyChart) {
  toggleNodeWriteLatencyChart.addEventListener("change", () => {
    chartVisibilityState.nodeWriteLatency = Boolean(toggleNodeWriteLatencyChart.checked);
    applyChartVisibility();
  });
}
if (toggleNodeReadLatencyChart) {
  toggleNodeReadLatencyChart.addEventListener("change", () => {
    chartVisibilityState.nodeReadLatency = Boolean(toggleNodeReadLatencyChart.checked);
    applyChartVisibility();
  });
}
if (toggleGeoWriteLatencyChart) {
  toggleGeoWriteLatencyChart.addEventListener("change", () => {
    chartVisibilityState.geoWriteLatency = Boolean(toggleGeoWriteLatencyChart.checked);
    applyChartVisibility();
  });
}
if (toggleGeoReadLatencyChart) {
  toggleGeoReadLatencyChart.addEventListener("change", () => {
    chartVisibilityState.geoReadLatency = Boolean(toggleGeoReadLatencyChart.checked);
    applyChartVisibility();
  });
}

function getTopologyViewport() {
  const viewBox = topologySvg.viewBox?.baseVal;
  if (viewBox && viewBox.width > 0 && viewBox.height > 0) {
    return {
      width: viewBox.width,
      height: viewBox.height,
      centerX: viewBox.width / 2,
      centerY: viewBox.height / 2
    };
  }
  return {
    width: 900,
    height: 420,
    centerX: 450,
    centerY: 210
  };
}

function getSvgPointFromClient(clientX, clientY) {
  const point = topologySvg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = topologySvg.getScreenCTM();
  if (!ctm) {
    return { x: clientX, y: clientY };
  }
  const svgPoint = point.matrixTransform(ctm.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

function getNodeRadius(memberCount, activeDataCenterCount = 0) {
  let radius = 26;
  if (memberCount <= 7 && activeDataCenterCount <= 2) {
    radius = 52;
  } else if (memberCount <= 12) {
    radius = 44;
  } else if (memberCount <= 18) {
    radius = 36;
  } else if (memberCount <= 26) {
    radius = 30;
  }
  if (activeDataCenterCount > 2) {
    radius = 44;
  }
  return radius;
}

function normalizeDataCenter(value) {
  return normalizeDataCenterLocationId(value);
}

function normalizeDataCenterRegion(value) {
  const raw = String(value || "").trim();
  const byId = getDataCenterEntryById(raw);
  if (byId) {
    return String(byId.region || "AMER").trim().toUpperCase();
  }
  const upper = raw.toUpperCase();
  if (getConfiguredDataCenterRegions().includes(upper)) {
    return upper;
  }
  return String(getConfiguredDataCenters()[0]?.region || "AMER").trim().toUpperCase();
}

function getRingCapacities(nodeCount) {
  const capacities = [];
  let total = 0;
  let ring = 0;
  while (total < nodeCount) {
    const capacity = ring === 0 ? 8 : 8 + ring * 6;
    capacities.push(capacity);
    total += capacity;
    ring += 1;
  }
  return capacities;
}

function placeMembersOnRings(members, centerX, centerY, maxRx, maxRy, baseAngle = -Math.PI / 2) {
  const positions = {};
  if (!members.length) {
    return positions;
  }

  const ringCapacities = getRingCapacities(members.length);
  const totalRings = ringCapacities.length;
  let cursor = 0;

  ringCapacities.forEach((capacity, ringIndex) => {
    if (cursor >= members.length) {
      return;
    }
    const ringMembers = members.slice(cursor, cursor + capacity);
    cursor += ringMembers.length;
    const ringRatio = (ringIndex + 1) / totalRings;
    const rx = Math.max(20, maxRx * ringRatio);
    const ry = Math.max(20, maxRy * ringRatio);
    const angleStep = (Math.PI * 2) / Math.max(1, ringMembers.length);

    ringMembers.forEach((member, memberIndex) => {
      const angle = baseAngle + memberIndex * angleStep;
      positions[member.name] = {
        x: centerX + rx * Math.cos(angle),
        y: centerY + ry * Math.sin(angle)
      };
    });
  });

  return positions;
}

function getActiveDataCenters(members) {
  const seen = new Set();
  members.forEach((member) => {
    seen.add(normalizeDataCenter(member.dataCenter));
  });
  const configuredIds = getConfiguredDataCenterIds();
  for (const isolatedId of isolatedDataCenters) {
    const normalized = normalizeDataCenter(isolatedId);
    if (configuredIds.includes(normalized)) {
      seen.add(normalized);
    }
  }
  return configuredIds.filter((id) => seen.has(id));
}

function signatureForDcIds(ids) {
  return [...ids].sort().join("|");
}

function loadTopologyDcLayoutRaw() {
  try {
    const raw = localStorage.getItem(TOPOLOGY_DC_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function saveTopologyDcLayoutPayload(payload) {
  try {
    localStorage.setItem(TOPOLOGY_DC_LAYOUT_STORAGE_KEY, JSON.stringify(payload));
  } catch (_error) {
    // ignore quota / private mode
  }
}

function mergeOrderWithActiveIds(savedOrder, activeIds) {
  const set = new Set(activeIds);
  const kept = (savedOrder || []).filter((id) => set.has(id));
  const rest = activeIds.filter((id) => !kept.includes(id));
  return [...kept, ...rest];
}

function isPermutationOfActiveIds(three, activeIds) {
  if (!three || typeof three !== "object") {
    return false;
  }
  const { tall, upper, lower } = three;
  const ids = [tall, upper, lower].map((id) => String(id || "").trim());
  if (ids.some((id) => !id)) {
    return false;
  }
  if (new Set(ids).size !== 3) {
    return false;
  }
  const set = new Set(activeIds);
  return ids.every((id) => set.has(id)) && activeIds.length === 3;
}

function defaultThreeLayoutFromActiveIds(activeIds) {
  return {
    wide: "left",
    tall: activeIds[0],
    upper: activeIds[1],
    lower: activeIds[2]
  };
}

function resolveTopologyDcLayout(members) {
  const activeIds = getActiveDataCenters(members);
  const sig = signatureForDcIds(activeIds);
  const raw = loadTopologyDcLayoutRaw();
  const n = activeIds.length;

  if (n <= 1) {
    return {
      signature: sig,
      orderedIds: activeIds,
      two: null,
      three: null,
      four: null
    };
  }

  if (n === 2) {
    let order = [...activeIds];
    if (raw && raw.signature === sig && Array.isArray(raw.two?.order) && raw.two.order.length === 2) {
      order = mergeOrderWithActiveIds(raw.two.order, activeIds);
    }
    return { signature: sig, orderedIds: order, two: { order }, three: null, four: null };
  }

  if (n === 3) {
    let three = defaultThreeLayoutFromActiveIds(activeIds);
    if (raw && raw.signature === sig && isPermutationOfActiveIds(raw.three, activeIds)) {
      three = {
        wide: raw.three.wide === "right" ? "right" : "left",
        tall: String(raw.three.tall).trim(),
        upper: String(raw.three.upper).trim(),
        lower: String(raw.three.lower).trim()
      };
    }
    return {
      signature: sig,
      orderedIds: [three.tall, three.upper, three.lower],
      two: null,
      three,
      four: null
    };
  }

  if (n === 4) {
    let order = [...activeIds];
    if (raw && raw.signature === sig && Array.isArray(raw.four?.order) && raw.four.order.length === 4) {
      order = mergeOrderWithActiveIds(raw.four.order, activeIds);
    }
    return { signature: sig, orderedIds: order, two: null, three: null, four: { order } };
  }

  return { signature: sig, orderedIds: activeIds, two: null, three: null, four: null };
}

function persistTopologyDcLayout(layout) {
  const payload = { signature: layout.signature };
  if (layout.two) {
    payload.two = layout.two;
  }
  if (layout.three) {
    payload.three = layout.three;
  }
  if (layout.four) {
    payload.four = layout.four;
  }
  saveTopologyDcLayoutPayload(payload);
}

function threeDcRoleOf(dcId, three) {
  const id = String(dcId || "").trim();
  if (id === three.tall) {
    return "tall";
  }
  if (id === three.upper) {
    return "upper";
  }
  if (id === three.lower) {
    return "lower";
  }
  return null;
}

function flipWide(wide) {
  return wide === "right" ? "left" : "right";
}

function applyTopologyDcDrop(layout, sourceDcId, targetDcId) {
  if (!layout || sourceDcId === targetDcId) {
    return null;
  }
  const n = layout.orderedIds.length;
  if (n === 2 && layout.two) {
    const order = [...layout.two.order];
    const si = order.indexOf(sourceDcId);
    const ti = order.indexOf(targetDcId);
    if (si < 0 || ti < 0) {
      return null;
    }
    [order[si], order[ti]] = [order[ti], order[si]];
    const next = {
      ...layout,
      orderedIds: order,
      two: { order }
    };
    return next;
  }
  if (n === 4 && layout.four) {
    const order = [...layout.four.order];
    const si = order.indexOf(sourceDcId);
    const ti = order.indexOf(targetDcId);
    if (si < 0 || ti < 0) {
      return null;
    }
    [order[si], order[ti]] = [order[ti], order[si]];
    return {
      ...layout,
      orderedIds: order,
      four: { order }
    };
  }
  if (n === 3 && layout.three) {
    const three = { ...layout.three };
    const rs = threeDcRoleOf(sourceDcId, three);
    const rt = threeDcRoleOf(targetDcId, three);
    if (!rs || !rt) {
      return null;
    }
    if ((rs === "upper" && rt === "lower") || (rs === "lower" && rt === "upper")) {
      [three.upper, three.lower] = [three.lower, three.upper];
    } else if (rs === "tall" && (rt === "upper" || rt === "lower")) {
      if (rt === "upper") {
        [three.tall, three.upper] = [three.upper, three.tall];
      } else {
        [three.tall, three.lower] = [three.lower, three.tall];
      }
    } else if ((rs === "upper" || rs === "lower") && rt === "tall") {
      const w = three.wide;
      const t = three.tall;
      const u = three.upper;
      const l = three.lower;
      if (rs === "upper") {
        three.wide = flipWide(w);
        three.tall = l;
        three.upper = t;
        three.lower = u;
      } else {
        three.wide = flipWide(w);
        three.tall = u;
        three.upper = t;
        three.lower = l;
      }
    } else {
      return null;
    }
    return {
      ...layout,
      orderedIds: [three.tall, three.upper, three.lower],
      three
    };
  }
  return null;
}

function getSectionGrid(dataCenterCount) {
  if (dataCenterCount <= 1) {
    return { columns: 1, rows: 1 };
  }
  if (dataCenterCount === 2) {
    return { columns: 2, rows: 1 };
  }
  if (dataCenterCount === 3) {
    return { columns: 2, rows: 2, asymmetric: true };
  }
  return { columns: 2, rows: 2, asymmetric: false };
}

function buildDataCenterSections(layout, viewport) {
  const sections = {};
  const activeDataCenters = layout.orderedIds;
  const count = activeDataCenters.length;
  const { columns, rows } = getSectionGrid(count);
  const outerPadding = 10;
  const sectionGap = 10;

  if (count === 3 && layout.three) {
    const { wide, tall, upper, lower } = layout.three;
    const availableWidth = viewport.width - outerPadding * 2 - sectionGap;
    const availableHeight = viewport.height - outerPadding * 2 - sectionGap;
    const sectionWidth = availableWidth / 2;
    const splitSectionHeight = availableHeight / 2;

    if (wide === "left") {
      sections[tall] = {
        x: outerPadding,
        y: outerPadding,
        width: sectionWidth,
        height: viewport.height - outerPadding * 2
      };
      sections[upper] = {
        x: outerPadding + sectionWidth + sectionGap,
        y: outerPadding,
        width: sectionWidth,
        height: splitSectionHeight
      };
      sections[lower] = {
        x: outerPadding + sectionWidth + sectionGap,
        y: outerPadding + splitSectionHeight + sectionGap,
        width: sectionWidth,
        height: splitSectionHeight
      };
    } else {
      sections[upper] = {
        x: outerPadding,
        y: outerPadding,
        width: sectionWidth,
        height: splitSectionHeight
      };
      sections[lower] = {
        x: outerPadding,
        y: outerPadding + splitSectionHeight + sectionGap,
        width: sectionWidth,
        height: splitSectionHeight
      };
      sections[tall] = {
        x: outerPadding + sectionWidth + sectionGap,
        y: outerPadding,
        width: sectionWidth,
        height: viewport.height - outerPadding * 2
      };
    }
    return sections;
  }

  const availableWidth = viewport.width - outerPadding * 2 - sectionGap * (columns - 1);
  const availableHeight = viewport.height - outerPadding * 2 - sectionGap * (rows - 1);
  const sectionWidth = availableWidth / columns;
  const sectionHeight = availableHeight / rows;

  activeDataCenters.forEach((dataCenter, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    const x = outerPadding + col * (sectionWidth + sectionGap);
    const y = outerPadding + row * (sectionHeight + sectionGap);
    sections[dataCenter] = { x, y, width: sectionWidth, height: sectionHeight };
  });
  return sections;
}

function drawDataCenterSections(svg, sections) {
  const viewport = getTopologyViewport();
  for (const dataCenter of Object.keys(sections)) {
    const section = sections[dataCenter];
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", section.x);
    rect.setAttribute("y", section.y);
    rect.setAttribute("width", section.width);
    rect.setAttribute("height", section.height);
    rect.setAttribute("rx", "10");
    rect.setAttribute("ry", "10");
    const isIsolated = isolatedDataCenters.has(normalizeDataCenter(dataCenter));
    rect.setAttribute(
      "class",
      isIsolated ? "topology-section-bg topology-section-isolated" : "topology-section-bg"
    );
    svg.appendChild(rect);

    const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
    const isRightColumn = section.x + section.width / 2 > viewport.centerX;
    label.setAttribute("x", isRightColumn ? section.x + section.width - 12 : section.x + 12);
    label.setAttribute("y", section.y + 18);
    label.setAttribute("text-anchor", isRightColumn ? "end" : "start");
    label.setAttribute("class", "topology-section-label");
    label.textContent = getDataCenterDisplayLabel(dataCenter);
    svg.appendChild(label);
  }
}

function getSectionDragBounds(section, nodeRadius) {
  return {
    minX: section.x + nodeRadius + 8,
    maxX: section.x + section.width - nodeRadius - 8,
    minY: section.y + nodeRadius + 22,
    maxY: section.y + section.height - nodeRadius - 8
  };
}

function clampPointToSection(point, section, nodeRadius) {
  const bounds = getSectionDragBounds(section, nodeRadius);
  return {
    x: Math.min(Math.max(point.x, bounds.minX), bounds.maxX),
    y: Math.min(Math.max(point.y, bounds.minY), bounds.maxY)
  };
}

function updateDraggedNodePosition(memberName, clientX, clientY) {
  if (!latestClusterStatus) {
    return;
  }
  const member = latestClusterStatus.members.find((entry) => entry.name === memberName);
  if (!member) {
    return;
  }
  const dataCenter = normalizeDataCenter(member.dataCenter);
  const section = latestTopologySections[dataCenter];
  if (!section) {
    return;
  }
  const svgPoint = getSvgPointFromClient(clientX, clientY);
  const clamped = clampPointToSection(svgPoint, section, latestNodeRadius);
  nodePositionOverrides.set(memberName, { ...clamped, dataCenter });
}

function getNodePositionsByDataCenter(members, nodeRadius) {
  const viewport = getTopologyViewport();
  const layout = resolveTopologyDcLayout(members);
  latestTopologyLayout = layout;
  const sections = buildDataCenterSections(layout, viewport);
  const positions = {};
  const headerOffsetY = 18;
  const innerPadding = nodeRadius + 10;

  layout.orderedIds.forEach((dataCenter) => {
    const section = sections[dataCenter];
    const dcMembers = members.filter((member) => normalizeDataCenter(member.dataCenter) === dataCenter);
    const centerX = section.x + section.width / 2;
    const centerY = section.y + section.height / 2 + headerOffsetY / 2;
    const maxRx = Math.max(20, section.width / 2 - innerPadding);
    const maxRy = Math.max(20, section.height / 2 - innerPadding - headerOffsetY / 2);
    const ringPositions = placeMembersOnRings(dcMembers, centerX, centerY, maxRx, maxRy);
    for (const member of dcMembers) {
      const defaultPoint = ringPositions[member.name];
      const override = nodePositionOverrides.get(member.name);
      if (override && override.dataCenter === dataCenter) {
        positions[member.name] = clampPointToSection(override, section, nodeRadius);
      } else {
        positions[member.name] = defaultPoint;
      }
    }
  });

  return { positions, sections };
}

function drawEdge(svg, fromPoint, toPoint, active) {
  const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  line.setAttribute("x1", fromPoint.x);
  line.setAttribute("y1", fromPoint.y);
  line.setAttribute("x2", toPoint.x);
  line.setAttribute("y2", toPoint.y);
  line.setAttribute("class", `edge ${active ? "active" : "inactive"}`);
  svg.appendChild(line);
}

function drawNode(svg, member, point, data, nodeRadius, primaryPresenceByReplicaSet) {
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("data-topology-node", "true");
  group.classList.add("topology-node-group");
  group.addEventListener("mousedown", (event) => {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    dragState.active = true;
    dragState.memberName = member.name;
    document.body.style.cursor = "grabbing";
  });
  group.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    showNodeContextMenu(event, member);
  });

  const service = memberNameToService(member.name);
  const isDataCenterIsolated = isolatedDataCenters.has(normalizeDataCenter(member.dataCenter));
  if (isolatedContainers.has(service) && !isDataCenterIsolated) {
    const isolationOutline = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const isolationPadding = 10;
    const isolationSize = nodeRadius * 2 + isolationPadding * 2;
    isolationOutline.setAttribute("x", point.x - nodeRadius - isolationPadding);
    isolationOutline.setAttribute("y", point.y - nodeRadius - isolationPadding);
    isolationOutline.setAttribute("width", String(isolationSize));
    isolationOutline.setAttribute("height", String(isolationSize));
    isolationOutline.setAttribute("class", "node-isolated-outline");
    group.appendChild(isolationOutline);
  }

  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", point.x);
  circle.setAttribute("cy", point.y);
  circle.setAttribute("r", String(nodeRadius));
  let nodeStateClass = "healthy";
  if (!member.isHealthy) {
    nodeStateClass = "unhealthy";
  } else if (isPrimaryUnreachableSecondary(member, data, primaryPresenceByReplicaSet)) {
    nodeStateClass = "warning";
  }
  circle.setAttribute("class", `node ${nodeStateClass}`);
  group.appendChild(circle);

  const shortName = getMemberDisplayName(member).split(":")[0];
  const statusSourceService = getStatusSourceServiceForMember(data, member);
  if (service === statusSourceService) {
    const statusSourceText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    statusSourceText.setAttribute("x", point.x);
    statusSourceText.setAttribute("y", point.y - Math.max(20, nodeRadius * 0.46));
    statusSourceText.setAttribute("class", "node-status-source");
    statusSourceText.textContent = "S";
    group.appendChild(statusSourceText);
  }
  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("x", point.x);
  label.setAttribute("y", point.y - Math.max(6, nodeRadius * 0.15));
  label.setAttribute("class", "node-label");
  label.textContent = shortName;
  group.appendChild(label);

  const roleText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  roleText.setAttribute("x", point.x);
  roleText.setAttribute("y", point.y + Math.max(24, nodeRadius * 0.52));
  roleText.setAttribute("class", "node-subtext");
  roleText.textContent = endpointRoleLabel(member);
  group.appendChild(roleText);

  const shardText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  shardText.setAttribute("x", point.x);
  shardText.setAttribute("y", point.y + Math.max(10, nodeRadius * 0.22));
  shardText.setAttribute("class", "node-subtext");
  const shardLabel =
    topologyShowShardLabels && member.shard ? String(member.shard).trim() : "";
  shardText.textContent = shardLabel;
  group.appendChild(shardText);

  const infoText = document.createElementNS("http://www.w3.org/2000/svg", "text");
  infoText.setAttribute("x", point.x);
  infoText.setAttribute("y", point.y + Math.max(36, nodeRadius * 0.78));
  infoText.setAttribute("class", "node-subtext");
  infoText.textContent = `P${member.priority} H${member.health}`;
  group.appendChild(infoText);

  svg.appendChild(group);
}

function findDataCenterAtSvgPoint(layout, sections, point) {
  if (!layout || !sections) {
    return null;
  }
  for (const dcId of layout.orderedIds) {
    const section = sections[dcId];
    if (!section) {
      continue;
    }
    if (
      point.x >= section.x &&
      point.x <= section.x + section.width &&
      point.y >= section.y &&
      point.y <= section.y + section.height
    ) {
      return dcId;
    }
  }
  return null;
}

function drawTopologyDcDragHandles(svg, layout, sections) {
  if (!layout || layout.orderedIds.length <= 1) {
    return;
  }
  const stripH = 22;
  const label = "Drag to reorder data center layout";
  for (const dcId of layout.orderedIds) {
    const section = sections[dcId];
    if (!section) {
      continue;
    }
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", section.x);
    rect.setAttribute("y", section.y);
    rect.setAttribute("width", section.width);
    rect.setAttribute("height", String(stripH));
    rect.setAttribute("class", "topology-dc-drag-handle");
    rect.setAttribute("data-dc-id", dcId);
    rect.setAttribute("role", "button");
    rect.setAttribute("tabindex", "0");
    rect.setAttribute("aria-label", `${label}: ${getDataCenterDisplayLabel(dcId)}`);
    rect.setAttribute("aria-grabbed", "false");
    svg.appendChild(rect);
  }
}

function cancelTopologyDcDrag() {
  if (!dcLayoutDragState.active) {
    return;
  }
  const handle = dcLayoutDragState.handleEl;
  const pid = dcLayoutDragState.pointerId;
  try {
    if (handle && pid != null && handle.releasePointerCapture) {
      try {
        handle.releasePointerCapture(pid);
      } catch (_e) {
        // ignore
      }
    }
  } finally {
    dcLayoutDragState.active = false;
    dcLayoutDragState.sourceDcId = null;
    dcLayoutDragState.pointerId = null;
    if (handle) {
      handle.setAttribute("aria-grabbed", "false");
    }
    dcLayoutDragState.handleEl = null;
    document.body.classList.remove("topology-dc-dragging");
  }
}

function finishTopologyDcDrag(event) {
  if (!dcLayoutDragState.active) {
    return;
  }
  const sourceDcId = dcLayoutDragState.sourceDcId;
  const handle = dcLayoutDragState.handleEl;
  const pid = dcLayoutDragState.pointerId;
  try {
    if (handle && pid != null && handle.releasePointerCapture) {
      try {
        handle.releasePointerCapture(pid);
      } catch (_e) {
        // ignore
      }
    }
    const point = getSvgPointFromClient(event.clientX, event.clientY);
    const targetDcId = findDataCenterAtSvgPoint(latestTopologyLayout, latestTopologySections, point);
    if (sourceDcId && targetDcId && latestClusterStatus) {
      const next = applyTopologyDcDrop(latestTopologyLayout, sourceDcId, targetDcId);
      if (next) {
        persistTopologyDcLayout(next);
        renderGraph(latestClusterStatus);
      }
    }
  } finally {
    dcLayoutDragState.active = false;
    dcLayoutDragState.sourceDcId = null;
    dcLayoutDragState.pointerId = null;
    if (handle) {
      handle.setAttribute("aria-grabbed", "false");
    }
    dcLayoutDragState.handleEl = null;
    document.body.classList.remove("topology-dc-dragging");
  }
}

function onTopologyDcPointerDown(event) {
  if (event.button !== 0) {
    return;
  }
  const handle = event.target.closest?.(".topology-dc-drag-handle");
  if (!handle || !topologySvg.contains(handle)) {
    return;
  }
  if (dragState.active) {
    return;
  }
  if (isOperationLocked()) {
    return;
  }
  const dcId = handle.getAttribute("data-dc-id");
  if (!dcId) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  dcLayoutDragState.active = true;
  dcLayoutDragState.sourceDcId = dcId;
  dcLayoutDragState.pointerId = event.pointerId;
  dcLayoutDragState.handleEl = handle;
  handle.setAttribute("aria-grabbed", "true");
  document.body.classList.add("topology-dc-dragging");
  try {
    handle.setPointerCapture(event.pointerId);
  } catch (_e) {
    // ignore
  }
}

topologySvg.addEventListener("pointerdown", onTopologyDcPointerDown, true);

document.addEventListener("pointerup", (event) => {
  if (dcLayoutDragState.active) {
    finishTopologyDcDrag(event);
  }
});

document.addEventListener("pointercancel", () => {
  if (dcLayoutDragState.active) {
    cancelTopologyDcDrag();
  }
});

topologySvg.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  showCanvasContextMenu(event);
});

function renderGraph(data) {
  const visibleMemberNames = new Set((data.members || []).map((member) => member.name));
  for (const memberName of [...nodePositionOverrides.keys()]) {
    if (!visibleMemberNames.has(memberName)) {
      nodePositionOverrides.delete(memberName);
    }
  }
  topologySvg.innerHTML = "";
  const activeDataCenterCount = getActiveDataCenters(data.members).length;
  const nodeRadius = getNodeRadius(data.members.length, activeDataCenterCount);
  const primaryPresenceByReplicaSet = buildPrimaryPresenceByReplicaSet(data);
  const { positions, sections } = getNodePositionsByDataCenter(data.members, nodeRadius);
  latestNodeRadius = nodeRadius;
  latestTopologySections = sections;
  const configuredDcIds = new Set(getConfiguredDataCenterIds());
  for (const dataCenter of [...isolatedDataCenters]) {
    if (!configuredDcIds.has(normalizeDataCenter(dataCenter))) {
      isolatedDataCenters.delete(dataCenter);
    }
  }
  drawDataCenterSections(topologySvg, sections);

  data.replicationEdges.forEach((edge) => {
    const from = positions[edge.from];
    const to = positions[edge.to];
    if (from && to) {
      drawEdge(topologySvg, from, to, Boolean(edge.active));
    }
  });

  data.members.forEach((member) => {
    drawNode(
      topologySvg,
      member,
      positions[member.name],
      data,
      nodeRadius,
      primaryPresenceByReplicaSet
    );
  });
  drawTopologyDcDragHandles(topologySvg, latestTopologyLayout, latestTopologySections);
}

async function requestJson(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const built = buildApiHeaders();
  for (const [key, value] of Object.entries(built)) {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  }
  const response = await fetch(url, { ...options, headers });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || payload.message || "Request failed");
  }
  return payload;
}

async function refreshNow() {
  setStatus("Refreshing status...");
  await refreshDataCenterConfigIfNeeded();
  const data = await requestJson("/api/status");
  latestClusterStatus = data;
  setAddressToMemberNameMapFromStatus(data.addressMap);
  setAddNodeShardFieldState();
  latestServiceRuntime = data.serviceRuntime || {};
  Object.entries(latestServiceRuntime).forEach(([service, runtime]) => {
    if (runtime?.containerRunning) {
      stoppedContainers.delete(service);
      return;
    }
    stoppedContainers.add(service);
  });
  if (!isApplicationServerLocationModalOpen()) {
    const normalizedWriteConcern = renderWriteConcernOptions(applicationServerMongoSettings.writeConcern);
    applicationServerMongoSettings.writeConcern = normalizedWriteConcern;
  }
  renderGraph(data);
  renderTable(data);
  renderDataCenterPins();
  refreshGeographicPulseRoles();
  renderGeographicMembersTable();
  refreshMapZones();
  evaluateOperationLockForStatus(data);
  applyUiControlUiMode();
  void maybeNoPasswordUiControlFlow();
  setStatus(`Updated at ${new Date(data.updatedAt).toLocaleTimeString()}`);
}

async function withBusy(button, action) {
  button.disabled = true;
  try {
    await action();
  } finally {
    button.disabled = false;
  }
}

async function refreshConfigurationSaveContext() {
  try {
    const raw = await requestJson("/api/configurations/save-context");
    if (raw.ok) {
      configurationSaveContext = {
        configurationDeployed: Boolean(raw.configurationDeployed),
        lastAppliedTemplateId: raw.lastAppliedTemplateId || null,
        lastAppliedTemplateName: raw.lastAppliedTemplateName || null,
        lastAppliedTemplateDescription:
          typeof raw.lastAppliedTemplateDescription === "string"
            ? raw.lastAppliedTemplateDescription
            : raw.lastAppliedTemplateDescription != null
              ? String(raw.lastAppliedTemplateDescription)
              : null
      };
    }
  } catch (_error) {
    configurationSaveContext = {
      configurationDeployed: false,
      lastAppliedTemplateId: null,
      lastAppliedTemplateName: null,
      lastAppliedTemplateDescription: null
    };
  }
  const deployed = Boolean(configurationSaveContext.configurationDeployed);
  if (saveConfigurationBtn) {
    saveConfigurationBtn.disabled = !deployed || !configurationSaveContext.lastAppliedTemplateId;
  }
  if (saveConfigurationAsBtn) {
    saveConfigurationAsBtn.disabled = !deployed;
  }
}

function closeConfigurationSaveModal() {
  if (!configurationSaveModalOverlay) {
    return;
  }
  configurationSaveModalOverlay.classList.add("hidden");
  configurationSaveModalOverlay.setAttribute("aria-hidden", "true");
  document.removeEventListener("keydown", onConfigurationSaveModalKey);
}

function onConfigurationSaveModalKey(event) {
  if (event.key === "Escape") {
    closeConfigurationSaveModal();
  }
}

function showConfigurationSaveModal(mode) {
  pendingConfigurationSaveMode = mode;
  if (
    !configurationSaveModalOverlay ||
    !configurationSaveModalTitle ||
    !saveTemplateNameInput ||
    !saveTemplateDescriptionInput
  ) {
    return;
  }
  const isOverwrite = mode === "overwrite";
  if (configurationSaveFilenameGroup) {
    configurationSaveFilenameGroup.classList.toggle("hidden", isOverwrite);
  }
  if (configurationSaveOverwriteHint) {
    if (isOverwrite && configurationSaveContext.lastAppliedTemplateId) {
      const id = configurationSaveContext.lastAppliedTemplateId;
      const nm = configurationSaveContext.lastAppliedTemplateName;
      configurationSaveOverwriteHint.textContent = nm
        ? `This will overwrite the file: ${id} (currently “${nm}”).`
        : `This will overwrite the file: ${id}.`;
      configurationSaveOverwriteHint.classList.remove("hidden");
    } else {
      configurationSaveOverwriteHint.classList.add("hidden");
    }
  }
  configurationSaveModalTitle.textContent = isOverwrite ? "Save template (overwrite)" : "Save template as…";
  saveTemplateNameInput.value = configurationSaveContext.lastAppliedTemplateName || "";
  saveTemplateDescriptionInput.value = String(
    configurationSaveContext.lastAppliedTemplateDescription ?? ""
  );
  if (saveTemplateFilenameInput) {
    saveTemplateFilenameInput.value = "";
  }
  configurationSaveModalOverlay.classList.remove("hidden");
  configurationSaveModalOverlay.setAttribute("aria-hidden", "false");
  document.addEventListener("keydown", onConfigurationSaveModalKey);
}

async function submitConfigurationSave() {
  const name = saveTemplateNameInput ? String(saveTemplateNameInput.value || "").trim() : "";
  const description = saveTemplateDescriptionInput ? String(saveTemplateDescriptionInput.value || "") : "";
  if (!name) {
    setStatus("Template name is required.");
    return;
  }
  if (pendingConfigurationSaveMode === "overwrite") {
    const target = configurationSaveContext.lastAppliedTemplateId;
    if (!target) {
      setStatus("No template file to overwrite.");
      return;
    }
    if (
      !window.confirm(
        `Overwrite template file "${target}" with the current configuration?\n\nThis replaces the file on disk.`
      )
    ) {
      return;
    }
    try {
      await requestJson("/api/configurations/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "overwrite", name, description })
      });
      setStatus(`Template saved to ${target}.`);
      closeConfigurationSaveModal();
      await refreshConfigurationSaveContext();
    } catch (error) {
      setStatus(`Save failed: ${error.message || "Request failed"}`);
    }
    return;
  }
  const rawFn = saveTemplateFilenameInput ? String(saveTemplateFilenameInput.value || "").trim() : "";
  if (!rawFn) {
    setStatus("Filename is required.");
    return;
  }
  try {
    const payload = await requestJson("/api/configurations/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "saveAs", filename: rawFn, name, description })
    });
    const fn = payload.filename || rawFn;
    setStatus(`Template saved as ${fn}.`);
    closeConfigurationSaveModal();
    await refreshConfigurationSaveContext();
  } catch (error) {
    setStatus(`Save failed: ${error.message || "Request failed"}`);
  }
}

async function bootstrapReplicaSetOnStartup() {
  setStatus("Ready. Use Configurations to apply a template and build the cluster.");
  await refreshNow();
  await refreshConfigurationSaveContext();
}

function openConfigurationTemplateModal(templates) {
  return new Promise((resolve) => {
    if (
      !configurationTemplateModalOverlay ||
      !configurationTemplateList ||
      !configurationTemplateDescription ||
      !configurationTemplateOkBtn ||
      !configurationTemplateCancelBtn
    ) {
      resolve(null);
      return;
    }

    let chosen = null;

    function onSaveOverwrite() {
      if (!configurationSaveContext.configurationDeployed) {
        setStatus("Apply a configuration template before saving.");
        return;
      }
      if (!configurationSaveContext.lastAppliedTemplateId) {
        setStatus("Save is only available after applying a configuration from a template file.");
        return;
      }
      finish({ save: true, mode: "overwrite" });
    }

    function onSaveAs() {
      if (!configurationSaveContext.configurationDeployed) {
        setStatus("Apply a configuration template before saving.");
        return;
      }
      finish({ save: true, mode: "saveAs" });
    }

    function cleanup() {
      configurationTemplateModalOverlay.classList.add("hidden");
      configurationTemplateModalOverlay.setAttribute("aria-hidden", "true");
      configurationTemplateList.innerHTML = "";
      configurationTemplateDescription.textContent = "";
      configurationTemplateOkBtn.disabled = true;
      document.removeEventListener("keydown", onKey);
      configurationTemplateModalOverlay.removeEventListener("click", onOverlayClick);
      configurationTemplateCancelBtn.removeEventListener("click", onCancel);
      configurationTemplateOkBtn.removeEventListener("click", onOk);
      if (saveConfigurationBtn) {
        saveConfigurationBtn.removeEventListener("click", onSaveOverwrite);
      }
      if (saveConfigurationAsBtn) {
        saveConfigurationAsBtn.removeEventListener("click", onSaveAs);
      }
    }

    function finish(result) {
      cleanup();
      resolve(result);
    }

    function onKey(event) {
      if (event.key === "Escape") {
        finish(null);
      }
    }

    function onOverlayClick(event) {
      if (event.target === configurationTemplateModalOverlay) {
        finish(null);
      }
    }

    function onCancel() {
      finish(null);
    }

    function onOk() {
      if (!chosen) {
        return;
      }
      finish(chosen);
    }

    configurationTemplateList.innerHTML = "";
    templates.forEach((entry) => {
      const li = document.createElement("li");
      li.className = "configuration-template-item";
      li.setAttribute("role", "option");
      li.tabIndex = 0;
      li.dataset.templateId = entry.id;
      li.textContent = String(entry.name || entry.id || "").trim() || entry.id;
      li.addEventListener("click", () => {
        chosen = entry;
        configurationTemplateList.querySelectorAll(".configuration-template-item").forEach((el) => {
          el.classList.remove("selected");
          el.removeAttribute("aria-selected");
        });
        li.classList.add("selected");
        li.setAttribute("aria-selected", "true");
        const desc = String(entry.description || "").trim();
        configurationTemplateDescription.textContent = desc || "(No description)";
        configurationTemplateOkBtn.disabled = false;
      });
      li.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          li.click();
        }
      });
      configurationTemplateList.appendChild(li);
    });

    configurationTemplateDescription.textContent = "Select a template above to view its description.";
    configurationTemplateOkBtn.disabled = true;

    if (saveConfigurationBtn) {
      saveConfigurationBtn.addEventListener("click", onSaveOverwrite);
    }
    if (saveConfigurationAsBtn) {
      saveConfigurationAsBtn.addEventListener("click", onSaveAs);
    }

    configurationTemplateModalOverlay.classList.remove("hidden");
    configurationTemplateModalOverlay.setAttribute("aria-hidden", "false");
    document.addEventListener("keydown", onKey);
    configurationTemplateModalOverlay.addEventListener("click", onOverlayClick);
    configurationTemplateCancelBtn.addEventListener("click", onCancel);
    configurationTemplateOkBtn.addEventListener("click", onOk);
  });
}

function generateDeploymentProgressToken() {
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function openDeploymentProgressModal(title, subtitle = "") {
  deploymentProgressModalTitle.textContent = title;
  const sub = String(subtitle || "").trim();
  deploymentProgressSubtitle.textContent = sub;
  deploymentProgressSubtitle.classList.toggle("hidden", !sub);
  deploymentProgressErrorLine.textContent = "";
  deploymentProgressErrorLine.classList.add("hidden");
  deploymentProgressStepsList.innerHTML = "";
  deploymentProgressRows.clear();
  deploymentProgressModalCloseBtn.disabled = true;
  deploymentProgressModalOverlay.classList.remove("hidden");
  deploymentProgressModalOverlay.setAttribute("aria-hidden", "false");
}

function closeDeploymentProgressModal() {
  deploymentProgressModalOverlay.classList.add("hidden");
  deploymentProgressModalOverlay.setAttribute("aria-hidden", "true");
}

function closeDeploymentProgressStream() {
  if (deploymentProgressStream) {
    deploymentProgressStream.close();
    deploymentProgressStream = null;
  }
}

function deploymentProgressRenderPlan(steps) {
  if (!Array.isArray(steps) || !steps.length) {
    return;
  }
  deploymentProgressStepsList.innerHTML = "";
  deploymentProgressRows.clear();
  for (const step of steps) {
    const id = String(step.id || "");
    const label = String(step.label || id);
    const row = document.createElement("li");
    row.className = "deployment-progress-step pending";
    row.dataset.stepId = id;
    const icon = document.createElement("span");
    icon.className = "deployment-progress-step-icon";
    icon.setAttribute("aria-hidden", "true");
    const labelEl = document.createElement("span");
    labelEl.className = "deployment-progress-step-label";
    const detailEl = document.createElement("p");
    detailEl.className = "deployment-progress-step-detail hidden";
    icon.innerHTML = '<span class="deployment-progress-pending-dot" aria-hidden="true"></span>';
    labelEl.textContent = label;
    row.appendChild(icon);
    row.appendChild(labelEl);
    row.appendChild(detailEl);
    deploymentProgressStepsList.appendChild(row);
    deploymentProgressRows.set(id, row);
    row._iconEl = icon;
    row._labelEl = labelEl;
    row._detailEl = detailEl;
  }
}

/**
 * Wait until the deployment progress EventSource is connected so the server has a subscriber
 * before emitting plan/step events. Otherwise the first fast steps can be dropped and stay "pending" in the UI.
 */
function waitForDeploymentProgressStreamReady(source, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (!source) {
      resolve();
      return;
    }
    if (source.readyState === EventSource.OPEN) {
      resolve();
      return;
    }
    const timer = window.setTimeout(() => {
      source.removeEventListener("open", onOpen);
      reject(new Error("Deployment progress stream connection timed out."));
    }, timeoutMs);
    const onOpen = () => {
      window.clearTimeout(timer);
      source.removeEventListener("open", onOpen);
      resolve();
    };
    source.addEventListener("open", onOpen);
  });
}

async function pollDeploymentProgressUntilTerminal(progressToken, options = {}) {
  const intervalMs = options.intervalMs ?? 2000;
  const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
  const start = Date.now();
  const q = encodeURIComponent(progressToken);
  while (Date.now() - start < timeoutMs) {
    const data = await requestJson(`/api/deployment-progress/status?token=${q}`);
    if (data.status === "done") {
      return data.result;
    }
    if (data.status === "error") {
      const err = new Error(data.error || "Deployment failed.");
      if (Array.isArray(data.validationErrors)) {
        err.validationErrors = data.validationErrors;
      }
      throw err;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Timed out waiting for deployment to finish.");
}

/**
 * @returns {Promise<unknown>} Resolves with the `result` payload from the terminal `complete` SSE event.
 */
function bindDeploymentProgressStream(progressToken, options = {}) {
  const timeoutMs = options.timeoutMs ?? 30 * 60 * 1000;
  closeDeploymentProgressStream();
  const source = new EventSource(
    `/api/deployment-progress/stream?token=${encodeURIComponent(progressToken)}`
  );
  deploymentProgressStream = source;

  return new Promise((resolve, reject) => {
    let settled = false;
    const overallTimer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        closeDeploymentProgressStream();
        reject(new Error("Deployment timed out waiting for completion."));
      }
    }, timeoutMs);

    function cleanup() {
      window.clearTimeout(overallTimer);
    }

    source.addEventListener("plan", (event) => {
      try {
        const data = JSON.parse(event.data);
        deploymentProgressRenderPlan(data.steps);
      } catch (_err) {
        // ignore malformed payloads
      }
    });
    source.addEventListener("step", (event) => {
      try {
        deploymentProgressHandleStep(JSON.parse(event.data));
      } catch (_err) {
        // ignore malformed payloads
      }
    });
    source.addEventListener("complete", (event) => {
      if (settled) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        settled = true;
        cleanup();
        closeDeploymentProgressStream();
        resolve(data.result ?? null);
      } catch (err) {
        settled = true;
        cleanup();
        closeDeploymentProgressStream();
        reject(err);
      }
    });
    source.addEventListener("deploymentError", (event) => {
      if (settled) {
        return;
      }
      try {
        const data = JSON.parse(event.data);
        const message = data.message || "Deployment failed.";
        deploymentProgressErrorLine.textContent = message;
        deploymentProgressErrorLine.classList.remove("hidden");
        const err = new Error(message);
        if (Array.isArray(data.validationErrors)) {
          err.validationErrors = data.validationErrors;
        }
        settled = true;
        cleanup();
        closeDeploymentProgressStream();
        reject(err);
      } catch (err) {
        deploymentProgressErrorLine.textContent = "Deployment failed.";
        deploymentProgressErrorLine.classList.remove("hidden");
        settled = true;
        cleanup();
        closeDeploymentProgressStream();
        reject(err);
      }
    });
    source.addEventListener("error", () => {
      if (settled || deploymentProgressStream !== source) {
        return;
      }
      window.setTimeout(async () => {
        if (settled || deploymentProgressStream !== source) {
          return;
        }
        if (source.readyState === EventSource.CLOSED) {
          try {
            const result = await pollDeploymentProgressUntilTerminal(progressToken, { timeoutMs });
            if (!settled) {
              settled = true;
              cleanup();
              closeDeploymentProgressStream();
              resolve(result);
            }
          } catch (err) {
            if (!settled) {
              settled = true;
              cleanup();
              closeDeploymentProgressStream();
              reject(err);
            }
          }
        }
      }, 500);
    });
  });
}

function deploymentProgressHandleStep(data) {
  const id = String(data.id || "");
  const label = String(data.label || id);
  const status = String(data.status || "");

  let row = deploymentProgressRows.get(id);
  if (!row) {
    row = document.createElement("li");
    row.className = "deployment-progress-step";
    row.dataset.stepId = id;
    const icon = document.createElement("span");
    icon.className = "deployment-progress-step-icon";
    icon.setAttribute("aria-hidden", "true");
    const labelEl = document.createElement("span");
    labelEl.className = "deployment-progress-step-label";
    const detailEl = document.createElement("p");
    detailEl.className = "deployment-progress-step-detail hidden";
    row.appendChild(icon);
    row.appendChild(labelEl);
    row.appendChild(detailEl);
    deploymentProgressStepsList.appendChild(row);
    deploymentProgressRows.set(id, row);
    row._iconEl = icon;
    row._labelEl = labelEl;
    row._detailEl = detailEl;
  }
  row._labelEl.textContent = label;
  row.classList.remove("running", "done", "error", "pending");
  if (status === "running") {
    row.classList.add("running");
    row._iconEl.classList.add("deployment-progress-icon-spin");
    row._iconEl.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true"><path d="M12 15.5A3.5 3.5 0 1 0 11.5 12 3.5 3.5 0 0 0 12 15.5m7.43-2.53c.04-.32.07-.64.07-.97 0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.4-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.63c-.04.34-.07.67-.07.99 0 .33.03.65.07.97l-2.11 1.63c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.25 1.17-.59 1.69-.98l2.49 1c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.63z"/></svg>';
  } else if (status === "done") {
    row.classList.add("done");
    row._iconEl.classList.remove("deployment-progress-icon-spin");
    row._iconEl.innerHTML = '<span class="deployment-progress-check" aria-hidden="true">✓</span>';
  } else if (status === "error") {
    row.classList.add("error");
    row._iconEl.classList.remove("deployment-progress-icon-spin");
    row._iconEl.innerHTML = '<span class="deployment-progress-check" style="color:#f87171" aria-hidden="true">✕</span>';
    row._detailEl.textContent = "";
    row._detailEl.classList.add("hidden");
  }
}

async function applyConfigurationTemplateFlow() {
  if (isOperationLocked()) {
    setStatus(OPERATION_LOCKED_STATUS);
    return;
  }
  await refreshConfigurationSaveContext();
  const templatesPayload = await requestJson("/api/configurations");
  const templates = Array.isArray(templatesPayload?.configurations) ? templatesPayload.configurations : [];
  if (!templates.length) {
    setStatus("No configuration templates found.");
    return;
  }
  const selected = await openConfigurationTemplateModal(templates);
  if (!selected) {
    setStatus("Configuration selection cancelled.");
    return;
  }
  if (selected.save) {
    showConfigurationSaveModal(selected.mode);
    return;
  }

  const lockToken = beginOperationLock(OPERATION_LOCK_REASON.TEMPLATE_APPLY);
  const progressToken = generateDeploymentProgressToken();
  openDeploymentProgressModal("Applying configuration", `Template: ${selected.name}`);
  const progressPromise = bindDeploymentProgressStream(progressToken);
  try {
    await waitForDeploymentProgressStreamReady(deploymentProgressStream);
    setStatus(`Applying configuration "${selected.name}" (rebuilding cluster)...`);
    const ack = await requestJson("/api/configurations/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ configurationId: selected.id, progressToken })
    });
    if (!ack?.accepted) {
      throw new Error("Configuration apply was not accepted.");
    }
    await progressPromise;
    await refreshDataCenterConfigIfNeeded({ force: true });
    await refreshNow();
    setStatus(`Configuration "${selected.name}" applied and cluster rebuilt.`);
  } catch (error) {
    closeDeploymentProgressStream();
    void progressPromise.catch(() => {});
    deploymentProgressErrorLine.textContent = error.message || "Configuration apply failed.";
    deploymentProgressErrorLine.classList.remove("hidden");
    setStatus(`Failed to apply configuration: ${error.message}`);
  } finally {
    closeDeploymentProgressStream();
    deploymentProgressModalCloseBtn.disabled = false;
    endOperationLock(lockToken);
  }
  await refreshConfigurationSaveContext();
}

applicationServerStartBtn.addEventListener("click", () =>
  withBusy(applicationServerStartBtn, async () => {
    const payload = await requestJson("/api/application-server/start", { method: "POST" });
    setStatus(payload.message || "ApplicationServer start request sent.");
  })
);

applicationServerStopBtn.addEventListener("click", () =>
  withBusy(applicationServerStopBtn, async () => {
    const payload = await requestJson("/api/application-server/stop", { method: "POST" });
    setStatus(payload.message || "ApplicationServer stop request sent.");
  })
);

applicationServerToggleConsoleBtn.addEventListener("click", () => {
  setApplicationServerConsoleHidden(!applicationServerConsoleHidden);
});

userLocationSelect.addEventListener("blur", () => {
  renderUserLocationOptions();
});

userLocationSelect.addEventListener("change", async () => {
  const selectedUserLocation = String(userLocationSelect.value || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{2}$/.test(selectedUserLocation)) {
    renderUserLocationOptions();
    return;
  }
  if (selectedUserLocation === applicationServerUserLocation) {
    return;
  }
  const previousUserLocation = applicationServerUserLocation;
  const lockToken = beginOperationLockOrNotify(OPERATION_LOCK_REASON.CONSOLE_SETTINGS, {
    control: "user-location"
  });
  if (lockToken === null) {
    renderUserLocationOptions();
    return;
  }
  try {
    const payload = await requestJson("/api/application-server/user-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userLocation: selectedUserLocation })
    });
    applicationServerUserLocation = String(payload.userLocation || selectedUserLocation)
      .trim()
      .toUpperCase();
    renderUserLocationOptions();
    setStatus(`User location updated to ${getCountryDisplayLabelByCode(applicationServerUserLocation)}.`);
  } catch (error) {
    applicationServerUserLocation = previousUserLocation;
    renderUserLocationOptions();
    setStatus(`Failed to update user location: ${error.message}`);
  } finally {
    endOperationLock(lockToken);
  }
});

applicationServerLocationSelect.addEventListener("change", async () => {
  const selectedLocation = normalizeDataCenterLocationId(applicationServerLocationSelect.value);
  if (selectedLocation === applicationServerLocation) {
    return;
  }
  const previousLocation = applicationServerLocation;
  const lockToken = beginOperationLockOrNotify(OPERATION_LOCK_REASON.CONSOLE_SETTINGS, {
    control: "application-server-location"
  });
  if (lockToken === null) {
    applicationServerLocationSelect.value = previousLocation;
    return;
  }
  try {
    setStatus(`Updating ApplicationServer location to ${selectedLocation}...`);
    const payload = await applyApplicationServerConsoleSettings({ location: selectedLocation });
    setStatus(
      payload.message ||
        `ApplicationServer location updated to ${applicationServerLocation}. Waiting for live status update...`
    );
  } catch (error) {
    applicationServerLocation = previousLocation;
    applicationServerLocationSelect.value = previousLocation;
    setStatus(`Failed to update ApplicationServer location: ${error.message}`);
  } finally {
    endOperationLock(lockToken);
  }
});

applicationServerReadPreferenceSelect.addEventListener("change", async () => {
  const selectedReadPreference = String(applicationServerReadPreferenceSelect.value || "").trim();
  if (!READ_PREFERENCE_OPTIONS.includes(selectedReadPreference)) {
    applicationServerReadPreferenceSelect.value = applicationServerMongoSettings.readPreference;
    return;
  }
  if (selectedReadPreference === applicationServerMongoSettings.readPreference) {
    return;
  }
  const previousReadPreference = applicationServerMongoSettings.readPreference;
  const lockToken = beginOperationLockOrNotify(OPERATION_LOCK_REASON.CONSOLE_SETTINGS, {
    control: "read-preference"
  });
  if (lockToken === null) {
    applicationServerReadPreferenceSelect.value = previousReadPreference;
    return;
  }
  try {
    setStatus(`Updating read preference to ${selectedReadPreference}...`);
    const payload = await applyApplicationServerConsoleSettings({
      readPreference: selectedReadPreference
    });
    setStatus(payload.message || `Read preference updated to ${selectedReadPreference}.`);
    await refreshNow();
  } catch (error) {
    applicationServerMongoSettings.readPreference = previousReadPreference;
    applicationServerReadPreferenceSelect.value = previousReadPreference;
    setStatus(`Failed to update read preference: ${error.message}`);
  } finally {
    endOperationLock(lockToken);
  }
});

applicationServerSettingsBtn.addEventListener("click", () => {
  if (isOperationLocked()) {
    setStatus(OPERATION_LOCKED_STATUS);
    return;
  }
  openApplicationServerLocationModal();
});

function openAdminModal() {
  if (!adminModalOverlay) {
    return;
  }
  const pwdReq = passwordRequiredForUiControlClaim();
  if (adminModalForm) {
    adminModalForm.reset();
  }
  if (adminModalHint) {
    adminModalHint.textContent = pwdReq
      ? "Enter the admin password to unlock controls for this browser session."
      : "Assume admin control for this browser. If someone else is in admin view, they will switch to read-only.";
  }
  if (adminModalTitle) {
    adminModalTitle.textContent = pwdReq ? "Admin access" : "Assume admin control";
  }
  if (adminPasswordFieldGroup) {
    adminPasswordFieldGroup.classList.toggle("hidden", !pwdReq);
  }
  if (adminPasswordInput) {
    adminPasswordInput.required = pwdReq;
    adminPasswordInput.value = "";
  }
  if (adminModalSubmitBtn) {
    adminModalSubmitBtn.textContent = pwdReq ? "Unlock" : "Assume admin";
  }
  adminModalOverlay.classList.remove("hidden");
  adminModalOverlay.setAttribute("aria-hidden", "false");
  if (pwdReq && adminPasswordInput) {
    adminPasswordInput.focus();
  } else if (adminModalSubmitBtn) {
    adminModalSubmitBtn.focus();
  }
}

function closeAdminModal() {
  if (!adminModalOverlay) {
    return;
  }
  adminModalOverlay.classList.add("hidden");
  adminModalOverlay.setAttribute("aria-hidden", "true");
}

async function submitAdminClaim(forceTakeover = false) {
  const pwdReq = passwordRequiredForUiControlClaim();
  const password = String(adminPasswordInput?.value || "").trim();
  if (pwdReq && !password) {
    setStatus("Password is required.");
    return;
  }
  try {
    await requestUiControlClaim({ password: pwdReq ? password : "", forceTakeover });
  } catch (error) {
    if (error.isConflict) {
      if (window.confirm("Take over control from the current session?")) {
        await submitAdminClaim(true);
      }
      return;
    }
    throw error;
  }
  closeAdminModal();
  await refreshNow();
  applyUiControlUiMode();
  setStatus("Admin controls unlocked for this session.");
}

if (adminBtn) {
  adminBtn.addEventListener("click", () => {
    openAdminModal();
  });
}
if (adminModalForm) {
  adminModalForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (adminModalSubmitBtn) {
      adminModalSubmitBtn.disabled = true;
    }
    try {
      await submitAdminClaim(false);
    } catch (error) {
      setStatus(error.message || "Claim failed");
    } finally {
      if (adminModalSubmitBtn) {
        adminModalSubmitBtn.disabled = false;
      }
    }
  });
}
if (adminModalCancelBtn) {
  adminModalCancelBtn.addEventListener("click", () => {
    closeAdminModal();
  });
}
if (adminModalOverlay) {
  adminModalOverlay.addEventListener("click", (event) => {
    if (event.target === adminModalOverlay) {
      closeAdminModal();
    }
  });
}

if (helpBtn) {
  helpBtn.addEventListener("click", () => {
    openHelpModal();
  });
}
if (helpTopicList) {
  helpTopicList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-help-topic-id]");
    if (!button) {
      return;
    }
    const topicId = String(button.dataset.helpTopicId || "").trim();
    if (!topicId) {
      return;
    }
    void setActiveHelpTopic(topicId);
  });
}

editZonesBtn.addEventListener("click", async () => {
  if (!isShardingEnabled()) {
    setStatus("Zones can only be edited when sharding is enabled.");
    return;
  }
  editZonesBtn.disabled = true;
  try {
    setStatus("Loading zones...");
    await loadZonesDefinitions();
    openZonesModal();
    setStatus("Zones loaded.");
  } catch (error) {
    setStatus(`Failed to load zones: ${error.message}`);
  } finally {
    editZonesBtn.disabled = false;
  }
});

canvasContextMenu.addEventListener("click", (event) => {
  if (!isEffectiveUiController()) {
    closeCanvasContextMenu();
    return;
  }
  if (isOperationLocked()) {
    closeCanvasContextMenu();
    setStatus(OPERATION_LOCKED_STATUS);
    return;
  }
  const button = event.target.closest(".context-menu-item");
  if (!button) {
    return;
  }
  event.stopPropagation();
  const action = String(button.dataset.action || "");
  const selectedDataCenterId = canvasMenuState.dataCenter
    ? normalizeDataCenter(canvasMenuState.dataCenter)
    : null;
  closeCanvasContextMenu();
  if (action === "add-node") {
    void openAddNodeModal();
    return;
  }
  if (action === "shard-replica-set") {
    const shouldProceed = window.confirm(
      "Shard replica set?\n\nWarning: sharding the replica set cannot be undone. Do you want to proceed?"
    );
    if (!shouldProceed) {
      setStatus("Replica set sharding cancelled.");
      return;
    }
    const proposedShardName = String(
      window.prompt("Enter initial shard name:", "shard1") || ""
    ).trim();
    if (!proposedShardName) {
      setStatus("Replica set sharding cancelled.");
      return;
    }
    if (!SHARD_NAME_PATTERN.test(proposedShardName)) {
      setStatus("Invalid shard name. Use letters, numbers, hyphen, or underscore.");
      return;
    }
    const lockToken = beginOperationLockOrNotify(OPERATION_LOCK_REASON.SHARD_REPLICA_SET, {
      expectedMemberNames: getExpectedShardMemberNames(latestClusterStatus)
    });
    if (lockToken === null) {
      return;
    }
    void (async () => {
      const progressToken = generateDeploymentProgressToken();
      openDeploymentProgressModal("Sharding replica set", `Shard name: ${proposedShardName}`);
      const progressPromise = bindDeploymentProgressStream(progressToken);
      try {
        await waitForDeploymentProgressStreamReady(deploymentProgressStream);
        setStatus("Sharding replica set...");
        const ack = await requestJson("/api/replicaset/shard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ shardName: proposedShardName, progressToken })
        });
        if (!ack?.accepted) {
          throw new Error("Shard request was not accepted.");
        }
        const payload = await progressPromise;
        setStatus(payload?.message || "Replica set sharded.");
        await refreshNow();
      } catch (error) {
        closeDeploymentProgressStream();
        void progressPromise.catch(() => {});
        deploymentProgressErrorLine.textContent = error.message || "Sharding failed.";
        deploymentProgressErrorLine.classList.remove("hidden");
        setStatus(`Failed to shard replica set: ${error.message}`);
      } finally {
        closeDeploymentProgressStream();
        deploymentProgressModalCloseBtn.disabled = false;
        endOperationLock(lockToken);
      }
    })();
    return;
  }
  if (action === "network-isolate-datacenter" || action === "network-connect-datacenter") {
    if (!selectedDataCenterId) {
      setStatus("Select a data center section to run this action.");
      return;
    }
    const selectedDataCenterLabel = getDataCenterDisplayLabel(selectedDataCenterId);
    const shouldIsolate = action === "network-isolate-datacenter";
    const endpoint = shouldIsolate
      ? "/api/network/datacenter/isolate"
      : "/api/network/datacenter/connect";
    const verb = shouldIsolate ? "Disconnecting" : "Reconnecting";
    const fallbackMessage = shouldIsolate
      ? `Data center ${selectedDataCenterLabel} disconnected from inter-region and intra-region networks.`
      : `Data center ${selectedDataCenterLabel} reconnected to inter-region and intra-region networks.`;
    setStatus(`${verb} ${selectedDataCenterLabel} data center networks...`);
    requestJson(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataCenterId: selectedDataCenterId })
    })
      .then(async (payload) => {
        const containers = Array.isArray(payload.containers) ? payload.containers : [];
        if (shouldIsolate) {
          isolatedDataCenters.add(selectedDataCenterId);
          containers.forEach((container) => isolatedContainers.add(container));
        } else {
          isolatedDataCenters.delete(selectedDataCenterId);
          containers.forEach((container) => isolatedContainers.delete(container));
        }
        setStatus(payload.message || fallbackMessage);
        await refreshNow();
      })
      .catch((error) => {
        setStatus(
          `Failed to ${
            shouldIsolate ? "disconnect" : "reconnect"
          } ${selectedDataCenterLabel} data center: ${error.message}`
        );
      });
  }
});

addNodeCancelBtn.addEventListener("click", () => {
  closeAddNodeModal();
});

addNodeModalOverlay.addEventListener("click", (event) => {
  if (event.target === addNodeModalOverlay) {
    closeAddNodeModal();
  }
});

applicationServerLocationCancelBtn.addEventListener("click", () => {
  closeApplicationServerLocationModal();
});

zonesCancelBtn.addEventListener("click", () => {
  closeZonesModal();
});
if (helpModalCloseBtn) {
  helpModalCloseBtn.addEventListener("click", () => {
    closeHelpModal();
  });
}

applicationServerLocationModalOverlay.addEventListener("click", (event) => {
  if (event.target === applicationServerLocationModalOverlay) {
    closeApplicationServerLocationModal();
  }
});

zonesModalOverlay.addEventListener("click", (event) => {
  if (event.target === zonesModalOverlay) {
    closeZonesModal();
  }
});
if (helpModalOverlay) {
  helpModalOverlay.addEventListener("click", (event) => {
    if (event.target === helpModalOverlay) {
      closeHelpModal();
    }
  });
}

addZoneBtn.addEventListener("click", () => {
  zonesEditorState.draftZones.push(
    toZoneDraft({
      name: "",
      countries: [],
      shards: []
    })
  );
  renderZonesEditor();
});

zonesList.addEventListener("input", (event) => {
  const input = event.target.closest("[data-zone-field='name']");
  if (!input) {
    return;
  }
  const card = input.closest("[data-zone-id]");
  if (!card) {
    return;
  }
  const zone = getZoneDraftById(String(card.dataset.zoneId || ""));
  if (!zone) {
    return;
  }
  zone.name = String(input.value || "").trim();
  if (zonesEditorState.validationIssue?.zoneId === zone.id && zonesEditorState.validationIssue?.field === "name") {
    zonesEditorState.validationIssue = null;
    input.classList.remove("zone-input-invalid");
    input.setAttribute("aria-invalid", "false");
    const validationMessage = card.querySelector(".zone-validation-message");
    if (validationMessage) {
      validationMessage.remove();
    }
  }
});

zonesList.addEventListener("click", (event) => {
  const moveButton = event.target.closest("button[data-zone-action='move-picker-items']");
  if (moveButton) {
    const card = moveButton.closest("[data-zone-id]");
    if (!card) {
      return;
    }
    const zone = getZoneDraftById(String(card.dataset.zoneId || ""));
    if (!zone) {
      return;
    }
    const fieldName = String(moveButton.dataset.zoneField || "");
    const direction = String(moveButton.dataset.zoneDirection || "");
    const sourceColumn = direction === "add" ? "available" : "selected";
    const sourceSelect = card.querySelector(
      `select[data-zone-picker='${fieldName}'][data-zone-column='${sourceColumn}']`
    );
    if (!sourceSelect) {
      return;
    }
    const selectedValues = [...sourceSelect.selectedOptions]
      .map((option) => String(option.value || "").trim())
      .filter(Boolean);
    if (!selectedValues.length) {
      return;
    }
    if (fieldName === "countries") {
      if (direction === "add") {
        zone.countries = [...new Set([...zone.countries, ...selectedValues.map((entry) => entry.toUpperCase())])];
      } else if (direction === "remove") {
        const removed = new Set(selectedValues.map((entry) => entry.toUpperCase()));
        zone.countries = zone.countries.filter((code) => !removed.has(code));
      }
      renderZonesEditor();
      return;
    }
    if (fieldName === "shards") {
      if (direction === "add") {
        zone.shards = [...new Set([...zone.shards, ...selectedValues])];
      } else if (direction === "remove") {
        const removed = new Set(selectedValues);
        zone.shards = zone.shards.filter((shardName) => !removed.has(shardName));
      }
      renderZonesEditor();
      return;
    }
  }

  const removeButton = event.target.closest("button[data-zone-action='remove-zone']");
  if (!removeButton) {
    return;
  }
  const card = removeButton.closest("[data-zone-id]");
  if (!card) {
    return;
  }
  const zoneId = String(card.dataset.zoneId || "");
  zonesEditorState.draftZones = zonesEditorState.draftZones.filter((zone) => zone.id !== zoneId);
  if (zonesEditorState.validationIssue?.zoneId === zoneId) {
    zonesEditorState.validationIssue = null;
  }
  renderZonesEditor();
});

zonesSaveBtn.addEventListener("click", async () => {
  const validationError = validateZonesDraft();
  if (validationError) {
    zonesEditorState.validationIssue = validationError;
    renderZonesEditor();
    const invalidZoneInput = zonesList.querySelector("[data-zone-field='name'].zone-input-invalid");
    if (invalidZoneInput instanceof HTMLElement) {
      invalidZoneInput.focus();
    }
    setStatus(validationError.message);
    return;
  }
  zonesEditorState.validationIssue = null;
  zonesSaveBtn.disabled = true;
  try {
    setStatus("Saving zones...");
    const payload = await requestJson("/api/zones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zones: buildZonesSavePayload() })
    });
    zonesEditorState.loadedZones = Array.isArray(payload.zones)
      ? payload.zones.map((zone) => ({
          name: String(zone?.name || "").trim(),
          countries: Array.isArray(zone?.countries) ? zone.countries.map((code) => String(code)) : [],
          shards: Array.isArray(zone?.shards) ? zone.shards.map((shard) => String(shard)) : []
        }))
      : [];
    zonesEditorState.updatedAt = payload.updatedAt || null;
    setMapZonesFromPayload(payload);
    refreshCountryLayerStyles();
    renderGeographicMembersTable();
    closeZonesModal();
    setStatus("Zones saved.");
  } catch (error) {
    zonesSaveBtn.disabled = false;
    setStatus(`Failed to save zones: ${error.message}`);
  }
});

applicationServerLocationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const writeConcern = normalizeWriteConcern(applicationServerWriteConcernSelect.value);
  if (writeConcern === null) {
    const votingNodeCount = getVotingNodeCount();
    setStatus(`Write Concern must be majority or an integer between 0 and ${votingNodeCount}.`);
    applicationServerWriteConcernSelect.focus();
    return;
  }
  const readConcern = String(applicationServerReadConcernSelect.value || "").trim();
  if (!READ_CONCERN_OPTIONS.includes(readConcern)) {
    setStatus("Read Concern is invalid.");
    applicationServerReadConcernSelect.focus();
    return;
  }
  const electionTimeoutMs = normalizeElectionTimeoutMs(replicaSetElectionTimeoutInput.value);
  if (electionTimeoutMs === null) {
    setStatus(
      `Replica set electionTimeout must be an integer from ${ELECTION_TIMEOUT_MIN_MS} to ${ELECTION_TIMEOUT_MAX_MS}.`
    );
    replicaSetElectionTimeoutInput.focus();
    return;
  }
  const previousWriteConcern = normalizeWriteConcern(applicationServerMongoSettings.writeConcern);
  const previousReadConcern = READ_CONCERN_OPTIONS.includes(applicationServerMongoSettings.readConcern)
    ? applicationServerMongoSettings.readConcern
    : DEFAULT_READ_CONCERN;
  const previousElectionTimeoutMs =
    normalizeElectionTimeoutMs(applicationServerMongoSettings.electionTimeoutMs) ??
    DEFAULT_ELECTION_TIMEOUT_MS;
  const nextTopologyShowShardLabels = Boolean(topologyShowShardLabelsCheckbox?.checked);
  const noChanges =
    previousWriteConcern === writeConcern &&
    previousReadConcern === readConcern &&
    previousElectionTimeoutMs === electionTimeoutMs &&
    topologyShowShardLabels === nextTopologyShowShardLabels;
  if (noChanges) {
    closeApplicationServerLocationModal();
    setStatus("Settings unchanged.");
    return;
  }
  applicationServerLocationSaveBtn.disabled = true;
  try {
    setStatus("Applying settings...");
    const payload = await requestJson("/api/application-server/location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        location: applicationServerLocation,
        electionTimeoutMs,
        writeConcern,
        readConcern,
        readPreference: applicationServerMongoSettings.readPreference,
        topologyShowShardLabels: nextTopologyShowShardLabels
      })
    });
    applicationServerMongoSettings.writeConcern =
      normalizeWriteConcern(payload.writeConcern) ?? writeConcern;
    applicationServerMongoSettings.readConcern = READ_CONCERN_OPTIONS.includes(payload.readConcern)
      ? payload.readConcern
      : readConcern;
    applicationServerMongoSettings.electionTimeoutMs =
      normalizeElectionTimeoutMs(payload.electionTimeoutMs) ?? electionTimeoutMs;
    topologyShowShardLabels = payload.topologyShowShardLabels === false ? false : true;
    if (topologyShowShardLabelsCheckbox) {
      topologyShowShardLabelsCheckbox.checked = topologyShowShardLabels;
    }
    renderWorkloadConsoleLabel();
    closeApplicationServerLocationModal();
    setStatus(payload.message || "Settings applied.");
    await refreshNow();
  } catch (error) {
    applicationServerLocationSaveBtn.disabled = false;
    setStatus(`Failed to update ApplicationServer location: ${error.message}`);
  }
});

addNodeForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = String(addNodeNameInput.value || "").trim();
  const role = String(addNodeRoleSelect.value || "").trim();
  const dataCenter = String(addNodeDataCenterSelect.value || "").trim().toLowerCase();
  const shardName = String(addNodeShardNameInput?.value || "").trim();
  const sharded = isShardingEnabled();
  if (!name) {
    setStatus("Node name is required.");
    addNodeNameInput.focus();
    return;
  }
  if (role !== "voting" && role !== "analytics") {
    setStatus("Node role is invalid.");
    return;
  }
  if (!getConfiguredDataCenterIds().includes(dataCenter)) {
    setStatus("Data center is invalid.");
    return;
  }
  if (sharded) {
    if (!shardName) {
      setStatus("Shard name is required while sharding is enabled.");
      addNodeShardNameInput.focus();
      return;
    }
    if (!SHARD_NAME_PATTERN.test(shardName)) {
      setStatus("Shard name is invalid. Use letters, numbers, hyphen, or underscore.");
      addNodeShardNameInput.focus();
      return;
    }
    const knownShards = getKnownShards();
    if (!knownShards.has(shardName)) {
      const shouldCreate = window.confirm(
        `Shard "${shardName}" does not exist. Create a new shard with this name?`
      );
      if (!shouldCreate) {
        setStatus("Add node cancelled.");
        return;
      }
      if (role === "analytics") {
        setStatus("Cannot add an analytics node as the first node in a new shard.");
        return;
      }
    }
  }

  addNodeSubmitBtn.disabled = true;
  const submittedNode = { name, role, dataCenter, shardName };
  try {
    closeAddNodeModal();
    closeCanvasContextMenu();
    closeNodeContextMenu();
    setStatus(`Adding ${role} node ${name}...`);
    const payload = await requestJson("/api/replicaset/nodes/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, role, dataCenter, shardName: sharded ? shardName : undefined })
    });
    setStatus(payload.message || `Node ${name} added.`);
    await refreshNow();
  } catch (error) {
    void openAddNodeModal();
    addNodeNameInput.value = submittedNode.name;
    addNodeRoleSelect.value = submittedNode.role;
    addNodeDataCenterSelect.value = submittedNode.dataCenter;
    if (addNodeShardNameInput) {
      addNodeShardNameInput.value = submittedNode.shardName;
    }
    addNodeSubmitBtn.disabled = false;
    setStatus(`Failed to add node ${name}: ${error.message}`);
  }
});

nodeContextMenu.addEventListener("click", async (event) => {
  if (!isEffectiveUiController()) {
    closeNodeContextMenu();
    return;
  }
  if (isOperationLocked()) {
    closeNodeContextMenu();
    setStatus(OPERATION_LOCKED_STATUS);
    return;
  }
  const button = event.target.closest(".context-menu-item");
  if (!button) {
    return;
  }
  event.stopPropagation();

  const action = String(button.dataset.action || "");
  const memberName = menuState.memberName;
  if (!memberName) {
    closeNodeContextMenu();
    return;
  }

  const service = memberNameToService(memberName);

  if (action === "stop-mongodb-graceful" || action === "stop-mongodb-hard") {
    closeNodeContextMenu();
    try {
      const isHardStop = action === "stop-mongodb-hard";
      setStatus(
        isHardStop
          ? `Hard-stopping MongoDB on ${service}...`
          : `Stopping MongoDB gracefully on ${service}...`
      );
      const payload = await requestJson(
        isHardStop ? "/api/mongodb/stop-hard" : "/api/mongodb/stop-graceful",
        {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service })
        }
      );
      mongodStoppedServices.add(service);
      setStatus(
        payload.message ||
          (isHardStop
            ? `MongoDB hard-stopped on ${service}.`
            : `MongoDB stopped gracefully on ${service}.`)
      );
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to stop MongoDB on ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "start-mongodb") {
    closeNodeContextMenu();
    try {
      setStatus(`Starting MongoDB on ${service}...`);
      const payload = await requestJson("/api/mongodb/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service })
      });
      mongodStoppedServices.delete(service);
      setStatus(payload.message || `MongoDB started on ${service}.`);
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to start MongoDB on ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "increase-mongodb-priority" || action === "decrease-mongodb-priority") {
    closeNodeContextMenu();
    try {
      const isIncrease = action === "increase-mongodb-priority";
      setStatus(
        isIncrease
          ? `Increasing MongoDB priority on ${service}...`
          : `Decreasing MongoDB priority on ${service}...`
      );
      const payload = await requestJson(
        isIncrease ? "/api/mongodb/priority/increase" : "/api/mongodb/priority/decrease",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ service })
        }
      );
      setStatus(
        payload.message ||
          (isIncrease
            ? `MongoDB priority increased on ${service}.`
            : `MongoDB priority decreased on ${service}.`)
      );
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to update MongoDB priority on ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "network-isolate-container") {
    closeNodeContextMenu();
    try {
      setStatus(`Disconnecting ${service} from data-center networks...`);
      const payload = await requestJson("/api/network/isolate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ container: service })
      });
      isolatedContainers.add(service);
      setStatus(payload.message || `Container ${service} disconnected from data-center networks.`);
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to isolate ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "network-connect-container") {
    closeNodeContextMenu();
    try {
      setStatus(`Connecting ${service} to data-center networks...`);
      const payload = await requestJson("/api/network/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ container: service })
      });
      isolatedContainers.delete(service);
      setStatus(payload.message || `Container ${service} connected to data-center networks.`);
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to connect ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "set-status-node") {
    closeNodeContextMenu();
    try {
      setStatus(`Setting ${service} as status node...`);
      const selectedMember = latestClusterStatus?.members?.find((entry) => entry.name === memberName);
      const shardName = String(selectedMember?.shard || "").trim();
      const payload = await requestJson("/api/status-node/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service, shardName: shardName || undefined })
      });
      setStatus(payload.message || `Status node set to ${service}.`);
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to set status node ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "stop-container") {
    closeNodeContextMenu();
    try {
      setStatus(`Stopping container ${service}...`);
      const payload = await requestJson("/api/container/stop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service })
      });
      stoppedContainers.add(service);
      setStatus(payload.message || `Container ${service} stopped.`);
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to stop container ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "start-container") {
    closeNodeContextMenu();
    try {
      setStatus(`Starting container ${service}...`);
      const payload = await requestJson("/api/container/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service })
      });
      stoppedContainers.delete(service);
      setStatus(payload.message || `Container ${service} started.`);
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to start container ${service}: ${error.message}`);
    }
    return;
  }

  if (action === "remove-replica-node") {
    closeNodeContextMenu();
    try {
      setStatus(`Removing ${service} from replica set and deleting container...`);
      const payload = await requestJson("/api/replicaset/nodes/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ service })
      });
      isolatedContainers.delete(service);
      stoppedContainers.delete(service);
      mongodStoppedServices.delete(service);
      setStatus(payload.message || `Removed ${service} from replica set.`);
      await refreshNow();
    } catch (error) {
      setStatus(`Failed to remove node ${service}: ${error.message}`);
    }
    return;
  }

  closeNodeContextMenu();
});

document.addEventListener("click", (event) => {
  if (menuState.isVisible && !nodeContextMenu.contains(event.target)) {
    closeNodeContextMenu();
  }
  if (canvasMenuState.isVisible && !canvasContextMenu.contains(event.target)) {
    closeCanvasContextMenu();
  }
});

document.addEventListener("mousemove", (event) => {
  if (!dragState.active || !dragState.memberName) {
    return;
  }
  updateDraggedNodePosition(dragState.memberName, event.clientX, event.clientY);
  if (latestClusterStatus) {
    renderGraph(latestClusterStatus);
  }
});

document.addEventListener("mouseup", () => {
  if (!dragState.active) {
    return;
  }
  dragState.active = false;
  dragState.memberName = null;
  document.body.style.cursor = "";
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (dcLayoutDragState.active) {
      cancelTopologyDcDrag();
    }
    if (dragState.active) {
      dragState.active = false;
      dragState.memberName = null;
      document.body.style.cursor = "";
    }
    closeNodeContextMenu();
    closeCanvasContextMenu();
    closeAddNodeModal();
    closeApplicationServerLocationModal();
    closeZonesModal();
    closeHelpModal();
  }
});

if (standardLayoutBtn) {
  standardLayoutBtn.addEventListener("click", () => {
    setActiveView("standard");
  });
}

if (geographicLayoutBtn) {
  geographicLayoutBtn.addEventListener("click", () => {
    setActiveView("geographic");
  });
}

if (applyConfigurationBtn) {
  applyConfigurationBtn.addEventListener("click", () =>
    withBusy(applyConfigurationBtn, async () => {
      try {
        await applyConfigurationTemplateFlow();
      } catch (error) {
        const message = `Configuration error: ${error?.message || "Request failed"}`;
        setStatus(message);
        window.alert(`${message}\n\nAcknowledge this error to continue.`);
      }
    })
  );
}

if (configurationSaveCancelBtn) {
  configurationSaveCancelBtn.addEventListener("click", () => {
    closeConfigurationSaveModal();
  });
}

if (configurationSaveSubmitBtn) {
  configurationSaveSubmitBtn.addEventListener("click", () =>
    withBusy(configurationSaveSubmitBtn, async () => {
      await submitConfigurationSave();
    })
  );
}

if (configurationSaveModalOverlay) {
  configurationSaveModalOverlay.addEventListener("click", (event) => {
    if (event.target === configurationSaveModalOverlay) {
      closeConfigurationSaveModal();
    }
  });
}

if (deploymentProgressModalCloseBtn) {
  deploymentProgressModalCloseBtn.addEventListener("click", () => {
    closeDeploymentProgressModal();
  });
}

function startStream() {
  const source = new EventSource("/api/stream");
  let hasConnected = false;
  let disconnectGraceTimer = null;

  const cancelDisconnectGrace = () => {
    if (disconnectGraceTimer) {
      clearTimeout(disconnectGraceTimer);
      disconnectGraceTimer = null;
    }
  };

  setConnectionState("reconnecting");

  source.onopen = () => {
    cancelDisconnectGrace();
    setConnectionState("live");
  };

  source.addEventListener("status", (event) => {
    cancelDisconnectGrace();
    refreshDataCenterConfigIfNeeded();
    hasConnected = true;
    setConnectionState("live");
    const data = JSON.parse(event.data);
    latestClusterStatus = data;
    setAddressToMemberNameMapFromStatus(data.addressMap);
    setAddNodeShardFieldState();
    latestServiceRuntime = data.serviceRuntime || {};
    Object.entries(latestServiceRuntime).forEach(([service, runtime]) => {
      if (runtime?.containerRunning) {
        stoppedContainers.delete(service);
        return;
      }
      stoppedContainers.add(service);
    });
    if (!isApplicationServerLocationModalOpen()) {
      const normalizedWriteConcern = renderWriteConcernOptions(applicationServerMongoSettings.writeConcern);
      applicationServerMongoSettings.writeConcern = normalizedWriteConcern;
    }
    renderGraph(data);
    renderTable(data);
    renderDataCenterPins();
    refreshGeographicPulseRoles();
    renderGeographicMembersTable();
    refreshMapZones();
    evaluateOperationLockForStatus(data);
    applyUiControlUiMode();
    void maybeNoPasswordUiControlFlow();
    setStatus(`Live update ${new Date(data.updatedAt).toLocaleTimeString()}`);
  });

  source.addEventListener("error", (event) => {
    try {
      const payload = JSON.parse(event.data);
      setStatus(`Polling error: ${payload.message}`);
    } catch (_error) {
      setStatus("Polling error.");
    }
  });

  source.onerror = () => {
    if (!hasConnected) {
      setConnectionState("disconnected");
      setStatus("Stream disconnected. Browser will retry.");
      return;
    }
    if (mainStreamConnectionState === "live") {
      mainStreamElapsedFreezeWrite = applicationServerState.running
        ? elapsedSecondsFromIso(applicationServerState.lastIncrementedAt)
        : null;
      mainStreamElapsedFreezeRead = applicationServerState.running
        ? elapsedSecondsFromIso(applicationServerState.lastCurrentValueAt)
        : null;
    }
    setConnectionState("reconnecting");
    setStatus("Stream interrupted. Reconnecting...");
    if (disconnectGraceTimer) {
      return;
    }
    disconnectGraceTimer = setTimeout(() => {
      disconnectGraceTimer = null;
      clearDisplay();
      setConnectionState("disconnected");
      setStatus("Stream disconnected. Browser will retry.");
    }, STREAM_DISCONNECT_GRACE_MS);
  };
}

function startApplicationServerStream() {
  const source = new EventSource("/api/application-server/stream");
  let appServerDisconnectGraceTimer = null;

  const cancelAppServerDisconnectGrace = () => {
    if (appServerDisconnectGraceTimer) {
      clearTimeout(appServerDisconnectGraceTimer);
      appServerDisconnectGraceTimer = null;
    }
  };

  const scheduleAppServerDisconnectLog = () => {
    if (appServerDisconnectGraceTimer) {
      return;
    }
    appServerDisconnectGraceTimer = setTimeout(() => {
      appServerDisconnectGraceTimer = null;
      pushApplicationServerLog({
        line: "ApplicationServer stream disconnected. Waiting for reconnect...",
        receivedAt: new Date().toISOString(),
        source: "stderr"
      });
    }, STREAM_DISCONNECT_GRACE_MS);
  };

  source.addEventListener("snapshot", (event) => {
    cancelAppServerDisconnectGrace();
    const payload = JSON.parse(event.data);
    setApplicationServerRunning(payload.running);
    applicationServerState.logs = Array.isArray(payload.logs)
      ? payload.logs.slice(-APPLICATION_SERVER_MAX_LINES)
      : [];
    rebuildLatencySeriesFromLogs(applicationServerState.logs);
    rebuildLatestReadAddresses(applicationServerState.logs);
    setApplicationServerMetrics(payload.metrics || {});
    renderApplicationServerConsole();
  });

  source.addEventListener("log", (event) => {
    cancelAppServerDisconnectGrace();
    const payload = JSON.parse(event.data);
    setApplicationServerRunning(payload.running);
    pushApplicationServerLog(payload.entry);
    setApplicationServerMetrics(payload.metrics || {});
  });

  source.addEventListener("state", (event) => {
    cancelAppServerDisconnectGrace();
    const payload = JSON.parse(event.data);
    setApplicationServerRunning(payload.running);
    if (!payload.running) {
      pushApplicationServerLog({
        line: "ApplicationServer workload stopped.",
        receivedAt: new Date().toISOString(),
        source: "stderr"
      });
    }
    setApplicationServerMetrics(payload.metrics || {});
  });

  source.onerror = () => {
    scheduleAppServerDisconnectLog();
  };
}

bootstrapReplicaSetOnStartup().catch((error) => {
  setStatus(`Startup failed: ${error.message}`);
  refreshNow().catch((refreshError) => {
    clearDisplay();
    setStatus(`Initial status failed: ${refreshError.message}`);
  });
});
renderDataCenterSelectOptions();
loadApplicationServerLocation().catch((error) => {
  setStatus(`Failed to load ApplicationServer location: ${error.message}`);
});
startStream();
startApplicationServerStream();
ensureMapPulseIntervalRunning();
setInterval(renderApplicationServerMetrics, 1000);
setApplicationServerConsoleHidden(true);
renderWorkloadConsoleLabel();
renderUserLocationOptions();
applyViewState();
applyReadOnlyGuardOverrides();
