const path = require("path");
const fs = require("fs/promises");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SETTINGS_FILE_PATH = path.resolve(PROJECT_ROOT, "server/data/settings.json");
const LEGACY_LOCATION_FILE_PATH = path.resolve(
  PROJECT_ROOT,
  "server/data/application-server-location.json"
);
const {
  REGION_KEYS,
  getDefaultDataCenters,
  normalizeConfiguredDataCenters
} = require("./dataCenters");
const VALID_DATA_CENTERS = [...REGION_KEYS];
const DEFAULT_LOCATION = "AMER";
const ELECTION_TIMEOUT_MIN_MS = 1000;
const ELECTION_TIMEOUT_MAX_MS = 10000;
const DEFAULT_ELECTION_TIMEOUT_MS = 10000;
const USER_LOCATION_CODE_PATTERN = /^[A-Z]{2}$/;
const DEFAULT_USER_LOCATION = "US";
const WRITE_CONCERN_MAJORITY = "majority";
const DEFAULT_WRITE_CONCERN = WRITE_CONCERN_MAJORITY;
const VALID_READ_CONCERNS = ["local", "available", "majority", "linearizable", "snapshot"];
const DEFAULT_READ_CONCERN = "local";
const VALID_READ_PREFERENCES = [
  "primary",
  "primaryPreferred",
  "secondary",
  "secondaryPreferred",
  "nearest"
];
const DEFAULT_READ_PREFERENCE = "primary";
const DEPLOYMENT_PROFILE_CONSOLIDATED = "consolidated";
const DEFAULT_DEPLOYMENT_PROFILE = DEPLOYMENT_PROFILE_CONSOLIDATED;
const DEFAULT_TOPOLOGY_SHOW_SHARD_LABELS = true;

function normalizeTopologyShowShardLabels(value) {
  if (value === false || value === "false" || value === 0) {
    return false;
  }
  if (value === true || value === "true" || value === 1) {
    return true;
  }
  return DEFAULT_TOPOLOGY_SHOW_SHARD_LABELS;
}

function normalizeDataCenter(value) {
  const normalized = String(value || "").trim().toUpperCase();
  return VALID_DATA_CENTERS.includes(normalized) ? normalized : DEFAULT_LOCATION;
}

function normalizeElectionTimeoutMs(value) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isInteger(parsed)) {
    return DEFAULT_ELECTION_TIMEOUT_MS;
  }
  if (parsed < ELECTION_TIMEOUT_MIN_MS || parsed > ELECTION_TIMEOUT_MAX_MS) {
    return DEFAULT_ELECTION_TIMEOUT_MS;
  }
  return parsed;
}

function normalizeUserLocation(value) {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (!USER_LOCATION_CODE_PATTERN.test(normalized)) {
    return DEFAULT_USER_LOCATION;
  }
  return normalized;
}

