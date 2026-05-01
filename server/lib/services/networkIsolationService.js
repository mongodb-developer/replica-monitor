const {
  listApplicationServerServiceNames,
  isApplicationServerComposeServiceName
} = require("../applicationServerNaming");

function createNetworkIsolationService(deps) {
  const {
    assertValidServiceName,
    resolveServicePlacement,
    normalizeDataCenter,
    REGION_NETWORKS,
    CONFIG_SERVER_CONTAINER_NAME,
    getNetworksForApplicationOrConfig,
    getNetworksForReplicaNode,
    updateContainerNetworks,
    isolatedContainers,
    isAutoStatusNodeSelectionEnabled,
    getLastKnownPrimaryService,
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
  } = deps;

  async function isolateContainerNetwork(containerName) {
    assertValidServiceName(containerName);
    const placement = await resolveServicePlacement(containerName);
    const normalizedRegion = normalizeDataCenter(placement.region);
    const regionNetwork = REGION_NETWORKS[normalizedRegion] || REGION_NETWORKS.AMER;
    const serviceNetworks =
      isApplicationServerComposeServiceName(containerName) || containerName === CONFIG_SERVER_CONTAINER_NAME
        ? getNetworksForApplicationOrConfig(placement.region, placement.siteId)
        : getNetworksForReplicaNode(placement.region, placement.siteId);
    const requiredNetworks = [...new Set([regionNetwork, ...serviceNetworks].filter(Boolean))];
    const result = await updateContainerNetworks(containerName, requiredNetworks, "disconnect");
    isolatedContainers.add(containerName);
    if (isAutoStatusNodeSelectionEnabled() && containerName === getLastKnownPrimaryService()) {
      startPrimaryReelectionChecksIfNeeded();
    }
    return result;
  }

  async function connectContainerNetwork(containerName) {
    assertValidServiceName(containerName);
    const placement = await resolveServicePlacement(containerName);
    const requiredNetworks = getNetworksForReplicaNode(placement.region, placement.siteId);
    const managedNetworks = getAllManagedNetworkNames((await getApplicationServerSettings()).dataCenters);
    await updateContainerNetworks(containerName, managedNetworks, "disconnect");
    const result = await updateContainerNetworks(containerName, requiredNetworks, "connect");
    isolatedContainers.delete(containerName);
    if (!isolatedContainers.has(getLastKnownPrimaryService())) {
      stopPrimaryReelectionChecks();
    }
    await runNetemLatencyScript("apply", { strict: false, targetContainers: [containerName] });
    return result;
  }

  async function updateDataCenterNetworks(dataCenterId, action) {
    const normalizedDataCenterId = String(dataCenterId || "").trim();
    if (!normalizedDataCenterId) {
      throw new Error("dataCenterId is required.");
    }
    const settings = await getApplicationServerSettings();
    const configuredDataCenters = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
    const selectedDataCenter = configuredDataCenters.find(
      (entry) => String(entry?.id || "").trim() === normalizedDataCenterId
    );
    if (!selectedDataCenter) {
      throw new Error(`Unknown data center ID: ${normalizedDataCenterId}`);
    }
    const selectedRegion = resolveDataCenterRegion(normalizedDataCenterId, configuredDataCenters);
    const intraRegionNetwork = REGION_NETWORKS[selectedRegion] || null;
    if (!intraRegionNetwork) {
      throw new Error(`Unable to resolve intra-region network for data center ${normalizedDataCenterId}.`);
    }

    const status = await fetchReplicaStatus();
    const containers = [...new Set(
      (status.members || [])
        .filter((member) => String(member?.dataCenter || "").trim() === normalizedDataCenterId)
        .map((member) => memberNameToService(member.name))
        .filter(Boolean)
    )];
    const activeConfigContainer = await resolveActiveConfigServerContainerName();
    const appServers = listApplicationServerServiceNames(settings);
    const serviceTargets = [...new Set([...appServers, activeConfigContainer])];
    for (const serviceName of serviceTargets) {
      if (!(await doesContainerExist(serviceName))) {
        continue;
      }
      try {
        const placement = await resolveServicePlacement(serviceName);
        if (String(placement?.siteId || "").trim() === normalizedDataCenterId) {
          containers.push(serviceName);
        }
      } catch (_error) {
        // Ignore placement lookup failures and continue with known members.
      }
    }
    const uniqueContainers = [...new Set(containers)];

    if (!uniqueContainers.length) {
      throw new Error(`No containers found in data center ${normalizedDataCenterId}.`);
    }

    const interRegionNetworks = getInterRegionNetworksForRegion(selectedRegion);
    const networks = [...new Set([intraRegionNetwork, ...interRegionNetworks])];
    const failures = [];

    for (const containerName of uniqueContainers) {
      assertValidServiceName(containerName);
      for (const networkName of networks) {
        try {
          const options = {};
          if (action === "connect") {
            await ensureDockerNetworkExists(networkName);
            options.ipAddress = await resolveContainerNetworkIpAllocation(networkName, containerName);
          }
          await runDockerNetworkCommand(action, networkName, containerName, options);
        } catch (error) {
          if (isIgnorableNetworkError(action, error.message)) {
            continue;
          }
          failures.push(`${containerName}@${networkName}: ${error.message}`);
        }
      }
    }

    if (failures.length) {
      throw new Error(
        `Failed to ${action} data center ${normalizedDataCenterId} networks: ${failures.join(" | ")}`
      );
    }

    if (action === "disconnect") {
      uniqueContainers.forEach((containerName) => isolatedContainers.add(containerName));
    } else if (action === "connect") {
      uniqueContainers.forEach((containerName) => isolatedContainers.delete(containerName));
    }

    await refreshNetworkIpAllocationsFromDocker();

    return { dataCenterId: normalizedDataCenterId, region: selectedRegion, containers: uniqueContainers, networks };
  }

  async function isolateDataCenterNetwork(dataCenterId) {
    const result = await updateDataCenterNetworks(dataCenterId, "disconnect");
    if (isAutoStatusNodeSelectionEnabled() && result.containers.includes(getLastKnownPrimaryService())) {
      startPrimaryReelectionChecksIfNeeded();
    }
    return result;
  }

  async function connectDataCenterNetwork(dataCenterId) {
    const result = await updateDataCenterNetworks(dataCenterId, "connect");
    const settingsForRecovery = await getApplicationServerSettings();
    const asNames = listApplicationServerServiceNames(settingsForRecovery);
    const recoveredAppServices = result.containers.filter((n) => asNames.includes(n));
    const recoveredMongoNodes = result.containers.filter(
      (n) => !asNames.includes(n) && n !== CONFIG_SERVER_CONTAINER_NAME
    );
    const configServerExists = await doesContainerExist(CONFIG_SERVER_CONTAINER_NAME);
    let mongosStoppedForRecovery = false;

    if (recoveredAppServices.length > 0 && configServerExists) {
      await stopMongosOnApplicationServers(recoveredAppServices);
      mongosStoppedForRecovery = true;
    }

    try {
      const allRecoveredTargets = [...recoveredAppServices, ...recoveredMongoNodes];
      if (allRecoveredTargets.length > 0) {
        await runNetemLatencyScript("apply", {
          strict: false,
          targetContainers: allRecoveredTargets
        });
      }
    } finally {
      if (mongosStoppedForRecovery) {
        await startMongosOnApplicationServers(recoveredAppServices);
      }
    }

    if (!isolatedContainers.has(getLastKnownPrimaryService())) {
      stopPrimaryReelectionChecks();
    }
    return result;
  }

  return {
    isolateContainerNetwork,
    connectContainerNetwork,
    isolateDataCenterNetwork,
    connectDataCenterNetwork
  };
}

module.exports = {
  createNetworkIsolationService
};
