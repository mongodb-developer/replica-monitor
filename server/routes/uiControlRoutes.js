const {
  claimControl,
  releaseControl,
  requireUiControl
} = require("../lib/uiControlService");

function registerUiControlRoutes(app) {
  app.post("/api/ui-control/claim", (req, res) => {
    const sessionId = req.body?.sessionId;
    const password = req.body?.password;
    const forceTakeover = Boolean(req.body?.forceTakeover);
    const result = claimControl({
      sessionId,
      password,
      forceTakeover
    });
    if (!result.ok) {
      res.status(result.status).json(result.body);
      return;
    }
    res.json({ ok: true, controllerToken: result.controllerToken });
  });

  app.post("/api/ui-control/release", requireUiControl, (req, res) => {
    const sessionId = String(req.headers["x-session-id"] || "").trim();
    const auth = String(req.headers.authorization || "").trim();
    const match = /^Bearer\s+(.+)$/i.exec(auth);
    const controllerToken = match ? match[1].trim() : "";
    const out = releaseControl({ sessionId, controllerToken });
    if (!out.ok) {
      res.status(out.status).json(out.body);
      return;
    }
    res.json({ ok: true });
  });
}

module.exports = {
  registerUiControlRoutes
};