function parseWriteConcern(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }
  const raw = String(value).trim();
  if (!raw) {
    return null;
  }
  const lower = raw.toLowerCase();
  if (lower === WRITE_CONCERN_MAJORITY) {
    return WRITE_CONCERN_MAJORITY;
  }
  if (!/^\d+$/.test(raw)) {
    return null;
  }
  const parsed = Number.parseInt(raw, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

function normalizeWriteConcern(value) {
  const parsed = parseWriteConcern(value);
  return parsed === null ? DEFAULT_WRITE_CONCERN : parsed;
}

function parseReadConcern(value) {
  const normalized = String(value || "").trim();
  return VALID_READ_CONCERNS.includes(normalized) ? normalized : null;
}

function normalizeReadConcern(value) {
  return parseReadConcern(value) || DEFAULT_READ_CONCERN;
}

function parseReadPreference(value) {
  const normalized = String(value || "").trim();
  return VALID_READ_PREFERENCES.includes(normalized) ? normalized : null;
}

function normalizeReadPreference(value) {
  return parseReadPreference(value) || DEFAULT_READ_PREFERENCE;
}

function normalizeDeploymentProfile(_value) {
  return DEPLOYMENT_PROFILE_CONSOLIDATED;
}

async function ensureLocationDirectory() {
  await fs.mkdir(path.dirname(SETTINGS_FILE_PATH), { recursive: true });
}

async function getApplicationServerLocation() {
  const settings = await getApplicationServerSettings();
  return settings.location;
}

async function getReplicaSetElectionTimeoutMs() {
  const settings = await getApplicationServerSettings();
  return settings.electionTimeoutMs;
}

async function getApplicationServerUserLocation() {
  const settings = await getApplicationServerSettings();
  return settings.userLocation;
}

function normalizeDataCenters(rawDataCenters) {
  return normalizeConfiguredDataCenters(rawDataCenters);
}

function getDefaultLocationForDataCenters(dataCenters) {
  const normalized = Array.isArray(dataCenters) && dataCenters.length ? dataCenters : getDefaultDataCenters();
  return String(normalized[0]?.id || "").trim() || String(normalized[0]?.region || DEFAULT_LOCATION).trim().toUpperCase();
}

function normalizeLocationAgainstDataCenters(location, dataCenters) {
  const normalizedDataCenters = Array.isArray(dataCenters) && dataCenters.length
    ? dataCenters
    : getDefaultDataCenters();
  const rawLocation = String(location || "").trim();
  if (!rawLocation) {
    return getDefaultLocationForDataCenters(normalizedDataCenters);
  }
  const byId = normalizedDataCenters.find((entry) => String(entry.id || "").trim() === rawLocation);
  if (byId) {
    return String(byId.id);
  }
  const normalizedRegion = rawLocation.toUpperCase();
  const byRegion = normalizedDataCenters.find(
    (entry) => String(entry.region || "").trim().toUpperCase() === normalizedRegion
  );
  if (byRegion) {
    return String(byRegion.id);
  }
  return getDefaultLocationForDataCenters(normalizedDataCenters);
}

function resolveDataCenterRegion(location, dataCenters) {
  const normalizedDataCenters = Array.isArray(dataCenters) && dataCenters.length
    ? dataCenters
    : getDefaultDataCenters();
  const normalizedLocation = normalizeLocationAgainstDataCenters(location, normalizedDataCenters);
  const match = normalizedDataCenters.find((entry) => String(entry.id || "").trim() === normalizedLocation);
  return String(match?.region || DEFAULT_LOCATION).trim().toUpperCase();
}

function normalizeLatencies(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  const intra = value.intraRegionMs;
  const inter = value.interRegionMs;
  if (!intra || typeof intra !== "object" || !inter || typeof inter !== "object") {
    return null;
  }
  return {
    intraRegionMs: { ...intra },
    interRegionMs: { ...inter }
  };
}

function normalizeTemplateTopology(value) {
  if (!value || typeof value !== "object") {
    return null;
  }
  return {
    sharded: Boolean(value.sharded),
    replicaSet: value.replicaSet && typeof value.replicaSet === "object" ? { ...value.replicaSet } : null,
    shards: Array.isArray(value.shards) ? value.shards.map((s) => ({ ...s })) : null
  };
}

function normalizeLastAppliedTemplateId(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const s = String(value).trim();
  if (!s || s.includes("/") || s.includes("\\") || !s.endsWith(".json")) {
    return null;
  }
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(s)) {
    return null;
  }
  return s;
}

function buildNormalizedSettings(parsed) {
  const dataCenters = normalizeDataCenters(parsed?.dataCenters);
  return {
    dataCenters,
    location: normalizeLocationAgainstDataCenters(parsed?.location, dataCenters),
    electionTimeoutMs: normalizeElectionTimeoutMs(parsed?.electionTimeoutMs),
    userLocation: normalizeUserLocation(parsed?.userLocation),
    writeConcern: normalizeWriteConcern(parsed?.writeConcern),
    readConcern: normalizeReadConcern(parsed?.readConcern),
    readPreference: normalizeReadPreference(parsed?.readPreference),
    deploymentProfile: normalizeDeploymentProfile(parsed?.deploymentProfile),
    topologyShowShardLabels: normalizeTopologyShowShardLabels(parsed?.topologyShowShardLabels),
    latencies: normalizeLatencies(parsed?.latencies),
    templateTopology: normalizeTemplateTopology(parsed?.templateTopology),
    lastAppliedTemplateId: normalizeLastAppliedTemplateId(parsed?.lastAppliedTemplateId)
  };
}

