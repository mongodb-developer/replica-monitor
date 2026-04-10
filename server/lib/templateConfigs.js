const fs = require("fs/promises");
const path = require("path");
const { hasConfigurationApplySucceededThisProcess } = require("./configurationSessionState");
const {
  getApplicationServerSettings,
  setApplicationServerSettings,
  //GCR_REMOVE
  //normalizeDeploymentProfile,
  normalizeTopologyShowShardLabels
} = require("./applicationServerLocation");
const { setZones, getZones } = require("./zones");
const { writeNetemLatencyFileFromTemplate } = require("./netemLatencyFile");

const TEMPLATES_DIR = path.resolve(__dirname, "../config/templates");
const CONFIG_VERSION = 1;
const NODE_TYPES = new Set(["voting", "readOnly"]);
const VALID_READ_CONCERNS = new Set(["local", "available", "majority", "linearizable", "snapshot"]);
const VALID_READ_PREFERENCES = new Set([
  "primary",
  "primaryPreferred",
  "secondary",
  "secondaryPreferred",
  "nearest"
]);
const DATA_CENTER_COUNT = 4;

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateNode(node, dataCenterIds, pathPrefix, errors) {
  if (!isObject(node)) {
    errors.push(`${pathPrefix} must be an object`);
    return;
  }
  if (!isNonEmptyString(node.name)) {
    errors.push(`${pathPrefix}.name is required`);
  }
  if (!NODE_TYPES.has(String(node.type || "").trim())) {
    errors.push(`${pathPrefix}.type must be one of: voting, readOnly`);
  }
  if (!Number.isFinite(Number(node.priority))) {
    errors.push(`${pathPrefix}.priority must be numeric`);
  }
  if (!dataCenterIds.has(String(node.dataCenter || "").trim())) {
    errors.push(`${pathPrefix}.dataCenter must reference one of configured data centers`);
  }
}

