const path = require("path");
const fs = require("fs/promises");
const { COMPOSE_GENERATED_FILE } = require("../composeFileArgs");
const {
  APPLICATION_SERVER_MESH_NETWORK_NAME,
  applicationServerServiceNameForDataCenterId
} = require("../applicationServerNaming");
const MONGO_IMAGE = "andrewmorgan818/mongodb-repl-custom:latest";
const APP_SERVER_IMAGE = "andrewmorgan818/mongodb-repl-custom:latest";
const REPLICA_HOST_PORT_START = 27000;
const MONGODB_HEALTHCHECK_RETRIES = 20;

/** Regional/inter-region subnets in docker-compose.yml use 172.20.1.0/24–172.20.10.0/24. */
const DC_LOCAL_SUBNET_OCTET_START = 11;

function buildDataCenterById(dataCenters) {
  const map = new Map();
  for (const dc of dataCenters || []) {
    const id = String(dc?.id || "").trim();
    if (id) {
      map.set(id, dc);
    }
  }
  return map;
}

function regionForDataCenterId(dcById, dataCenterId) {
  const dc = dcById.get(String(dataCenterId || "").trim());
  const region = String(dc?.region || "").trim().toUpperCase();
  return region || "AMER";
}

/**
 * Collect unique replica node definitions for compose (unsharded or all shard nodes).
 */
function collectReplicaNodesFromSettings(settings) {
  const topology = settings?.templateTopology;
  if (!topology) {
    return { error: "Missing template topology. Select and apply a configuration template first." };
  }
  if (topology.sharded) {
    const shards = Array.isArray(topology.shards) ? topology.shards : [];
    if (!shards.length) {
      return { error: "Sharded template has no shards defined." };
    }
    const seen = new Map();
    for (const shard of shards) {
      const nodes = Array.isArray(shard?.nodes) ? shard.nodes : [];
      for (const node of nodes) {
        const name = String(node?.name || "").trim();
        if (!name) {
          continue;
        }
        if (!seen.has(name)) {
          seen.set(name, node);
        }
      }
    }
    const nodes = [...seen.values()];
    if (!nodes.length) {
      return { error: "No replica nodes found in shard definitions." };
    }
    return { nodes, replicaSetName: null, sharded: true };
  }
  const replicaSet = topology.replicaSet;
  if (!replicaSet || !Array.isArray(replicaSet.nodes) || !replicaSet.nodes.length) {
    return { error: "Unsharded template requires templateTopology.replicaSet.nodes." };
  }
  const replicaSetName = String(replicaSet.name || "").trim();
  if (!replicaSetName) {
    return { error: "Unsharded template requires replicaSet.name." };
  }
  return {
    nodes: replicaSet.nodes,
    replicaSetName,
    sharded: false
  };
}

function buildMongoUri(seedHosts, replicaSetName) {
  const hosts = seedHosts.map((h) => `${h}:27017`).join(",");
  return `mongodb://${hosts}/?replicaSet=${replicaSetName}`;
}

function indentBlock(text, spaces) {
  const pad = " ".repeat(spaces);
  return text
    .split("\n")
    .map((line) => (line ? pad + line : line))
    .join("\n");
}

