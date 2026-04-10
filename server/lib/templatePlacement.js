/**
 * Map replica service name -> { region, siteId } from persisted template topology.
 * Used wherever runtime placement must match the applied configuration (hosts, Docker networks).
 */
function buildTemplatePlacementByService(settings, configuredDataCenters, normalizeSiteIdFn, resolveDataCenterRegionFn) {
  const map = new Map();
  const topo = settings?.templateTopology;
  if (!topo || !Array.isArray(configuredDataCenters)) {
    return map;
  }
  const addNode = (node) => {
    const name = String(node?.name || "").trim();
    const dcId = String(node?.dataCenter || "").trim();
    if (!name || !dcId) {
      return;
    }
    const siteId = normalizeSiteIdFn(dcId, configuredDataCenters, dcId);
    const region = resolveDataCenterRegionFn(dcId, configuredDataCenters);
    map.set(name, { region, siteId });
  };
  if (!topo.sharded && topo.replicaSet?.nodes) {
    for (const n of topo.replicaSet.nodes) {
      addNode(n);
    }
  }
  if (topo.sharded && Array.isArray(topo.shards)) {
    for (const shard of topo.shards) {
      for (const n of shard?.nodes || []) {
        addNode(n);
      }
    }
  }
  return map;
}

module.exports = {
  buildTemplatePlacementByService
};