function validateTemplateShape(template) {
  const errors = [];
  if (!isObject(template)) {
    return ["template root must be an object"];
  }

  if (Number(template.version) !== CONFIG_VERSION) {
    errors.push(`version must be ${CONFIG_VERSION}`);
  }

  if (!isNonEmptyString(template.name)) {
    errors.push("name is required");
  }

  if (!Array.isArray(template.dataCenters) || template.dataCenters.length !== DATA_CENTER_COUNT) {
    errors.push(`dataCenters must contain exactly ${DATA_CENTER_COUNT} entries`);
  }
  const dataCenterIds = new Set();
  (template.dataCenters || []).forEach((entry, index) => {
    const prefix = `dataCenters[${index}]`;
    if (!isObject(entry)) {
      errors.push(`${prefix} must be an object`);
      return;
    }
    if (!isNonEmptyString(entry.id)) {
      errors.push(`${prefix}.id is required`);
      return;
    }
    dataCenterIds.add(String(entry.id).trim());
    if (!isNonEmptyString(entry.region)) {
      errors.push(`${prefix}.region is required`);
    }
    if (!isNonEmptyString(entry.name)) {
      errors.push(`${prefix}.name is required`);
    }
    if (!isNonEmptyString(entry.country)) {
      errors.push(`${prefix}.country is required`);
    }
    if (!Number.isFinite(Number(entry.lat))) {
      errors.push(`${prefix}.lat must be numeric`);
    }
    if (!Number.isFinite(Number(entry.lng))) {
      errors.push(`${prefix}.lng must be numeric`);
    }
  });

  if (!dataCenterIds.has(String(template.applicationServerLocation || "").trim())) {
    errors.push("applicationServerLocation must match a data center id");
  }

  if (!Number.isInteger(Number(template.electionTimeoutMs))) {
    errors.push("electionTimeoutMs must be an integer");
  }

  const writeConcern = template.writeConcern;
  const normalizedWriteConcern = typeof writeConcern === "string" ? writeConcern.trim() : writeConcern;
  const validWriteConcern = normalizedWriteConcern === "majority"
    || (Number.isInteger(Number(normalizedWriteConcern)) && Number(normalizedWriteConcern) >= 0);
  if (!validWriteConcern) {
    errors.push("writeConcern must be 'majority' or a non-negative integer");
  }

  if (!VALID_READ_CONCERNS.has(String(template.readConcern || "").trim())) {
    errors.push("readConcern is invalid");
  }
  if (!VALID_READ_PREFERENCES.has(String(template.readPreference || "").trim())) {
    errors.push("readPreference is invalid");
  }

  if (Object.prototype.hasOwnProperty.call(template, "topologyShowShardLabels")) {
    const v = template.topologyShowShardLabels;
    if (v !== true && v !== false) {
      errors.push("topologyShowShardLabels must be a boolean when present");
    }
  }

  if (!isObject(template.latencies)) {
    errors.push("latencies is required");
  } else {
    const intraRegion = template.latencies.intraRegionMs;
    const interRegion = template.latencies.interRegionMs;
    if (!isObject(intraRegion)) {
      errors.push("latencies.intraRegionMs is required");
    }
    if (!isObject(interRegion)) {
      errors.push("latencies.interRegionMs is required");
    }
  }

  const isSharded = Boolean(template.sharded);
  if (!isSharded) {
    if (!isObject(template.replicaSet)) {
      errors.push("replicaSet is required when sharded=false");
    } else {
      if (!isNonEmptyString(template.replicaSet.name)) {
        errors.push("replicaSet.name is required");
      }
      if (!Array.isArray(template.replicaSet.nodes) || template.replicaSet.nodes.length < 1) {
        errors.push("replicaSet.nodes must contain at least one node");
      } else {
        template.replicaSet.nodes.forEach((node, index) => {
          validateNode(node, dataCenterIds, `replicaSet.nodes[${index}]`, errors);
        });
      }
    }
  } else {
    const shardNames = new Set();
    if (!Array.isArray(template.shards) || template.shards.length < 1) {
      errors.push("shards must contain at least one shard when sharded=true");
    } else {
      template.shards.forEach((shard, shardIndex) => {
        const shardPrefix = `shards[${shardIndex}]`;
        if (!isObject(shard)) {
          errors.push(`${shardPrefix} must be an object`);
          return;
        }
        if (!isNonEmptyString(shard.name)) {
          errors.push(`${shardPrefix}.name is required`);
        } else {
          shardNames.add(String(shard.name).trim());
        }
        if (!Array.isArray(shard.nodes) || shard.nodes.length < 1) {
          errors.push(`${shardPrefix}.nodes must contain at least one node`);
          return;
        }
        shard.nodes.forEach((node, nodeIndex) => {
          validateNode(node, dataCenterIds, `${shardPrefix}.nodes[${nodeIndex}]`, errors);
        });
      });
    }
    if (template.zones !== undefined) {
      if (!Array.isArray(template.zones)) {
        errors.push("zones must be an array");
      } else {
        template.zones.forEach((zone, index) => {
          const prefix = `zones[${index}]`;
          if (!isObject(zone)) {
            errors.push(`${prefix} must be an object`);
            return;
          }
          if (!isNonEmptyString(zone.name)) {
            errors.push(`${prefix}.name is required`);
          }
          if (!Array.isArray(zone.countries)) {
            errors.push(`${prefix}.countries must be an array`);
          }
          if (!Array.isArray(zone.shards)) {
            errors.push(`${prefix}.shards must be an array`);
          } else {
            zone.shards.forEach((shardRef, shardRefIndex) => {
              if (!isNonEmptyString(shardRef)) {
                errors.push(`${prefix}.shards[${shardRefIndex}] must be a non-empty string`);
              } else {
                const ref = String(shardRef).trim();
                if (!shardNames.has(ref)) {
                  errors.push(
                    `${prefix}.shards[${shardRefIndex}] must reference a shard name defined in shards (unknown shard "${ref}")`
                  );
                }
              }
            });
          }
        });
      }
    }
  }

  return errors;
}

async function readTemplateFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw);
  const errors = validateTemplateShape(parsed);
  if (errors.length) {
    const err = new Error(`Invalid template ${path.basename(filePath)}:\n- ${errors.join("\n- ")}`);
    err.validationErrors = errors;
    throw err;
  }
  return parsed;
}

async function listTemplates() {
  const entries = await fs.readdir(TEMPLATES_DIR, { withFileTypes: true });
  const templates = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }
    const templatePath = path.join(TEMPLATES_DIR, entry.name);
    const parsed = await readTemplateFile(templatePath);
    templates.push({
      id: entry.name,
      name: parsed.name,
      description: parsed.description || "",
      sharded: Boolean(parsed.sharded)
    });
  }
  return templates.sort((a, b) => a.name.localeCompare(b.name));
}

function normalizeAppliedTemplateFilename(configurationId) {
  const raw = String(configurationId || "").trim();
  if (!raw) {
    return null;
  }
  return resolveSafeTemplateFilename(raw).filename;
}

function resolveSafeTemplateFilename(input) {
  const raw = String(input || "").trim();
  const withJson = raw.toLowerCase().endsWith(".json") ? raw : `${raw}.json`;
  if (!withJson || withJson.includes("/") || withJson.includes("\\")) {
    throw new Error("template filename is invalid");
  }
  if (!/^[a-zA-Z0-9._-]+\.json$/.test(withJson)) {
    throw new Error("template filename is invalid");
  }
  const templatePath = path.resolve(TEMPLATES_DIR, withJson);
  const normalizedDir = path.normalize(TEMPLATES_DIR);
  const normalizedPath = path.normalize(templatePath);
  if (!normalizedPath.startsWith(normalizedDir) || !normalizedPath.endsWith(".json")) {
    throw new Error("template filename is invalid");
  }
  return { filename: withJson, templatePath };
}