function getDefaultSettings() {
  const dataCenters = getDefaultDataCenters();
  return {
    dataCenters,
    location: getDefaultLocationForDataCenters(dataCenters),
    electionTimeoutMs: DEFAULT_ELECTION_TIMEOUT_MS,
    userLocation: DEFAULT_USER_LOCATION,
    writeConcern: DEFAULT_WRITE_CONCERN,
    readConcern: DEFAULT_READ_CONCERN,
    readPreference: DEFAULT_READ_PREFERENCE,
    //GCR_REMOVE
    //deploymentProfile: DEFAULT_DEPLOYMENT_PROFILE,
    topologyShowShardLabels: DEFAULT_TOPOLOGY_SHOW_SHARD_LABELS,
    latencies: null,
    templateTopology: null,
    lastAppliedTemplateId: null
  };
}

async function writeSettings(settings) {
  await ensureLocationDirectory();
  await fs.writeFile(
    SETTINGS_FILE_PATH,
    `${JSON.stringify(
      {
        ...settings,
        updatedAt: new Date().toISOString()
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

//GCR_REMOVE
//let legacyMigrationAttempted = false;

//GCR_REMOVE
// /** One-time import from pre-unified `application-server-location.json` when `settings.json` is absent. */
// async function readLegacySettingsForMigration() {
//   try {
//     const raw = await fs.readFile(LEGACY_LOCATION_FILE_PATH, "utf8");
//     const parsed = JSON.parse(raw);
//     return buildNormalizedSettings(parsed);
//   } catch (_error) {
//     return null;
//   }
// }

//GCR_REMOVE
// async function migrateLegacySettingsFileIfMissingOnce() {
//   if (legacyMigrationAttempted) {
//     return;
//   }
//   legacyMigrationAttempted = true;
//   try {
//     await fs.access(SETTINGS_FILE_PATH);
//     return;
//   } catch {
//     // settings.json missing — try legacy file once, else create defaults.
//   }
//   const legacy = await readLegacySettingsForMigration();
//   if (legacy) {
//     try {
//       await writeSettings(legacy);
//       await fs.unlink(LEGACY_LOCATION_FILE_PATH).catch(() => {});
//     } catch (_error) {
//       // Fall through: create defaults if still no settings file.
//     }
//   }
//   try {
//     await fs.access(SETTINGS_FILE_PATH);
//     return;
//   } catch {
//     try {
//       await writeSettings(getDefaultSettings());
//     } catch (_writeError) {
//       // Preserve startup behavior even if settings cannot be persisted.
//     }
//   }
// }

//GCR_POTENTIAL_REMOVE - If settings are always read from a template file, do we need a master settings file?
async function getApplicationServerSettings() {
  //GCR_REMOVE
  //await migrateLegacySettingsFileIfMissingOnce();
  try {
    const raw = await fs.readFile(SETTINGS_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const normalized = buildNormalizedSettings(parsed);
    const parsedLocation = String(parsed?.location || "").trim();
    if (parsedLocation !== normalized.location) {
      try {
        await writeSettings(normalized);
      } catch (_writeError) {
        // Ignore persistence failure and keep serving normalized settings.
      }
    }
    return normalized;
  } catch (_error) {
    const fallback = getDefaultSettings();
    try {
      await writeSettings(fallback);
    } catch (_writeError) {
      // Preserve startup behavior even if settings cannot be persisted.
    }
    return fallback;
  }
}

async function setApplicationServerLocation(location) {
  const settings = await getApplicationServerSettings();
  settings.location = normalizeLocationAgainstDataCenters(location, settings.dataCenters);
  return setApplicationServerSettings(settings);
}

async function setReplicaSetElectionTimeoutMs(electionTimeoutMs) {
  const settings = await getApplicationServerSettings();
  settings.electionTimeoutMs = normalizeElectionTimeoutMs(electionTimeoutMs);
  return setApplicationServerSettings(settings);
}

async function setApplicationServerUserLocation(userLocation) {
  const settings = await getApplicationServerSettings();
  settings.userLocation = normalizeUserLocation(userLocation);
  return setApplicationServerSettings(settings);
}

async function setApplicationServerSettings(settings) {
  const existing = await getApplicationServerSettings();
  const dataCenters = normalizeDataCenters(settings?.dataCenters);
  const location = normalizeLocationAgainstDataCenters(settings?.location, dataCenters);
  const electionTimeoutMs = normalizeElectionTimeoutMs(settings?.electionTimeoutMs);
  const userLocation = normalizeUserLocation(settings?.userLocation);
  const writeConcern = normalizeWriteConcern(settings?.writeConcern);
  const readConcern = normalizeReadConcern(settings?.readConcern);
  const readPreference = normalizeReadPreference(settings?.readPreference);
  const deploymentProfile = normalizeDeploymentProfile(settings?.deploymentProfile);
  const topologyShowShardLabels =
    settings && Object.prototype.hasOwnProperty.call(settings, "topologyShowShardLabels")
      ? normalizeTopologyShowShardLabels(settings.topologyShowShardLabels)
      : existing.topologyShowShardLabels;
  const latencies =
    settings && Object.prototype.hasOwnProperty.call(settings, "latencies")
      ? normalizeLatencies(settings.latencies)
      : existing.latencies;
  const templateTopology =
    settings && Object.prototype.hasOwnProperty.call(settings, "templateTopology")
      ? normalizeTemplateTopology(settings.templateTopology)
      : existing.templateTopology;
  const lastAppliedTemplateId = Object.prototype.hasOwnProperty.call(settings || {}, "lastAppliedTemplateId")
    ? normalizeLastAppliedTemplateId(settings.lastAppliedTemplateId)
    : existing.lastAppliedTemplateId;
  const normalizedSettings = {
    dataCenters,
    location,
    electionTimeoutMs,
    userLocation,
    writeConcern,
    readConcern,
    readPreference,
    deploymentProfile,
    topologyShowShardLabels,
    lastAppliedTemplateId,
    ...(latencies ? { latencies } : {}),
    ...(templateTopology ? { templateTopology } : {})
  };
  await writeSettings(normalizedSettings);
  return buildNormalizedSettings({
    ...normalizedSettings,
    latencies: latencies ?? undefined,
    templateTopology: templateTopology ?? undefined
  });
}

async function setLastAppliedTemplateId(templateId) {
  const settings = await getApplicationServerSettings();
  settings.lastAppliedTemplateId = normalizeLastAppliedTemplateId(templateId);
  return setApplicationServerSettings(settings);
}

module.exports = {
  VALID_DATA_CENTERS,
  DEFAULT_LOCATION,
  DEFAULT_ELECTION_TIMEOUT_MS,
  ELECTION_TIMEOUT_MIN_MS,
  ELECTION_TIMEOUT_MAX_MS,
  DEFAULT_USER_LOCATION,
  WRITE_CONCERN_MAJORITY,
  DEFAULT_WRITE_CONCERN,
  VALID_READ_CONCERNS,
  DEFAULT_READ_CONCERN,
  VALID_READ_PREFERENCES,
  DEFAULT_READ_PREFERENCE,
  DEPLOYMENT_PROFILE_CONSOLIDATED,
  DEFAULT_DEPLOYMENT_PROFILE,
  normalizeDataCenter,
  normalizeElectionTimeoutMs,
  normalizeUserLocation,
  parseWriteConcern,
  normalizeWriteConcern,
  parseReadConcern,
  normalizeReadConcern,
  parseReadPreference,
  normalizeReadPreference,
  normalizeDeploymentProfile,
  normalizeTopologyShowShardLabels,
  normalizeDataCenters,
  normalizeLocationAgainstDataCenters,
  resolveDataCenterRegion,
  getApplicationServerSettings,
  getApplicationServerLocation,
  getReplicaSetElectionTimeoutMs,
  getApplicationServerUserLocation,
  setApplicationServerLocation,
  setReplicaSetElectionTimeoutMs,
  setApplicationServerUserLocation,
  setApplicationServerSettings,
  setLastAppliedTemplateId,
  normalizeLastAppliedTemplateId
};
