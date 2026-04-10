const { buildTemplatePlacementByService } = require("../templatePlacement");
const {
  APPLICATION_SERVER_MESH_NETWORK_NAME,
  parseDataCenterIdFromApplicationServerServiceName,
  applicationServerServiceNameForDataCenterId
} = require("../applicationServerNaming");

function createNetworkPlacementService(deps) {
  const {
    INTER_REGION_NETWORKS,
    BASE_MANAGED_NETWORKS,
    REGION_NETWORKS,
    normalizeDataCenter,
    buildDataCenterLocalNetworkName,
    resolveDataCenterRegion,
    normalizeSiteId,
    getApplicationServerSettings,
    VALID_DATA_CENTERS,
    applicationServerService,
    configServerContainerName,
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
  } = deps;

  async function resolveActiveConfigServerContainerName() {
    const settings = await getApplicationServerSettings();
    const primary = applicationServerServiceNameForDataCenterId(String(settings.dataCenters?.[0]?.id || "").trim());
    return primary || applicationServerService;
  }

  function getInterRegionNetworksForRegion(region) {
    const normalizedRegion = normalizeDataCenter(region);
    const token = normalizedRegion.toLowerCase();
    return INTER_REGION_NETWORKS.filter((networkName) => networkName.includes(token));
  }

  function getAllManagedNetworkNames(configuredDataCenters = []) {
    const localNetworks = (configuredDataCenters || [])
      .map((entry) => buildDataCenterLocalNetworkName(entry?.id))
      .filter(Boolean);
    return [...new Set([...BASE_MANAGED_NETWORKS, ...localNetworks, APPLICATION_SERVER_MESH_NETWORK_NAME])];
  }

  function getNetworksForReplicaNode(region, siteId) {
    const normalizedRegion = normalizeDataCenter(region);
    const regionNetwork = REGION_NETWORKS[normalizedRegion] || REGION_NETWORKS.AMER;
    const localNetwork = buildDataCenterLocalNetworkName(siteId);
    return [...new Set([localNetwork, regionNetwork, ...getInterRegionNetworksForRegion(normalizedRegion)].filter(Boolean))];
  }

  function getNetworksForApplicationOrConfig(region, siteId) {
    const normalizedRegion = normalizeDataCenter(region);
    const regionNetwork = REGION_NETWORKS[normalizedRegion] || REGION_NETWORKS.AMER;
    const localNetwork = buildDataCenterLocalNetworkName(siteId);
    const regionalInterconnects = getInterRegionNetworksForRegion(normalizedRegion);
    return [...new Set([localNetwork, regionNetwork, ...regionalInterconnects].filter(Boolean))];
  }

  async function resolveServicePlacement(serviceName) {
    const settings = await getApplicationServerSettings();
    const configuredDataCenters = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
    const defaultSiteId = String(settings?.location || "").trim() || String(configuredDataCenters[0]?.id || "").trim();
    const resolveRegionForValue = (value) => {
      const raw = String(value || "").trim();
      const direct = raw.toUpperCase();
      if (VALID_DATA_CENTERS.includes(direct)) {
        return direct;
      }
      return resolveDataCenterRegion(raw, configuredDataCenters);
    };
    if (serviceName === applicationServerService) {
      return {
        region: resolveDataCenterRegion(settings.location, settings.dataCenters),
        siteId: normalizeSiteId(settings.location, configuredDataCenters, defaultSiteId)
      };
    }
    const asDcId = parseDataCenterIdFromApplicationServerServiceName(serviceName);
    if (asDcId && applicationServerServiceNameForDataCenterId(asDcId) === serviceName) {
      return {
        region: resolveDataCenterRegion(asDcId, configuredDataCenters),
        siteId: normalizeSiteId(asDcId, configuredDataCenters, defaultSiteId)
      };
    }
    if (serviceName === configServerContainerName) {
      return {
        region: resolveDataCenterRegion(settings.location, settings.dataCenters),
        siteId: normalizeSiteId(settings.location, configuredDataCenters, defaultSiteId)
      };
    }
    const targetName = `${serviceName}:27017`;
    const services = await getStatusQueryServices();
    for (const queryService of services) {
      try {
        const status = await queryStatusFromService(queryService);
        const member = status.members.find((entry) => entry.name === targetName);
        if (member) {
          const explicitRegion = String(member?.dataCenterRegion || "")
            .trim()
            .toUpperCase();
          if (VALID_DATA_CENTERS.includes(explicitRegion)) {
            return {
              region: explicitRegion,
              siteId: normalizeSiteId(member?.dataCenter, configuredDataCenters, defaultSiteId)
            };
          }
          const region = resolveRegionForValue(member.dataCenter);
          return {
            region,
            siteId: normalizeSiteId(member?.dataCenter, configuredDataCenters, defaultSiteId)
          };
        }
      } catch (_error) {
        // Try next node.
      }
    }
    throw new Error(`Unable to resolve placement for service: ${serviceName}`);
  }

  async function reconcileApplicationServerNetworks(_targetRegion, _targetSiteId, configuredDataCenters) {
    const settings = await getApplicationServerSettings();
    return reconcileAllApplicationServerNetworks(settings);
  }

  async function reconcileAllApplicationServerNetworks(settings, options = {}) {
    const { forceApplicationServerMesh = false } = options;
    const configuredDataCenters = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
    const sharded = Boolean(settings?.templateTopology?.sharded) || forceApplicationServerMesh;
    const defaultSiteId = String(configuredDataCenters[0]?.id || "").trim();
    const results = [];
    for (let i = 0; i < Math.min(4, configuredDataCenters.length); i += 1) {
      const dcId = String(configuredDataCenters[i]?.id || "").trim();
      if (!dcId) {
        continue;
      }
      const svc = applicationServerServiceNameForDataCenterId(dcId);
      if (!svc) {
        continue;
      }
      const region = resolveDataCenterRegion(dcId, configuredDataCenters);
      const siteId = normalizeSiteId(dcId, configuredDataCenters, defaultSiteId);
      let desiredNetworks = getNetworksForApplicationOrConfig(region, siteId);
      if (sharded) {
        desiredNetworks = [...new Set([...desiredNetworks, APPLICATION_SERVER_MESH_NETWORK_NAME])];
      }
      const managedNetworks = getAllManagedNetworkNames(configuredDataCenters);
      const running = await fetchRunningServices();
      if (runningServicesContains(running, svc)) {
        await reconcileContainerToNetworks(svc, desiredNetworks, managedNetworks);
      }
      results.push({ service: svc, region: normalizeDataCenter(region), siteId, networks: desiredNetworks });
    }
    return results;
  }

  async function reconcileConfigServerNetworks(targetRegion, targetSiteId, configuredDataCenters) {
    const targetContainer = await resolveActiveConfigServerContainerName();
    if (!(await doesContainerExist(targetContainer))) {
      return { applied: false, region: normalizeDataCenter(targetRegion), siteId: targetSiteId, networks: [] };
    }
    const settings = await getApplicationServerSettings();
    let desiredNetworks = getNetworksForApplicationOrConfig(targetRegion, targetSiteId);
    if (Boolean(settings?.templateTopology?.sharded)) {
      desiredNetworks = [...new Set([...desiredNetworks, APPLICATION_SERVER_MESH_NETWORK_NAME])];
    }
    const managedNetworks = getAllManagedNetworkNames(configuredDataCenters);
    await reconcileContainerToNetworks(targetContainer, desiredNetworks, managedNetworks);
    return { applied: true, region: normalizeDataCenter(targetRegion), siteId: targetSiteId, networks: desiredNetworks };
  }

  async function reconcileReplicaNodeNetworks(settings) {
    const persistedSettings = settings || (await getApplicationServerSettings());
    const configuredDataCenters = Array.isArray(persistedSettings?.dataCenters) ? persistedSettings.dataCenters : [];
    const localNetworkPlacementByName = new Map(
      configuredDataCenters
        .map((entry) => {
          const siteId = String(entry?.id || "").trim();
          const localNetworkName = buildDataCenterLocalNetworkName(siteId);
          if (!siteId || !localNetworkName) {
            return null;
          }
          return [
            localNetworkName,
            {
              siteId,
              region: normalizeDataCenter(entry?.region)
            }
          ];
        })
        .filter(Boolean)
    );
    const fallbackRegion = resolveDataCenterRegion(
      persistedSettings?.location,
      configuredDataCenters
    );
    const fallbackSiteId =
      normalizeSiteId(
        fallbackRegion,
        configuredDataCenters,
        String(configuredDataCenters[0]?.id || "")
      ) || null;
    const resolveRegionForValue = (value) => {
      const raw = String(value || "").trim();
      const direct = raw.toUpperCase();
      if (VALID_DATA_CENTERS.includes(direct)) {
        return direct;
      }
      return resolveDataCenterRegion(raw, configuredDataCenters);
    };
    const resolvePlacement = (member) => {
      const explicitRegion = String(member?.dataCenterRegion || "")
        .trim()
        .toUpperCase();
      const region = VALID_DATA_CENTERS.includes(explicitRegion)
        ? explicitRegion
        : resolveRegionForValue(member?.dataCenter);
      const siteId = normalizeSiteId(
        member?.dataCenter,
        configuredDataCenters,
        normalizeSiteId(region, configuredDataCenters, fallbackSiteId)
      );
      return {
        region,
        siteId
      };
    };
    const runningServices = await fetchRunningServices();
    const nodeServices = [...runningServices].filter(
      (serviceName) =>
        isReplicaServiceCandidate(serviceName) && serviceName !== configServerContainerName
    );
    if (!nodeServices.length) {
      return { appliedTo: [] };
    }
    const placementByService = {};
    try {
      const status = await fetchReplicaStatus();
      for (const member of status.members || []) {
        const serviceName = String(member?.name || "").split(":")[0].trim();
        if (!serviceName) {
          continue;
        }
        placementByService[serviceName] = resolvePlacement(member);
      }
    } catch (_error) {
      // Fallback placement is applied below.
    }
    const resolveAttachedLocalPlacement = async (serviceName) => {
      try {
        const attachedNetworks = await getContainerAttachedNetworks(serviceName);
        for (const [networkName, placement] of localNetworkPlacementByName.entries()) {
          if (attachedNetworks.has(networkName)) {
            return placement;
          }
        }
      } catch (_error) {
        // Fall back to default placement.
      }
      return null;
    };
    const managedNetworks = getAllManagedNetworkNames(configuredDataCenters);
    const templatePlacementByService = buildTemplatePlacementByService(
      persistedSettings,
      configuredDataCenters,
      normalizeSiteId,
      resolveDataCenterRegion
    );
    const appliedTo = await Promise.all(
      nodeServices.map(async (serviceName) => {
        const fromTemplate = templatePlacementByService.get(serviceName);
        const placement =
          fromTemplate ||
          placementByService[serviceName] ||
          (await resolveAttachedLocalPlacement(serviceName)) || { region: fallbackRegion, siteId: fallbackSiteId };
        const desiredNetworks = getNetworksForReplicaNode(placement.region, placement.siteId);
        await reconcileContainerToNetworks(serviceName, desiredNetworks, managedNetworks);
        return { service: serviceName, region: placement.region, siteId: placement.siteId, networks: desiredNetworks };
      })
    );
    return { appliedTo };
  }

  async function ensureApplicationServerLocationApplied(options = {}) {
    const skipElectionTimeoutAndNetemApply = options.skipElectionTimeoutAndNetemApply === true;
    const settings = await getApplicationServerSettings();
    const location = settings.location;
    const locationRegion = resolveDataCenterRegion(settings.location, settings.dataCenters);
    const runningServices = await fetchRunningServices();
    const appServerNames = [];
    for (let i = 0; i < Math.min(4, (settings.dataCenters || []).length); i += 1) {
      const n = applicationServerServiceNameForDataCenterId(settings.dataCenters[i]?.id);
      if (n) {
        appServerNames.push(n);
      }
    }
    const applicationServerRunning = appServerNames.some((n) => runningServicesContains(runningServices, n));
    const activeConfigContainer = await resolveActiveConfigServerContainerName();
    const configServerExists = await doesContainerExist(activeConfigContainer);
    let configServerApplied = false;
    if (!applicationServerRunning && !configServerExists) {
      return {
        location,
        electionTimeoutMs: settings.electionTimeoutMs,
        applied: false,
        configServerApplied: false,
        workloadRestarted: false
      };
    }
    if (applicationServerRunning) {
      await reconcileAllApplicationServerNetworks(settings);
    }
    if (configServerExists) {
      const primarySvc = await resolveActiveConfigServerContainerName();
      if (primarySvc && (await doesContainerExist(primarySvc))) {
        const primaryDcId = String(settings.dataCenters?.[0]?.id || "").trim();
        const locationSiteId = normalizeSiteId(primaryDcId, settings.dataCenters, primaryDcId);
        const primaryRegion = resolveDataCenterRegion(primaryDcId, settings.dataCenters);
        const configServerNetworkResult = await reconcileConfigServerNetworks(
          primaryRegion,
          locationSiteId,
          settings.dataCenters
        );
        configServerApplied = configServerNetworkResult.applied;
      }
    }
    await reconcileReplicaNodeNetworks(settings);
    await syncDataCenterHostsEntries();
    if (!skipElectionTimeoutAndNetemApply) {
      await applyPersistedReplicaSetElectionTimeout({ suppressErrors: true });
      await runNetemLatencyScript("apply", { strict: false });
    }
    return {
      location,
      locationRegion,
      electionTimeoutMs: settings.electionTimeoutMs,
      applied: applicationServerRunning,
      configServerApplied,
      workloadRestarted: false
    };
  }

  return {
    getInterRegionNetworksForRegion,
    getAllManagedNetworkNames,
    getNetworksForReplicaNode,
    getNetworksForApplicationOrConfig,
    resolveServicePlacement,
    reconcileApplicationServerNetworks,
    reconcileAllApplicationServerNetworks,
    reconcileConfigServerNetworks,
    reconcileReplicaNodeNetworks,
    ensureApplicationServerLocationApplied
  };
}

module.exports = {
  createNetworkPlacementService
};