async function getTemplateById(templateId) {
  const { templatePath } = resolveSafeTemplateFilename(templateId);
  return readTemplateFile(templatePath);
}

/**
 * Persisted `templateTopology.shards[].nodes` can be empty while the cluster still matches
 * the last applied template (e.g. incomplete persistence). For save, fill missing node lists
 * from the last applied template file when shard names match.
 */
async function mergeEmptyShardNodesFromLastAppliedTemplate(settings, shards) {
  if (!Array.isArray(shards)) {
    return shards;
  }
  const templateId = settings.lastAppliedTemplateId;
  if (!templateId) {
    return shards;
  }
  let applied;
  try {
    applied = await getTemplateById(templateId);
  } catch (_e) {
    return shards;
  }
  if (!applied || !applied.sharded || !Array.isArray(applied.shards)) {
    return shards;
  }
  return shards.map((shard) => {
    const nodes = Array.isArray(shard.nodes) ? shard.nodes : [];
    if (nodes.length > 0) {
      return shard;
    }
    const name = String(shard.name || "").trim();
    const fromApplied = applied.shards.find((s) => String(s.name || "").trim() === name);
    if (fromApplied && Array.isArray(fromApplied.nodes) && fromApplied.nodes.length > 0) {
      return {
        ...shard,
        nodes: JSON.parse(JSON.stringify(fromApplied.nodes))
      };
    }
    return shard;
  });
}

async function validateTemplatePayload(template) {
  const errors = validateTemplateShape(template);
  return {
    ok: errors.length === 0,
    errors
  };
}

/**
 * Persists template settings, zones, and latency file. Caller must validate first (see applyTemplate).
 */
async function persistTemplateConfiguration(template) {
  const currentSettings = await getApplicationServerSettings();
  const templateTopology = {
    sharded: Boolean(template.sharded),
    replicaSet: template.replicaSet ? { ...template.replicaSet } : null,
    shards: Array.isArray(template.shards) ? template.shards.map((s) => ({ ...s })) : null
  };
  const nextSettings = {
    ...currentSettings,
    dataCenters: template.dataCenters,
    location: template.applicationServerLocation,
    electionTimeoutMs: Number(template.electionTimeoutMs),
    writeConcern: template.writeConcern,
    readConcern: template.readConcern,
    readPreference: template.readPreference,
    //GCR_REMOVE
    //deploymentProfile: normalizeDeploymentProfile(template.deploymentProfile),
    latencies: template.latencies,
    templateTopology,
    ...(Object.prototype.hasOwnProperty.call(template || {}, "topologyShowShardLabels")
      ? { topologyShowShardLabels: normalizeTopologyShowShardLabels(template.topologyShowShardLabels) }
      : {})
  };
  await writeNetemLatencyFileFromTemplate(template.latencies);
  const settings = await setApplicationServerSettings(nextSettings);

  if (Array.isArray(template.zones)) {
    await setZones(template.zones);
  } else {
    await setZones([]);
  }

  return {
    settings,
    templateName: template.name,
    sharded: Boolean(template.sharded),
    requiresShardInitialization: Boolean(template.sharded)
  };
}

async function applyTemplate(template) {
  const validation = await validateTemplatePayload(template);
  if (!validation.ok) {
    const error = new Error(`Template validation failed:\n- ${validation.errors.join("\n- ")}`);
    error.validationErrors = validation.errors;
    throw error;
  }

  return persistTemplateConfiguration(template);
}

