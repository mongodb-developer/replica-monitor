function createPrimaryReelectionService(deps) {
  const {
    isAutoStatusNodeSelectionEnabled,
    getLastKnownPrimaryService,
    isContainerIsolated,
    getStatusQueryServices,
    queryStatusFromService,
    memberNameToService,
    setPreferredStatusService,
    setLastKnownPrimaryService,
    primaryReelectionCheckIntervalMs
  } = deps;

  let reelectionCheckTimer = null;

  function stopPrimaryReelectionChecks() {
    if (reelectionCheckTimer) {
      clearInterval(reelectionCheckTimer);
      reelectionCheckTimer = null;
    }
  }

  async function checkAndAdoptNewPrimary() {
    const lastKnownPrimaryService = getLastKnownPrimaryService();
    if (!isAutoStatusNodeSelectionEnabled() || !lastKnownPrimaryService) {
      return;
    }
    if (!isContainerIsolated(lastKnownPrimaryService)) {
      stopPrimaryReelectionChecks();
      return;
    }

    const statusServices = await getStatusQueryServices();
    const candidateServices = statusServices.filter(
      (serviceName) => serviceName !== lastKnownPrimaryService && !isContainerIsolated(serviceName)
    );

    for (const serviceName of candidateServices) {
      try {
        const status = await queryStatusFromService(serviceName);
        const discoveredPrimary = memberNameToService(status.primaryName);
        if (discoveredPrimary && discoveredPrimary !== getLastKnownPrimaryService()) {
          setPreferredStatusService(
            statusServices.includes(discoveredPrimary)
              ? discoveredPrimary
              : serviceName
          );
          setLastKnownPrimaryService(discoveredPrimary);
          stopPrimaryReelectionChecks();
          return;
        }
      } catch (_error) {
        // Ignore transient errors; continue polling other nodes.
      }
    }
  }

  function startPrimaryReelectionChecksIfNeeded() {
    if (!isAutoStatusNodeSelectionEnabled() || reelectionCheckTimer) {
      return;
    }
    reelectionCheckTimer = setInterval(() => {
      checkAndAdoptNewPrimary().catch(() => {
        // Keep retrying while timer is active.
      });
    }, primaryReelectionCheckIntervalMs);
  }

  return {
    stopPrimaryReelectionChecks,
    checkAndAdoptNewPrimary,
    startPrimaryReelectionChecksIfNeeded
  };
}

module.exports = {
  createPrimaryReelectionService
};
