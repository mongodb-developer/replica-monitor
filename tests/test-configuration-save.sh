#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

node - <<'EOF'
const assert = require("assert/strict");
const { registerConfigurationRoutes } = require("./server/routes/configurationRoutes");
const { resolveSafeTemplateFilename } = require("./server/lib/templateConfigs");

function createMockApp() {
  const routes = { GET: new Map(), POST: new Map() };
  return {
    get(path, handler) {
      routes.GET.set(path, handler);
    },
    post(path, handler) {
      routes.POST.set(path, handler);
    },
    route(method, path) {
      return routes[String(method || "").toUpperCase()].get(path);
    }
  };
}

function createMockReq(body = {}) {
  return { body, params: {}, on() {}, socket: { setTimeout: () => {} } };
}

function createMockRes() {
  return {
    statusCode: 200,
    payload: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };
}

(async () => {
  assert.throws(() => resolveSafeTemplateFilename("../x.json"), /invalid/);
  assert.throws(() => resolveSafeTemplateFilename("bad file.json"), /invalid/);

  const app = createMockApp();
  const calls = [];
  let saveSettings = { lastAppliedTemplateId: null };

  registerConfigurationRoutes(app, {
    listTemplates: async () => [],
    getTemplateById: async () => ({}),
    validateTemplatePayload: async () => ({ ok: true, errors: [] }),
    applyTemplateAndRebuild: async () => ({}),
    setLastAppliedTemplateId: async (id) => {
      calls.push(["setLastAppliedTemplateId", id]);
      saveSettings.lastAppliedTemplateId = id;
    },
    getApplicationServerSettings: async () => saveSettings,
    buildRuntimeTemplatePayload: async ({ name }) => {
      if (!String(name || "").trim()) {
        throw new Error("Template name is required");
      }
      return { version: 1, name, description: "", sharded: false };
    },
    writeTemplateFile: async (filename, _obj) => {
      calls.push(["writeTemplateFile", filename]);
      return filename;
    },
    templateJsonFileExists: async () => true,
    getConfigurationSaveContext: async () => ({
      configurationDeployed: Boolean(saveSettings.lastAppliedTemplateId),
      lastAppliedTemplateId: saveSettings.lastAppliedTemplateId,
      lastAppliedTemplateName: null,
      lastAppliedTemplateDescription: null
    }),
    normalizeAppliedTemplateFilename: (id) => (id ? String(id).trim() : null)
  });

  const saveHandler = app.route("POST", "/api/configurations/save");

  {
    const req = createMockReq({ mode: "overwrite", name: "N", description: "D" });
    const res = createMockRes();
    await saveHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.payload?.ok, false);
  }

  saveSettings.lastAppliedTemplateId = "my-template.json";
  {
    const req = createMockReq({ mode: "overwrite", name: "N", description: "D" });
    const res = createMockRes();
    await saveHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.ok(calls.some((c) => c[0] === "writeTemplateFile" && c[1] === "my-template.json"));
  }

  {
    const req = createMockReq({ mode: "saveAs", filename: "new.json", name: "N2", description: "" });
    const res = createMockRes();
    await saveHandler(req, res);
    assert.equal(res.statusCode, 409);
    assert.equal(res.payload?.ok, false);
  }

  {
    const req = createMockReq({
      mode: "saveAs",
      filename: "new.json",
      name: "N2",
      description: ""
    });
    const res = createMockRes();
    const app2 = createMockApp();
    registerConfigurationRoutes(app2, {
      listTemplates: async () => [],
      getTemplateById: async () => ({}),
      validateTemplatePayload: async () => ({ ok: true, errors: [] }),
      applyTemplateAndRebuild: async () => ({}),
      setLastAppliedTemplateId: async (id) => {
        saveSettings.lastAppliedTemplateId = id;
      },
      getApplicationServerSettings: async () => saveSettings,
      buildRuntimeTemplatePayload: async ({ name }) => ({
        version: 1,
        name,
        description: "",
        sharded: false
      }),
      writeTemplateFile: async (fn) => fn,
      templateJsonFileExists: async () => false,
      getConfigurationSaveContext: async () => ({
        configurationDeployed: false,
        lastAppliedTemplateId: null,
        lastAppliedTemplateName: null,
        lastAppliedTemplateDescription: null
      }),
      normalizeAppliedTemplateFilename: (id) => (id ? String(id).trim() : null)
    });
    const saveHandler2 = app2.route("POST", "/api/configurations/save");
    await saveHandler2(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.filename, "new.json");
  }

  {
    const app3 = createMockApp();
    registerConfigurationRoutes(app3, {
      listTemplates: async () => [],
      getTemplateById: async () => ({}),
      validateTemplatePayload: async () => ({ ok: true, errors: [] }),
      applyTemplateAndRebuild: async () => ({}),
      setLastAppliedTemplateId: async () => {},
      getApplicationServerSettings: async () => ({ lastAppliedTemplateId: "a.json" }),
      buildRuntimeTemplatePayload: async () => ({}),
      writeTemplateFile: async () => "a.json",
      templateJsonFileExists: async () => false,
      getConfigurationSaveContext: async () => ({
        configurationDeployed: true,
        lastAppliedTemplateId: "a.json",
        lastAppliedTemplateName: "A Name",
        lastAppliedTemplateDescription: "Saved desc"
      }),
      normalizeAppliedTemplateFilename: (id) => (id ? String(id).trim() : null)
    });
    const ctxHandler = app3.route("GET", "/api/configurations/save-context");
    const res = createMockRes();
    await ctxHandler({}, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.configurationDeployed, true);
    assert.equal(res.payload?.lastAppliedTemplateId, "a.json");
    assert.equal(res.payload?.lastAppliedTemplateName, "A Name");
    assert.equal(res.payload?.lastAppliedTemplateDescription, "Saved desc");
  }

  console.log("PASS: configuration save routes and filename validation.");
})().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
EOF