async function buildRuntimeTemplatePayload({ name, description }) {
  const trimmedName = String(name || "").trim();
  if (!trimmedName) {
    throw new Error("Template name is required");
  }
  const desc = typeof description === "string" ? description : "";
  const settings = await getApplicationServerSettings();
  const latencies = settings.latencies;
  if (!latencies || !latencies.intraRegionMs || !latencies.interRegionMs) {
    throw new Error("Cannot save: latencies are not configured (apply a configuration template first)");
  }
  const topo = settings.templateTopology;
  if (!topo) {
    throw new Error("Cannot save: no template topology (apply a configuration template first)");
  }
  const sharded = Boolean(topo.sharded);
  const template = {
    version: CONFIG_VERSION,
    name: trimmedName,
    description: desc,
    dataCenters: JSON.parse(JSON.stringify(settings.dataCenters)),
    applicationServerLocation: settings.location,
    userLocation: settings.userLocation,
    electionTimeoutMs: Number.parseInt(String(settings.electionTimeoutMs), 10),
    writeConcern: settings.writeConcern,
    readConcern: settings.readConcern,
    readPreference: settings.readPreference,
    topologyShowShardLabels: settings.topologyShowShardLabels,
    latencies: {
      intraRegionMs: { ...latencies.intraRegionMs },
      interRegionMs: { ...latencies.interRegionMs }
    },
    sharded
  };
  if (!sharded) {
    if (!topo.replicaSet || !isNonEmptyString(topo.replicaSet.name)) {
      throw new Error("Cannot save: replica set topology is incomplete");
    }
    template.replicaSet = JSON.parse(JSON.stringify(topo.replicaSet));
  } else {
    if (!Array.isArray(topo.shards) || topo.shards.length < 1) {
      throw new Error("Cannot save: shard topology is incomplete");
    }
    let shards = JSON.parse(JSON.stringify(topo.shards));
    shards = await mergeEmptyShardNodesFromLastAppliedTemplate(settings, shards);
    const emptyShard = shards.find((s) => !Array.isArray(s.nodes) || s.nodes.length < 1);
    if (emptyShard) {
      throw new Error(
        `Cannot save: shard "${String(emptyShard.name || "").trim() || "?"}" has no node definitions in settings; re-apply a configuration template or ensure nodes are recorded.`
      );
    }
    template.shards = shards;
    const { zones } = await getZones();
    if (Array.isArray(zones) && zones.length > 0) {
      template.zones = JSON.parse(JSON.stringify(zones));
    }
  }
  const validation = await validateTemplatePayload(template);
  if (!validation.ok) {
    const error = new Error(`Template validation failed:\n- ${validation.errors.join("\n- ")}`);
    error.validationErrors = validation.errors;
    throw error;
  }
  return template;
}

async function templateJsonFileExists(filename) {
  try {
    const { templatePath } = resolveSafeTemplateFilename(filename);
    await fs.access(templatePath);
    return true;
  } catch (e) {
    if (e && e.code === "ENOENT") {
      return false;
    }
    throw e;
  }
}

async function writeTemplateFile(filename, templateObject) {
  const { filename: safeName, templatePath } = resolveSafeTemplateFilename(filename);
  const validation = await validateTemplatePayload(templateObject);
  if (!validation.ok) {
    const error = new Error(`Template validation failed:\n- ${validation.errors.join("\n- ")}`);
    error.validationErrors = validation.errors;
    throw error;
  }
  await fs.writeFile(templatePath, `${JSON.stringify(templateObject, null, 2)}\n`, "utf8");
  return safeName;
}

function isConfigurationDeployedForSave(settings) {
  const topo = settings?.templateTopology;
  const lat = settings?.latencies;
  if (!topo || typeof topo !== "object") {
    return false;
  }
  if (!lat || typeof lat !== "object") {
    return false;
  }
  if (!lat.intraRegionMs || typeof lat.intraRegionMs !== "object") {
    return false;
  }
  if (!lat.interRegionMs || typeof lat.interRegionMs !== "object") {
    return false;
  }
  if (Boolean(topo.sharded)) {
    return Array.isArray(topo.shards) && topo.shards.length > 0;
  }
  return Boolean(
    topo.replicaSet &&
      String(topo.replicaSet.name || "").trim() &&
      Array.isArray(topo.replicaSet.nodes) &&
      topo.replicaSet.nodes.length > 0
  );
}

async function getConfigurationSaveContext() {
  const settings = await getApplicationServerSettings();
  const configurationDeployed =
    hasConfigurationApplySucceededThisProcess() && isConfigurationDeployedForSave(settings);
  const lastAppliedTemplateId = settings.lastAppliedTemplateId || null;
  let lastAppliedTemplateName = null;
  let lastAppliedTemplateDescription = null;
  if (lastAppliedTemplateId) {
    try {
      const t = await getTemplateById(lastAppliedTemplateId);
      lastAppliedTemplateName = t.name;
      lastAppliedTemplateDescription = String(t.description ?? "");
    } catch (_e) {
      lastAppliedTemplateName = null;
      lastAppliedTemplateDescription = null;
    }
  }
  return {
    configurationDeployed,
    lastAppliedTemplateId,
    lastAppliedTemplateName,
    lastAppliedTemplateDescription
  };
}

module.exports = {
  CONFIG_VERSION,
  TEMPLATES_DIR,
  listTemplates,
  getTemplateById,
  validateTemplatePayload,
  persistTemplateConfiguration,
  applyTemplate,
  buildRuntimeTemplatePayload,
  writeTemplateFile,
  resolveSafeTemplateFilename,
  normalizeAppliedTemplateFilename,
  templateJsonFileExists,
  getConfigurationSaveContext
};