/** Bash single-quote escaping (same idea as configServerSetupService). */
function escapeSingleQuotes(text) {
  return String(text || "").replace(/'/g, `'\\''`);
}

/**
 * Image default /etc/mongod.conf uses replSetName: mongodb-repl-set; mongod rejects rs.initiate()
 * when _id differs. Align config with template before fork (see configureNewShardNodeMongodConfig).
 */
function buildMongodPostStartShellCommand(replSetName) {
  const esc = escapeSingleQuotes(replSetName);
  return `set -e && sed -i 's/bindIp.*/bindIp: 0.0.0.0/g' /etc/mongod.conf && if grep -q '^[[:space:]]*replSetName:' /etc/mongod.conf; then sed -i 's/^[[:space:]]*replSetName:[[:space:]]*.*$/  replSetName: ${esc}/' /etc/mongod.conf; else printf '\\nreplication:\\n  replSetName: ${esc}\\n' >> /etc/mongod.conf; fi && mongod --config /etc/mongod.conf --fork`;
}

function buildReplicaServiceYaml(serviceName, hostPort, networkLines, mongoUri, replSetNameForMongod) {
  const nets = networkLines.length ? `${networkLines.join("\n")}\n` : "";
  const postCmd = buildMongodPostStartShellCommand(replSetNameForMongod);
  return `${serviceName}:
    image: ${MONGO_IMAGE}
    container_name: ${serviceName}
    hostname: ${serviceName}
    volumes:
      - ./scripts:/scripts:ro
    networks:
${indentBlock(nets, 6)}
    environment:
      - MONGODB_URI=${mongoUri}
    stdin_open: true
    tty: true
    init: true
    ports: ["${hostPort}:27017"]
    command: ["bash"]
    post_start:
      - command: ["bash", "-lc", ${JSON.stringify(postCmd)}]
    healthcheck:
      test: ["CMD-SHELL", "mongosh --quiet --eval 'db.runCommand({ ping: 1 })' || exit 1"]
      interval: 5s
      timeout: 3s
      retries: ${MONGODB_HEALTHCHECK_RETRIES}
      start_period: 10s
    restart: no`;
}

function buildApplicationServerYaml(serviceName, dependsOnEntries, networkLines) {
  const deps =
    dependsOnEntries.length > 0
      ? `    depends_on:\n${dependsOnEntries
          .map((n) => `      ${n}:\n        condition: service_healthy`)
          .join("\n")}\n`
      : "";
  const nets = networkLines.length ? `${networkLines.join("\n")}\n` : "";
  return `${serviceName}:
    image: ${APP_SERVER_IMAGE}
    container_name: ${serviceName}
    hostname: ${serviceName}
    volumes:
      - ./scripts/workload.js:/home/src/mongo-repl-test/workload.js:ro
    networks:
${indentBlock(nets, 6)}
    stdin_open: true
    tty: true
    working_dir: /home/src/mongo-repl-test
    command: >
      bash -c "git pull --quiet && npm install --no-fund > /dev/null 2>&1 && tail -f /dev/null"
${deps}    restart: no`;
}

function networkAttachmentLines(networkNames) {
  return networkNames.map((n) => `${n}:`);
}

/**
 * Site-local networks (dc-<siteId>-net) are attached by network placement but are not defined in the
 * base docker-compose.yml; emit definitions here so compose validation succeeds.
 */
function buildDataCenterNetworksYaml(dataCenters, buildDataCenterLocalNetworkName, options = {}) {
  const { includeApplicationServerMesh = false } = options;
  const blocks = [];
  for (let i = 0; i < (dataCenters || []).length; i++) {
    const id = String(dataCenters[i]?.id || "").trim();
    if (!id) {
      continue;
    }
    const netName = buildDataCenterLocalNetworkName(id);
    if (!netName) {
      continue;
    }
    const thirdOctet = DC_LOCAL_SUBNET_OCTET_START + i;
    blocks.push(
      `${netName}:\n  name: ${netName}\n  ipam:\n    config:\n      - subnet: 172.20.${thirdOctet}.0/24`
    );
  }
  if (includeApplicationServerMesh) {
    blocks.push(
      `${APPLICATION_SERVER_MESH_NETWORK_NAME}:\n  name: ${APPLICATION_SERVER_MESH_NETWORK_NAME}\n  ipam:\n    config:\n      - subnet: 172.20.15.0/24`
    );
  }
  if (!blocks.length) {
    return "";
  }
  return `\n\nnetworks:\n${indentBlock(blocks.join("\n\n"), 2)}\n`;
}

function createComposeStackGenerationService(deps) {
  const {
    PROJECT_ROOT,
    getNetworksForReplicaNode,
    getNetworksForApplicationOrConfig,
    resolveDataCenterRegion,
    normalizeSiteId,
    normalizeDataCenter,
    buildDataCenterLocalNetworkName
  } = deps;

  function buildGeneratedStackDocument(settings) {
    const collected = collectReplicaNodesFromSettings(settings);
    if (collected.error) {
      throw new Error(collected.error);
    }

    const dataCenters = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
    const dcById = buildDataCenterById(dataCenters);
    const defaultSiteId =
      normalizeSiteId(
        settings?.location,
        dataCenters,
        String(dataCenters[0]?.id || "")
      ) || String(dataCenters[0]?.id || "").trim();

    const serviceBlocks = [];
    const dependsNames = [];
    let portIndex = 0;

    if (collected.sharded) {
      const shards = Array.isArray(settings.templateTopology.shards) ? settings.templateTopology.shards : [];
      for (const shard of shards) {
        const shardName = String(shard?.name || "").trim() || "shard";
        const shardNodes = Array.isArray(shard?.nodes) ? shard.nodes : [];
        const shardHostNames = shardNodes.map((n) => String(n.name).trim()).filter(Boolean);
        const mongoUri = buildMongoUri(shardHostNames, shardName);
        for (const node of shardNodes) {
          const serviceName = String(node.name).trim();
          if (!serviceName) {
            continue;
          }
          const dcId = String(node.dataCenter || "").trim();
          const region = normalizeDataCenter(regionForDataCenterId(dcById, dcId));
          const siteId = normalizeSiteId(dcId, dataCenters, defaultSiteId);
          const nodeNetworks = getNetworksForReplicaNode(region, siteId);
          const port = REPLICA_HOST_PORT_START + portIndex;
          portIndex += 1;
          const netLines = networkAttachmentLines(nodeNetworks);
          serviceBlocks.push(buildReplicaServiceYaml(serviceName, port, netLines, mongoUri, shardName));
          dependsNames.push(serviceName);
        }
      }
    } else {
      const replicaSetName = collected.replicaSetName;
      const nodes = collected.nodes;
      const seedNames = nodes.map((n) => String(n.name).trim()).filter(Boolean);
      const mongoUri = buildMongoUri(seedNames, replicaSetName);
      nodes.forEach((node) => {
        const serviceName = String(node.name).trim();
        if (!serviceName) {
          return;
        }
        const dcId = String(node.dataCenter || "").trim();
        const region = normalizeDataCenter(regionForDataCenterId(dcById, dcId));
        const siteId = normalizeSiteId(dcId, dataCenters, defaultSiteId);
        const nodeNetworks = getNetworksForReplicaNode(region, siteId);
        const port = REPLICA_HOST_PORT_START + portIndex;
        portIndex += 1;
        const netLines = networkAttachmentLines(nodeNetworks);
        serviceBlocks.push(buildReplicaServiceYaml(serviceName, port, netLines, mongoUri, replicaSetName));
        dependsNames.push(serviceName);
      });
    }

    const appServerBlocks = [];
    const maxAppServers = Math.min(4, dataCenters.length);
    for (let ai = 0; ai < maxAppServers; ai += 1) {
      const dcEntry = dataCenters[ai];
      const dcId = String(dcEntry?.id || "").trim();
      if (!dcId) {
        continue;
      }
      const serviceName = applicationServerServiceNameForDataCenterId(dcId);
      if (!serviceName) {
        continue;
      }
      const region = resolveDataCenterRegion(dcId, dataCenters);
      const siteId = normalizeSiteId(dcId, dataCenters, defaultSiteId);
      let appNetworks = getNetworksForApplicationOrConfig(region, siteId);
      if (collected.sharded) {
        appNetworks = [...new Set([...appNetworks, APPLICATION_SERVER_MESH_NETWORK_NAME])];
      }
      const appNetworkLines = networkAttachmentLines(appNetworks);
      appServerBlocks.push(buildApplicationServerYaml(serviceName, dependsNames, appNetworkLines));
    }

    const body = [...serviceBlocks, ...appServerBlocks].join("\n\n");
    const dcNets = buildDataCenterNetworksYaml(dataCenters, buildDataCenterLocalNetworkName, {
      includeApplicationServerMesh: collected.sharded
    });
    return `services:\n${indentBlock(body, 2)}${dcNets}`;
  }

  async function writeNetemTargetContainersFile(settings) {
    const names = [];
    const dcs = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
    for (let i = 0; i < Math.min(4, dcs.length); i += 1) {
      const n = applicationServerServiceNameForDataCenterId(dcs[i]?.id);
      if (n) {
        names.push(n);
      }
    }
    const outPath = path.join(PROJECT_ROOT, "server/data/netem-target-containers.txt");
    await fs.writeFile(outPath, `${names.join("\n")}\n`, "utf8");
    return outPath;
  }

  async function writeGeneratedComposeFile(settings) {
    const yaml = buildGeneratedStackDocument(settings);
    const outPath = path.join(PROJECT_ROOT, COMPOSE_GENERATED_FILE);
    await fs.writeFile(outPath, yaml, "utf8");
    await writeNetemTargetContainersFile(settings);
    return { path: outPath, COMPOSE_GENERATED_FILE };
  }

  async function removeGeneratedComposeFile() {
    const outPath = path.join(PROJECT_ROOT, COMPOSE_GENERATED_FILE);
    try {
      await fs.unlink(outPath);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw error;
      }
    }
  }

  return {
    COMPOSE_GENERATED_FILE,
    collectReplicaNodesFromSettings,
    buildGeneratedStackDocument,
    writeGeneratedComposeFile,
    writeNetemTargetContainersFile,
    removeGeneratedComposeFile
  };
}

module.exports = {
  createComposeStackGenerationService
};
