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
    let inflight = false;

    const sendEvent = async () => {
      if (stopped || inflight) {
        return;
      }
      inflight = true;
      try {
        const status = await fetchReplicaStatus();
        if (stopped || res.writableEnded) {
          return;
        }
        res.write("event: status\n");
        res.write(`data: ${JSON.stringify(mergeUiControl(status))}\n\n`);
      } catch (error) {
        if (stopped || res.writableEnded) {
          return;
        }
        res.write("event: error\n");
        res.write(`data: ${JSON.stringify({ message: error.message })}\n\n`);
      } finally {
        inflight = false;
      }
    };

    sendEvent();
    const pollTimer = setInterval(sendEvent, pollIntervalMs);
    const keepAliveTimer = setInterval(() => {
      if (stopped || res.writableEnded) {
        return;
      }
      try {
        res.write(": keepalive\n\n");
      } catch (_err) {
        // socket gone; req.on("close") will tidy up
      }
    }, 5000);

    req.on("close", () => {
      stopped = true;
      clearInterval(pollTimer);
      clearInterval(keepAliveTimer);
      res.end();
    });
  });

  app.get("/api/application-server/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let streamClosed = false;

    res.write("event: snapshot\n");
    res.write(`data: ${JSON.stringify(getApplicationServerSnapshot())}\n\n`);

    const unsubscribe = subscribeApplicationServerEvents((event, data) => {
      if (streamClosed || res.writableEnded) {
        return;
      }
      try {
        res.write(`event: ${event}\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      } catch (_err) {
        // client disconnected; cleanup will run on close
      }
    });

    const keepAliveTimer = setInterval(() => {
      if (streamClosed || res.writableEnded) {
        return;
      }
      try {
        res.write(": keepalive\n\n");
      } catch (_err) {
        // ignore
      }
    }, 5000);

    req.on("close", () => {
      streamClosed = true;
      clearInterval(keepAliveTimer);
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

  app.get("/api/deployment-progress/status", (req, res) => {
    const token = String(req.query.token || "").trim();
    if (!token) {
      res.status(400).json({ ok: false, error: "token query parameter is required" });
      return;
    }
    const snapshot = deploymentProgressHub.getDeploymentProgressStatus(token);
    res.json({ ok: true, ...snapshot });
  });
}

module.exports = {
  registerStatusRoutes
};
