const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SETTINGS_PATH = path.join(PROJECT_ROOT, "server/data/settings.json");

const LEGACY_APP_FALLBACK_MONGO_URI =
  "mongodb://Default_1:27017,Default_2:27017,Default_3:27017/?authSource=admin&replicaSet=mongodb-repl-set";

const DEFAULT_STATUS_QUERY_SERVICES = ["Default_1", "Default_2", "Default_3"];

function computeLegacyAppDefaultMongoUriFromSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    const settings = JSON.parse(raw);
    const topo = settings?.templateTopology;
    if (topo?.sharded) {
      const firstShard = (topo.shards || [])[0];
      const shardName = String(firstShard?.name || "mongodb-repl-set").trim() || "mongodb-repl-set";
      const hosts = (firstShard?.nodes || [])
        .map((n) => String(n?.name || "").trim())
        .filter(Boolean)
        .map((name) => `${name}:27017`);
      if (hosts.length) {
        return `mongodb://${hosts.join(",")}/?authSource=admin&replicaSet=${shardName}`;
      }
    } else if (topo?.replicaSet?.nodes?.length) {
      const rsName = String(topo.replicaSet.name || "mongodb-repl-set").trim() || "mongodb-repl-set";
      const hosts = topo.replicaSet.nodes
        .map((n) => String(n?.name || "").trim())
        .filter(Boolean)
        .map((name) => `${name}:27017`);
      if (hosts.length) {
        return `mongodb://${hosts.join(",")}/?authSource=admin&replicaSet=${rsName}`;
      }
    }
  } catch (_e) {
    // fall through
  }
  return LEGACY_APP_FALLBACK_MONGO_URI;
}

function readReplicaServiceNamesFromPersistedSettings() {
  try {
    const raw = fs.readFileSync(SETTINGS_PATH, "utf8");
    const settings = JSON.parse(raw);
    const topo = settings?.templateTopology;
    if (topo?.sharded) {
      const names = new Set();
      for (const shard of topo.shards || []) {
        for (const n of shard.nodes || []) {
          const name = String(n.name || "").trim();
          if (name) names.add(name);
        }
      }
      if (names.size) return [...names];
    }
    if (topo?.replicaSet?.nodes?.length) {
      return topo.replicaSet.nodes.map((n) => String(n.name).trim()).filter(Boolean);
    }
  } catch (_e) {
    // fall through
  }
  return [...DEFAULT_STATUS_QUERY_SERVICES];
}

function getDefaultReplicaSetNameFromPersistedSettings() {
  try {
    const uri = computeLegacyAppDefaultMongoUriFromSettings();
    const match = String(uri).match(/replicaSet=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : "mongodb-repl-set";
  } catch (_e) {
    return "mongodb-repl-set";
  }
}

module.exports = {
  LEGACY_APP_FALLBACK_MONGO_URI,
  DEFAULT_STATUS_QUERY_SERVICES,
  computeLegacyAppDefaultMongoUriFromSettings,
  readReplicaServiceNamesFromPersistedSettings,
  getDefaultReplicaSetNameFromPersistedSettings
};
