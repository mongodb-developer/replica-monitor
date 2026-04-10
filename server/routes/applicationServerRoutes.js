const { requireUiControl } = require("../lib/uiControlService");

function registerApplicationServerRoutes(app, deps) {
  const {
    startApplicationServerWorkload,
    stopApplicationServerWorkload,
    restartApplicationServerWorkload,
    getApplicationServerLocation,
    getReplicaSetElectionTimeoutMs,
    getApplicationServerUserLocation,
    getApplicationServerSettings,
    updateApplicationServerUserLocation,
    updateApplicationServerLocation,
    getCountryOptions,
    parseWriteConcern,
    ELECTION_TIMEOUT_MIN_MS,
    ELECTION_TIMEOUT_MAX_MS,
    VALID_READ_CONCERNS,
    VALID_READ_PREFERENCES
  } = deps;

  app.post("/api/application-server/start", requireUiControl, async (_req, res) => {
    try {
      const result = await startApplicationServerWorkload();
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/application-server/stop", requireUiControl, async (_req, res) => {
    try {
      const result = await stopApplicationServerWorkload();
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/application-server/restart", requireUiControl, async (_req, res) => {
    try {
      const result = await restartApplicationServerWorkload();
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/application-server/location", async (_req, res) => {
    try {
      const location = await getApplicationServerLocation();
      const electionTimeoutMs = await getReplicaSetElectionTimeoutMs();
      const userLocation = await getApplicationServerUserLocation();
      const {
        writeConcern,
        readConcern,
        readPreference,
        deploymentProfile,
        topologyShowShardLabels,
        dataCenters
      } = await getApplicationServerSettings();
      res.json({
        ok: true,
        location,
        electionTimeoutMs,
        userLocation,
        dataCenters,
        writeConcern,
        readConcern,
        readPreference,
        deploymentProfile,
        topologyShowShardLabels
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/application-server/user-location", requireUiControl, async (req, res) => {
    const userLocation = String(req.body?.userLocation || "")
      .trim()
      .toUpperCase();
    const validCountryCodes = new Set(getCountryOptions().map((entry) => String(entry.code)));
    if (!validCountryCodes.has(userLocation)) {
      res.status(400).json({
        ok: false,
        error: "userLocation must be a valid ISO 3166-1 alpha-2 country code"
      });
      return;
    }
    try {
      const result = await updateApplicationServerUserLocation(userLocation);
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/application-server/location", requireUiControl, async (req, res) => {
    const location = String(req.body?.location || "").trim().toLowerCase();
    const electionTimeoutRaw = req.body?.electionTimeoutMs;
    const electionTimeoutMs = Number.parseInt(String(electionTimeoutRaw || ""), 10);
    const writeConcern = parseWriteConcern(req.body?.writeConcern);
    const readConcern = String(req.body?.readConcern || "").trim();
    const readPreference = String(req.body?.readPreference || "").trim();
    let topologyShowShardLabels;
    if (Object.prototype.hasOwnProperty.call(req.body || {}, "topologyShowShardLabels")) {
      const raw = req.body.topologyShowShardLabels;
      if (raw === true || raw === "true" || raw === 1) {
        topologyShowShardLabels = true;
      } else if (raw === false || raw === "false" || raw === 0) {
        topologyShowShardLabels = false;
      } else {
        res.status(400).json({
          ok: false,
          error: "topologyShowShardLabels must be a boolean"
        });
        return;
      }
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
    if (!validLocationIds.has(location)) {
      res.status(400).json({
        ok: false,
        error: `location must be one of configured data center IDs: ${[...validLocationIds].join(", ")}`
      });
      return;
    }
    if (
      !Number.isInteger(electionTimeoutMs) ||
      electionTimeoutMs < ELECTION_TIMEOUT_MIN_MS ||
      electionTimeoutMs > ELECTION_TIMEOUT_MAX_MS
    ) {
      res.status(400).json({
        ok: false,
        error: `electionTimeoutMs must be an integer from ${ELECTION_TIMEOUT_MIN_MS} to ${ELECTION_TIMEOUT_MAX_MS}`
      });
      return;
    }
    if (writeConcern === null) {
      res.status(400).json({
        ok: false,
        error: "writeConcern must be 'majority' or a non-negative integer"
      });
      return;
    }
    if (!VALID_READ_CONCERNS.includes(readConcern)) {
      res.status(400).json({
        ok: false,
        error: `readConcern must be one of: ${VALID_READ_CONCERNS.join(", ")}`
      });
      return;
    }
    if (!VALID_READ_PREFERENCES.includes(readPreference)) {
      res.status(400).json({
        ok: false,
        error: `readPreference must be one of: ${VALID_READ_PREFERENCES.join(", ")}`
      });
      return;
    }
    try {
      const result = await updateApplicationServerLocation(location, electionTimeoutMs, {
        writeConcern,
        readConcern,
        readPreference,
        ...(topologyShowShardLabels === undefined ? {} : { topologyShowShardLabels })
      });
      res.json({ ok: true, ...result });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });
}

module.exports = {
  registerApplicationServerRoutes
};
