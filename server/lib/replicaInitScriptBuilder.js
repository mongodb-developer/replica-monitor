function buildDataCenterById(template) {
  const map = new Map();
  for (const dc of template.dataCenters || []) {
    map.set(String(dc.id || "").trim(), dc);
  }
  return map;
}

function regionForDataCenterId(dcById, dataCenterId) {
  const dc = dcById.get(String(dataCenterId || "").trim());
  const region = String(dc?.region || "").trim().toUpperCase();
  return region || "AMER";
}

/**
 * Shared initiate script for a single replica set (unsharded cluster or first shard).
 */
function buildFirstShardInitScript(replicaSetName, shardNodes, dcById, normalizeDataCenterFn) {
  const members = shardNodes.map((node, index) => {
    const region = normalizeDataCenterFn(regionForDataCenterId(dcById, node.dataCenter));
    const host = `${String(node.name).trim()}:27017`;
    const votes = String(node.type || "").trim() === "readOnly" ? 0 : 1;
    const priority = Number(node.priority);
    const tags = `{ dataCenter: ${JSON.stringify(region)}, dataCenterId: ${JSON.stringify(String(node.dataCenter).trim())} }`;
    return `      { _id: ${index}, host: ${JSON.stringify(host)}, priority: ${priority}, votes: ${votes}, tags: ${tags} }`;
  });
  return `
function waitForPrimary(maxAttempts, sleepMs) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const status = rs.status();
      const hasPrimary = status.members.some((member) => member.stateStr === "PRIMARY");
      if (hasPrimary) return true;
    } catch (e) {}
    sleep(sleepMs);
  }
  return false;
}
let initiated = false;
try {
  if (rs.status().ok === 1) {
    print("Replica set already initiated.");
    initiated = true;
  }
} catch (e) {
  print("Replica set not initiated yet.");
}
if (!initiated) {
  rs.initiate({
    _id: ${JSON.stringify(replicaSetName)},
    version: 1,
    members: [
${members.join(",\n")}
    ]
  });
}
if (!waitForPrimary(40, 1000)) {
  throw new Error("Primary was not elected in time.");
}
print("First shard replica set initialization complete.");
`.trim();
}

module.exports = {
  buildDataCenterById,
  regionForDataCenterId,
  buildFirstShardInitScript
};
