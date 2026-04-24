const { markConfigurationApplySucceeded } = require("../lib/configurationSessionState");
const deploymentProgressHub = require("../lib/deploymentProgressHub");
const { requireUiControl } = require("../lib/uiControlService");

function registerConfigurationRoutes(app, deps) {
  const {
    listTemplates,
    getTemplateById,
    validateTemplatePayload,
    applyTemplateAndRebuild,
    setLastAppliedTemplateId,
    getApplicationServerSettings,
    buildRuntimeTemplatePayload,
    writeTemplateFile,
    templateJsonFileExists,
    getConfigurationSaveContext,
    normalizeAppliedTemplateFilename
  } = deps;

  app.get("/api/configurations", async (_req, res) => {
    try {
      const configurations = await listTemplates();
      res.json({
        ok: true,
        configurations
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/configurations/save-context", async (_req, res) => {
    try {
      const saveContext = await getConfigurationSaveContext();
      res.json({
        ok: true,
        ...saveContext
      });
    } catch (error) {
      res.status(500).json({ ok: false, error: error.message });
    }
  });

  app.get("/api/configurations/:id", async (req, res) => {
    try {
      const configuration = await getTemplateById(req.params.id);
      res.json({
        ok: true,
        configuration
      });
    } catch (error) {
      const msg = String(error?.message || "");
      const isInputError =
        msg.includes("templateId") || msg.includes("template filename is invalid") || msg.includes("Invalid template");
      res.status(isInputError ? 400 : 500).json({ ok: false, error: error.message });
    }
  });

  app.post("/api/configurations/validate", requireUiControl, async (req, res) => {
    const configuration = req.body?.configuration;
    const result = await validateTemplatePayload(configuration);
    if (!result.ok) {
      res.status(400).json({
        ok: false,
        errors: result.errors
      });
      return;
    }
    res.json({ ok: true });
  });

  app.post("/api/configurations/apply", requireUiControl, async (req, res) => {
    const { configurationId, configuration, progressToken } = req.body || {};
    const token = typeof progressToken === "string" ? progressToken.trim() : "";
    try {
      if (!token) {
        res.status(400).json({ ok: false, error: "progressToken is required" });
        return;
      }
      let selectedConfiguration = configuration;
      if (configurationId) {
        selectedConfiguration = await getTemplateById(configurationId);
      }
      if (!selectedConfiguration) {
        res.status(400).json({ ok: false, error: "configuration or configurationId is required" });
        return;
      }
      const validation = await validateTemplatePayload(selectedConfiguration);
      if (!validation.ok) {
        res.status(400).json({
          ok: false,
          error: `Template validation failed:\n- ${validation.errors.join("\n- ")}`,
          validationErrors: validation.errors
        });
        return;
      }

      deploymentProgressHub.markDeploymentInFlight(token);
      res.status(202).json({
        ok: true,
        accepted: true,
        progressToken: token
      });

      void (async () => {
        try {
          const result = await applyTemplateAndRebuild(selectedConfiguration, {
            progressToken: token,
            suppressProgressComplete: true
          });
          if (result === null) {
            return;
          }
          markConfigurationApplySucceeded();
          const appliedId = configurationId ? normalizeAppliedTemplateFilename(configurationId) : null;
          await setLastAppliedTemplateId(appliedId);
          deploymentProgressHub.emitComplete(token, {
            ok: true,
            ...result,
            lastAppliedTemplateId: appliedId
          });
        } catch (error) {
          const validationErrors = Array.isArray(error?.validationErrors) ? error.validationErrors : undefined;
          deploymentProgressHub.emitFatal(token, error.message, validationErrors);
        }
      })();
    } catch (error) {
      const validationErrors = Array.isArray(error?.validationErrors) ? error.validationErrors : null;
      res.status(validationErrors ? 400 : 500).json({
        ok: false,
        error: error.message,
        validationErrors
      });
    }
  });

  app.post("/api/configurations/save", requireUiControl, async (req, res) => {
    const { mode, filename, name, description } = req.body || {};
    try {
      const template = await buildRuntimeTemplatePayload({ name, description });
      if (mode === "overwrite") {
        const settings = await getApplicationServerSettings();
        const targetId = settings.lastAppliedTemplateId;
        if (!targetId) {
          res.status(400).json({
            ok: false,
            error: "No template file to overwrite (apply a configuration from a saved template file first)"
          });
          return;
        }
        const written = await writeTemplateFile(targetId, template);
        await setLastAppliedTemplateId(written);
        res.json({ ok: true, filename: written });
        return;
      }
      if (mode === "saveAs") {
        const rawName = String(filename || "").trim();
        if (!rawName) {
          res.status(400).json({ ok: false, error: "filename is required for save as" });
          return;
        }
        const exists = await templateJsonFileExists(rawName);
        if (exists) {
          res.status(409).json({
            ok: false,
            error: "A template with that filename already exists; choose a different name"
          });
          return;
        }
        const written = await writeTemplateFile(rawName, template);
        await setLastAppliedTemplateId(written);
        res.json({ ok: true, filename: written });
        return;
      }
      res.status(400).json({ ok: false, error: 'mode must be "overwrite" or "saveAs"' });
    } catch (error) {
      const validationErrors = Array.isArray(error?.validationErrors) ? error.validationErrors : null;
      const msg = String(error?.message || "");
      const isBadInput =
        msg.includes("invalid") ||
        msg.includes("required") ||
        msg.includes("Cannot save") ||
        validationErrors;
      res.status(isBadInput ? 400 : 500).json({
        ok: false,
        error: error.message,
        validationErrors
      });
    }
  });
}

module.exports = {
  registerConfigurationRoutes
};
