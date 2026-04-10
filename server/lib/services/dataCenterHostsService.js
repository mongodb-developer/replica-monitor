const { buildTemplatePlacementByService } = require("../templatePlacement");
const {
  APPLICATION_SERVER_MESH_NETWORK_NAME,
  listApplicationServerServiceNames,
  applicationServerServiceNameForDataCenterId,
  isApplicationServerComposeServiceName
} = require("../applicationServerNaming");

function createDataCenterHostsService(deps) {
  const {
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
    configServerContainerName,
    REGION_NETWORKS,
    buildDataCenterLocalNetworkName,
    inspectContainerNetworkIp,
    lastManagedHostsEntriesByService
  } = deps;

  function escapeSingleQuotes(text) {
    return String(text || "").replace(/'/g, `'\\''`);
  }

  async function replaceManagedHostsBlock(containerName, hostEntries) {
    assertValidServiceName(containerName);
    const beginMarker = "# BEGIN FAILOVER-MONITOR-DC-HOSTS";
    const endMarker = "# END FAILOVER-MONITOR-DC-HOSTS";
    const lines = [beginMarker, ...hostEntries, endMarker];
    const blockText = lines.join("\n");
    const escapedBlock = escapeSingleQuotes(blockText);
    const escapedBegin = escapeSingleQuotes(beginMarker);
    const escapedEnd = escapeSingleQuotes(endMarker);
    const command = `
tmp=$(mktemp) &&
awk '
  BEGIN { skip=0 }
  $0=="${escapedBegin}" { skip=1; next }
  $0=="${escapedEnd}" { skip=0; next }
  skip==0 { print }
' /etc/hosts > "$tmp" &&
printf "\\n%s\\n" '${escapedBlock}' >> "$tmp" &&
cat "$tmp" > /etc/hosts &&
rm -f "$tmp"
`.trim();
    await runCompose(["exec", "-T", containerName, "bash", "-lc", command], 30000);
  }

  async function syncDataCenterHostsEntries() {
    const settings = await getApplicationServerSettings();
    const configuredDataCenters = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
    const fallbackSiteId = String(settings?.location || "").trim() || String(configuredDataCenters[0]?.id || "").trim();
    const resolveRegionForValue = (value) => {
      const raw = String(value || "").trim();
      const direct = raw.toUpperCase();
      if (VALID_DATA_CENTERS.includes(direct)) {
        return direct;
      }
      return resolveDataCenterRegion(raw, configuredDataCenters);
    };
    const resolveSiteForValue = (value, fallbackRegion) =>
      normalizeSiteId(
        value,
        configuredDataCenters,
        normalizeSiteId(fallbackRegion, configuredDataCenters, fallbackSiteId)
      );
    const resolveMemberRegion = (member) => {
      const explicitRegion = String(member?.dataCenterRegion || "")
        .trim()
        .toUpperCase();
      if (VALID_DATA_CENTERS.includes(explicitRegion)) {
        return explicitRegion;
      }
      return resolveRegionForValue(member?.dataCenter);
    };
    const resolveMemberPlacement = (member) => {
      const region = resolveMemberRegion(member);
      return {
        region,
        siteId: resolveSiteForValue(member?.dataCenter, region)
      };
    };

    const runningServices = await fetchRunningServices();
    const placementByService = {};
    try {
      const status = await fetchReplicaStatus();
      for (const member of status.members || []) {
        const serviceName = memberNameToService(member.name);
        if (!serviceName) {
          continue;
        }
        placementByService[serviceName] = resolveMemberPlacement(member);
      }
    } catch (_error) {
      // Status can be unavailable before replica initialization; fallback handled below.
    }

    const nodeServices = [...runningServices].filter(
      (serviceName) =>
        isReplicaServiceCandidate(serviceName) &&
        serviceName !== configServerContainerName &&
        !isApplicationServerComposeServiceName(serviceName)
    );
    const defaultRegion = resolveDataCenterRegion(settings.location, settings.dataCenters);
    const defaultSiteId = normalizeSiteId(settings.location, configuredDataCenters, fallbackSiteId);
    const templatePlacementByService = buildTemplatePlacementByService(
      settings,
      configuredDataCenters,
      normalizeSiteId,
      resolveDataCenterRegion
    );
    for (const serviceName of nodeServices) {
      const fromTemplate = templatePlacementByService.get(serviceName);
      const fromStatus = placementByService[serviceName];
      placementByService[serviceName] =
        fromTemplate || fromStatus || { region: defaultRegion, siteId: defaultSiteId };
    }
    const applicationServerInstances = listApplicationServerServiceNames(settings).filter((n) =>
      runningServicesContains(runningServices, n)
    );
    for (const asName of applicationServerInstances) {
      const dcId = String(
        configuredDataCenters.find(
          (e) => applicationServerServiceNameForDataCenterId(e?.id) === asName
        )?.id || ""
      ).trim();
      if (dcId) {
        placementByService[asName] = {
          region: resolveDataCenterRegion(dcId, configuredDataCenters),
          siteId: normalizeSiteId(dcId, configuredDataCenters, fallbackSiteId)
        };
      } else {
        placementByService[asName] = {
          region: defaultRegion,
          siteId: defaultSiteId
        };
      }
    }
    if (runningServicesContains(runningServices, configServerContainerName)) {
      placementByService[configServerContainerName] = {
        region: defaultRegion,
        siteId: defaultSiteId
      };
    }

    const targetServices = [...nodeServices];
    for (const asName of applicationServerInstances) {
      targetServices.push(asName);
    }
    if (runningServicesContains(runningServices, configServerContainerName)) {
      targetServices.push(configServerContainerName);
    }

    const ipCache = new Map();
    const getIp = async (serviceName, networkName) => {
      const cacheKey = `${serviceName}::${networkName}`;
      if (ipCache.has(cacheKey)) {
        return ipCache.get(cacheKey);
      }
      let ipAddress = "";
      try {
        ipAddress = await inspectContainerNetworkIp(serviceName, networkName);
      } catch (_error) {
        ipAddress = "";
      }
      ipCache.set(cacheKey, ipAddress);
      return ipAddress;
    };

    for (const serviceName of targetServices) {
      const targetPlacement = placementByService[serviceName] || { region: defaultRegion, siteId: defaultSiteId };
      const targetRegionNetwork = REGION_NETWORKS[targetPlacement.region] || REGION_NETWORKS.AMER;
      const targetLocalNetwork = buildDataCenterLocalNetworkName(targetPlacement.siteId);
      const peerEntries = [];
      const seenHosts = new Set();
      for (const peerServiceName of targetServices) {
        if (peerServiceName === serviceName || seenHosts.has(peerServiceName)) {
          continue;
        }
        const peerPlacement = placementByService[peerServiceName] || {
          region: defaultRegion,
          siteId: defaultSiteId
        };
        let selectedNetwork = null;
        if (
          targetLocalNetwork &&
          peerPlacement.siteId &&
          targetPlacement.siteId &&
          peerPlacement.siteId === targetPlacement.siteId
        ) {
          selectedNetwork = targetLocalNetwork;
        } else if (peerPlacement.region === targetPlacement.region) {
          selectedNetwork = targetRegionNetwork;
        }
        if (!selectedNetwork) {
          continue;
        }
        let peerIp = await getIp(peerServiceName, selectedNetwork);
        if (!peerIp && selectedNetwork === targetLocalNetwork && peerPlacement.region === targetPlacement.region) {
          peerIp = await getIp(peerServiceName, targetRegionNetwork);
        }
        if (!peerIp) {
          continue;
        }
        peerEntries.push(`${peerIp} ${peerServiceName}`);
        seenHosts.add(peerServiceName);
      }
      if (settings?.templateTopology?.sharded && isApplicationServerComposeServiceName(serviceName)) {
        for (const peer of applicationServerInstances) {
          if (peer === serviceName || seenHosts.has(peer)) {
            continue;
          }
          const meshIp = await getIp(peer, APPLICATION_SERVER_MESH_NETWORK_NAME);
          if (meshIp) {
            peerEntries.push(`${meshIp} ${peer}`);
            seenHosts.add(peer);
          }
        }
      }
      const normalizedPeerEntries = [...new Set(peerEntries)].sort((a, b) => a.localeCompare(b));
      const nextManagedEntriesKey = normalizedPeerEntries.join("\n");
      if (lastManagedHostsEntriesByService.get(serviceName) === nextManagedEntriesKey) {
        continue;
      }
      await replaceManagedHostsBlock(serviceName, normalizedPeerEntries);
      lastManagedHostsEntriesByService.set(serviceName, nextManagedEntriesKey);
    }
  }

  return {
    escapeSingleQuotes,
    syncDataCenterHostsEntries
  };
}

module.exports = {
  createDataCenterHostsService
};
