const deploymentProgressHub = require("../lib/deploymentProgressHub");
const { getUiControlSnapshot } = require("../lib/uiControlService");

function registerStatusRoutes(app, deps) {
  const {
    fetchReplicaStatus,
    pollIntervalMs,
    subscribeApplicationServerEvents,
    getApplicationServerSnapshot
  } = deps;

  function mergeUiControl(status) {
    return {
      ...status,
      uiControl: getUiControlSnapshot()
    };
  }

  app.get("/api/status", async (_req, res) => {
    try {
      const status = await fetchReplicaStatus();
      res.json(mergeUiControl(status));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let stopped = false;

    const sendEvent = async () => {
      if (stopped) {
        return;
      }
      try {
        const status = await fetchReplicaStatus();
        res.write("event: status\n");
        res.write(`data: ${JSON.stringify(mergeUiControl(status))}\n\n`);
      } catch (error) {
        res.write("event: error\n");
        res.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
      }
    };

    sendEvent();
    const timer = setInterval(sendEvent, pollIntervalMs);

    req.on("close", () => {
      stopped = true;
      clearInterval(timer);
      res.end();
    });
  });

  app.get("/api/application-server/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    res.write("event: snapshot\n");
    res.write(`data: ${JSON.stringify(getApplicationServerSnapshot())}\n\n`);

    const unsubscribe = subscribeApplicationServerEvents((event, data) => {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    });

    req.on("close", () => {
      unsubscribe();
      res.end();
    });
  });

  app.get("/api/deployment-progress/stream", (req, res) => {
    const token = String(req.query.token || "").trim();
    if (!token) {
      res.status(400).send("token query parameter is required");
      return;
    }
    const ok = deploymentProgressHub.subscribe(token, res, req);
    if (!ok) {
      res.status(400).send("invalid token");
    }
  });
}

module.exports = {
  registerStatusRoutes
};
