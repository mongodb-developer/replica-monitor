const {
  listApplicationServerServiceNames,
  applicationServerServiceNameForDataCenterId,
  getActiveApplicationServerServiceName
} = require("../applicationServerNaming");

function createApplicationServerLocationService(deps) {
  const {
    getApplicationServerSettings,
    setApplicationServerSettings,
    normalizeTopologyShowShardLabels,
    applyPersistedReplicaSetElectionTimeout,
    isApplicationServerWorkloadRunning,
    stopApplicationServerWorkload,
    startApplicationServerWorkload,
    applyApplicationServerRuntimeMongoSettings
  } = deps;

  async function updateApplicationServerLocation(nextLocation, electionTimeoutMs = null, mongoSettings = {}) {
    const previousSettings = await getApplicationServerSettings();
    const locationChanged = String(previousSettings.location || "").trim() !== String(nextLocation || "").trim();
    const workloadWasRunning = isApplicationServerWorkloadRunning();

    const relocationSequence = [];

    if (workloadWasRunning && locationChanged) {
      const prevLoc = String(previousSettings.location || "").trim();
      const prevSvc = applicationServerServiceNameForDataCenterId(prevLoc);
      const names = listApplicationServerServiceNames(previousSettings);
      const stopTarget =
        prevSvc && names.includes(prevSvc) ? prevSvc : getActiveApplicationServerServiceName(previousSettings);
      relocationSequence.push("stop:workload");
      await stopApplicationServerWorkload({ serviceName: stopTarget });
    }

    const persistedSettings = await setApplicationServerSettings({
      ...previousSettings,
      location: nextLocation,
      electionTimeoutMs: electionTimeoutMs === null ? previousSettings.electionTimeoutMs : electionTimeoutMs,
      writeConcern:
        mongoSettings?.writeConcern === undefined
          ? previousSettings.writeConcern
          : mongoSettings.writeConcern,
      readConcern:
        mongoSettings?.readConcern === undefined ? previousSettings.readConcern : mongoSettings.readConcern,
      readPreference:
        mongoSettings?.readPreference === undefined
          ? previousSettings.readPreference
          : mongoSettings.readPreference,
      topologyShowShardLabels:
        mongoSettings?.topologyShowShardLabels === undefined
          ? previousSettings.topologyShowShardLabels
          : normalizeTopologyShowShardLabels(mongoSettings.topologyShowShardLabels)
    });

    const mongoSettingsChanged =
      persistedSettings.writeConcern !== previousSettings.writeConcern ||
      persistedSettings.readConcern !== previousSettings.readConcern ||
      persistedSettings.readPreference !== previousSettings.readPreference;
    const deploymentProfileChanged = false;
    const electionTimeoutChanged =
      Number(persistedSettings.electionTimeoutMs) !== Number(previousSettings.electionTimeoutMs);
    const location = persistedSettings.location;

    let electionTimeoutResult = {
      electionTimeoutMs: persistedSettings.electionTimeoutMs,
      appliedReplicaSets: []
    };

    if (electionTimeoutChanged) {
      electionTimeoutResult = await applyPersistedReplicaSetElectionTimeout();
    }

    let mongoSettingsApplied = false;
    if (mongoSettingsChanged && workloadWasRunning && !locationChanged) {
      const runtimeApplyResult = await applyApplicationServerRuntimeMongoSettings(persistedSettings, {
        skipWhenServiceNotRunning: true
      });
      mongoSettingsApplied = Boolean(runtimeApplyResult?.applied);
    } else if (mongoSettingsChanged && workloadWasRunning && locationChanged) {
      mongoSettingsApplied = true;
    }

    let workloadRestarted = false;
    if (workloadWasRunning && locationChanged) {
      relocationSequence.push("start:workload");
      await startApplicationServerWorkload();
      workloadRestarted = true;
    }

    return {
      dataCenters: persistedSettings.dataCenters,
      location,
      previousLocation: previousSettings.location,
      electionTimeoutMs: persistedSettings.electionTimeoutMs,
      electionTimeoutAppliedTo: electionTimeoutResult.appliedReplicaSets,
      writeConcern: persistedSettings.writeConcern,
      readConcern: persistedSettings.readConcern,
      readPreference: persistedSettings.readPreference,
      deploymentProfile: persistedSettings.deploymentProfile,
      topologyShowShardLabels: persistedSettings.topologyShowShardLabels,
      applied: locationChanged,
      configServerApplied: false,
      mongoSettingsApplied,
      deploymentProfileChanged,
      workloadRestarted,
      relocationSequence
    };
  }

  async function updateApplicationServerUserLocation(nextUserLocation) {
    const previousSettings = await getApplicationServerSettings();
    const persistedSettings = await setApplicationServerSettings({
      ...previousSettings,
      userLocation: nextUserLocation
    });
    const workloadWasRunning = isApplicationServerWorkloadRunning();
    if (workloadWasRunning) {
      await stopApplicationServerWorkload();
      await startApplicationServerWorkload();
    }
    return {
      dataCenters: persistedSettings.dataCenters,
      userLocation: persistedSettings.userLocation,
      previousUserLocation: previousSettings.userLocation,
      workloadRestarted: workloadWasRunning
    };
  }

  return {
    updateApplicationServerLocation,
    updateApplicationServerUserLocation
  };
}

module.exports = {
  createApplicationServerLocationService
};
