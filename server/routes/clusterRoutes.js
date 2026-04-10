const { clearConfigurationApplySucceeded } = require("../lib/configurationSessionState");
const { requireUiControl } = require("../lib/uiControlService");

function registerClusterRoutes(app, deps) {
  const {
    startStack,
    initReplicaSet,
    resetRuntimeState,
    stopStack,
    stopApplicationServerWorkload,
    clearZonesData,
    getZones,
    setZones,
    getCountryOptions,
    syncZonesToSharding,
    getApplicationServerSettings,
    resolveDataCenterRegion,
    VALID_DATA_CENTERS,
    addReplicaNode,
    removeReplicaNode,
    stopMongoDBGraceful,
    stopMongoDBHard,
    startMongoDB,
    increaseMongoDBPriority,
    decreaseMongoDBPriority,
    isolateContainerNetwork,
    connectContainerNetwork,
    isolateDataCenterNetwork,
    connectDataCenterNetwork,
    setPreferredStatusService,
    shardReplicaSet,
    stopContainer,
    startContainer,
    SHARD_NAME_PATTERN
  } = deps;

  app.post("/api/stack/start", requireUiControl, async (_req, res) => {
    try {
      const result = await startStack();
      res.json({
        ok: true,
        message: "Docker stack started.",
        output: result.stdout.trim()
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/zones", async (_req, res) => {
    try {
      const { zones, updatedAt } = await getZones();
      res.json({
        ok: true,
        zones,
        countryOptions: getCountryOptions(),
        updatedAt
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/zones", requireUiControl, async (req, res) => {
    const zones = req.body?.zones;
    try {
      const result = await setZones(zones);
      const syncResult = await syncZonesToSharding(result.zones);
      res.json({
        ok: true,
        ...result,
        ...syncResult
      });
    } catch (error) {
      const message = String(error?.message || "");
      const isValidationError =
        message.includes("zones[")
        || message.includes("zones must be")
        || message.includes("Zone name")
        || message.includes("country code");
      res.status(isValidationError ? 400 : 500).json({ ok: false, error: message || "Request failed" });
    }
  });

  app.post("/api/replicaset/init", requireUiControl, async (_req, res) => {
    try {
      const result = await initReplicaSet();
      res.json({
        ok: true,
        message: "Replica set initialization completed.",
        output: result.stdout.trim()
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/replicaset/reset", requireUiControl, async (_req, res) => {
    try {
      await stopApplicationServerWorkload();
      await stopStack();
      resetRuntimeState();
      await clearZonesData();
      clearConfigurationApplySucceeded();
      const startResult = await startStack();
      const initResult = await initReplicaSet();
      res.json({
        ok: true,
        message: "Replica set reset, stack started, and initialization completed.",
        startOutput: String(startResult?.stdout || "").trim(),
        initOutput: String(initResult?.stdout || "").trim()
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/replicaset/nodes/add", requireUiControl, async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const role = String(req.body?.role || "").trim().toLowerCase();
    const dataCenter = String(req.body?.dataCenter || "").trim();
    const rawShardName = req.body?.shardName;
    const shardName = rawShardName === undefined || rawShardName === null ? "" : String(rawShardName).trim();
    if (!name) {
      res.status(400).json({ ok: false, error: "name is required" });
      return;
    }
    if (role !== "voting" && role !== "analytics") {
      res.status(400).json({ ok: false, error: "role must be voting or analytics" });
      return;
    }
    let currentSettings;
    try {
      currentSettings = await getApplicationServerSettings();
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
      return;
    }
    const validLocationIds = new Set(
      (currentSettings?.dataCenters || []).map((entry) => String(entry?.id || "").trim()).filter(Boolean)
    );
    if (!validLocationIds.has(dataCenter)) {
      res.status(400).json({
        ok: false,
        error: `dataCenter must be one of configured data center IDs: ${[...validLocationIds].join(", ")}`
      });
      return;
    }
    if (shardName && !SHARD_NAME_PATTERN.test(shardName)) {
      res.status(400).json({
        ok: false,
        error: "shardName is invalid (allowed: letters, numbers, hyphen, underscore)"
      });
      return;
    }

    try {
      const dataCenterRegion = resolveDataCenterRegion(dataCenter, currentSettings?.dataCenters || []);
      if (!VALID_DATA_CENTERS.includes(dataCenterRegion)) {
        res.status(400).json({
          ok: false,
          error: `Unable to resolve data center region for selected data center: ${dataCenter}`
        });
        return;
      }
      const result = await addReplicaNode(name, role, dataCenterRegion, shardName || null, dataCenter);
      const message = result.createdNewShard
        ? `Created shard ${result.shardName} and added node ${name} as ${role}.`
        : `Replica node ${name} added as ${role}.`;
      res.json({
        ok: true,
        ...result,
        message
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/replicaset/nodes/remove", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      const result = await removeReplicaNode(service);
      res.json({
        ok: true,
        ...result,
        message: `Replica node ${service} removed from set and container deleted.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/mongodb/stop-graceful", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      await stopMongoDBGraceful(service);
      res.json({
        ok: true,
        service,
        message: `MongoDB stopped gracefully on ${service}.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/mongodb/stop-hard", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      await stopMongoDBHard(service);
      res.json({
        ok: true,
        service,
        message: `MongoDB hard-stopped on ${service}.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/mongodb/start", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      await startMongoDB(service);
      res.json({
        ok: true,
        service,
        message: `MongoDB started on ${service}.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/mongodb/priority/increase", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      await increaseMongoDBPriority(service);
      res.json({
        ok: true,
        service,
        message: `MongoDB priority increased on ${service}.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/mongodb/priority/decrease", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      await decreaseMongoDBPriority(service);
      res.json({
        ok: true,
        service,
        message: `MongoDB priority decreased on ${service}.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/network/isolate", requireUiControl, async (req, res) => {
    const container = String(req.body?.container || "").trim();
    if (!container) {
      res.status(400).json({ ok: false, error: "container is required" });
      return;
    }

    try {
      await isolateContainerNetwork(container);
      res.json({
        ok: true,
        container,
        message: `Container ${container} disconnected from data-center networks.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/network/connect", requireUiControl, async (req, res) => {
    const container = String(req.body?.container || "").trim();
    if (!container) {
      res.status(400).json({ ok: false, error: "container is required" });
      return;
    }

    try {
      await connectContainerNetwork(container);
      res.json({
        ok: true,
        container,
        message: `Container ${container} connected to data-center networks.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/network/datacenter/isolate", requireUiControl, async (req, res) => {
    const dataCenterId = String(req.body?.dataCenter || req.body?.dataCenterId || "").trim();
    if (!dataCenterId) {
      res.status(400).json({ ok: false, error: "dataCenterId is required" });
      return;
    }

    try {
      const result = await isolateDataCenterNetwork(dataCenterId);
      res.json({
        ok: true,
        dataCenterId: result.dataCenterId,
        region: result.region,
        containers: result.containers,
        networks: result.networks,
        message: `Data center ${result.dataCenterId} disconnected from inter-region and intra-region networks.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/network/datacenter/connect", requireUiControl, async (req, res) => {
    const dataCenterId = String(req.body?.dataCenter || req.body?.dataCenterId || "").trim();
    if (!dataCenterId) {
      res.status(400).json({ ok: false, error: "dataCenterId is required" });
      return;
    }

    try {
      const result = await connectDataCenterNetwork(dataCenterId);
      res.json({
        ok: true,
        dataCenterId: result.dataCenterId,
        region: result.region,
        containers: result.containers,
        networks: result.networks,
        message: `Data center ${result.dataCenterId} reconnected to inter-region and intra-region networks.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/status-node/set", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    const shardName = String(req.body?.shardName || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }
    if (shardName && !SHARD_NAME_PATTERN.test(shardName)) {
      res.status(400).json({
        ok: false,
        error: "shardName is invalid (allowed: letters, numbers, hyphen, underscore)"
      });
      return;
    }

    try {
      const result = await setPreferredStatusService(service, shardName || null);
      res.json({
        ok: true,
        service,
        preferredStatusService: result.preferredStatusService,
        serviceRuntime: result.serviceRuntime,
        message: `Status node set to ${service}.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/replicaset/shard", requireUiControl, async (req, res) => {
    const shardName = String(req.body?.shardName || "").trim();
    const progressToken =
      typeof req.body?.progressToken === "string" ? req.body.progressToken.trim() : "";
    if (!shardName) {
      res.status(400).json({ ok: false, error: "shardName is required" });
      return;
    }
    if (!SHARD_NAME_PATTERN.test(shardName)) {
      res.status(400).json({
        ok: false,
        error: "shardName is invalid (allowed: letters, numbers, hyphen, underscore)"
      });
      return;
    }
    try {
      const result = await shardReplicaSet(shardName, { progressToken });
      res.json({
        ok: true,
        ...result
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/container/stop", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      await stopContainer(service);
      res.json({
        ok: true,
        service,
        message: `Container ${service} stopped.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/container/start", requireUiControl, async (req, res) => {
    const service = String(req.body?.service || "").trim();
    if (!service) {
      res.status(400).json({ ok: false, error: "service is required" });
      return;
    }

    try {
      await startContainer(service);
      res.json({
        ok: true,
        service,
        message: `Container ${service} started.`
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
}

module.exports = {
  registerClusterRoutes
};
