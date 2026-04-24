#!/usr/bin/env bash
set -euo pipefail

node - <<'EOF'
const assert = require("assert/strict");
const { registerConfigurationRoutes } = require("./server/routes/configurationRoutes");
const { registerClusterRoutes } = require("./server/routes/clusterRoutes");

function createMockApp() {
  const routes = { GET: new Map(), POST: new Map() };
  return {
    get(path, handler) {
      routes.GET.set(path, handler);
    },
    post(path, ...handlers) {
      routes.POST.set(path, handlers[handlers.length - 1]);
    },
    route(method, path) {
      return routes[String(method || "").toUpperCase()].get(path);
    }
  };
}

function createMockReq(body = {}, params = {}) {
  return { body, params, on() {}, socket: { setTimeout: () => {} } };
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
  const app = createMockApp();
  const calls = [];

  const defaultSettings = {
    location: "ireland",
    dataCenters: [
      { id: "ireland", region: "EMEA" },
      { id: "virginia", region: "AMER" },
      { id: "tokyo", region: "APAC" },
      { id: "sao-paulo", region: "LATAM" }
    ],
    electionTimeoutMs: 10000,
    readPreference: "primary",
    writeConcern: "majority",
    readConcern: "local",
    deploymentProfile: "consolidated"
  };
  const appliedSettings = {
    ...defaultSettings,
    location: "new-york",
    deploymentProfile: "consolidated",
    dataCenters: [
      { id: "new-york", region: "AMER" },
      { id: "dublin", region: "EMEA" },
      { id: "singapore", region: "APAC" },
      { id: "santiago", region: "LATAM" }
    ]
  };
  let runtimeSettings = { ...defaultSettings };

  registerConfigurationRoutes(app, {
    listTemplates: async () => [],
    getTemplateById: async () => {
      throw new Error("not used");
    },
    validateTemplatePayload: async (configuration) => {
      if (configuration?.name === "invalid-template") {
        return { ok: false, errors: ["dataCenters must contain exactly 4 entries"] };
      }
      return { ok: true, errors: [] };
    },
    applyTemplateAndRebuild: async (configuration) => {
      calls.push(["applyTemplateAndRebuild", configuration?.name || "inline"]);
      runtimeSettings = { ...appliedSettings };
      return {
        settings: { ...appliedSettings },
        templateName: configuration?.name || "inline",
        sharded: false,
        requiresShardInitialization: false,
        rebuilt: true
      };
    },
    setLastAppliedTemplateId: async () => {},
    getApplicationServerSettings: async () => ({
      ...runtimeSettings,
      lastAppliedTemplateId: runtimeSettings.lastAppliedTemplateId ?? null
    }),
    buildRuntimeTemplatePayload: async ({ name }) => ({
      version: 1,
      name: name || "t",
      description: "",
      dataCenters: runtimeSettings.dataCenters,
      applicationServerLocation: runtimeSettings.location,
      userLocation: "US",
      electionTimeoutMs: 10000,
      writeConcern: "majority",
      readConcern: "local",
      readPreference: "primary",
      latencies: { intraRegionMs: {}, interRegionMs: {} },
      sharded: false,
      replicaSet: { name: "rs", nodes: [] }
    }),
    writeTemplateFile: async (filename) => filename,
    templateJsonFileExists: async () => false,
    getConfigurationSaveContext: async () => ({
      configurationDeployed: false,
      lastAppliedTemplateId: null,
      lastAppliedTemplateName: null,
      lastAppliedTemplateDescription: null
    }),
    normalizeAppliedTemplateFilename: (id) => (id ? String(id).trim() : null)
  });

  registerClusterRoutes(app, {
    startStack: async () => ({ stdout: "ok" }),
    initReplicaSet: async () => ({ stdout: "ok" }),
    resetRuntimeState: () => {},
    stopStack: async () => {},
    stopApplicationServerWorkload: async () => {},
    clearZonesData: async () => {},
    getZones: async () => ({ zones: [], updatedAt: null }),
    setZones: async (zones) => ({ zones }),
    getCountryOptions: () => [],
    syncZonesToSharding: async () => ({ synced: true }),
    getApplicationServerSettings: async () => runtimeSettings,
    resolveDataCenterRegion: (id, dataCenters) => {
      const match = (dataCenters || []).find((entry) => String(entry.id) === String(id));
      return String(match?.region || "");
    },
    VALID_DATA_CENTERS: ["AMER", "EMEA", "APAC", "LATAM"],
    addReplicaNode: async (name, role, dataCenterRegion, shardName, dataCenter) => {
      calls.push(["addReplicaNode", name, role, dataCenterRegion, shardName, dataCenter]);
      return { createdNewShard: false };
    },
    removeReplicaNode: async () => ({ removed: true }),
    stopMongoDBGraceful: async () => {},
    stopMongoDBHard: async (service) => {
      calls.push(["stopMongoDBHard", service]);
    },
    startMongoDB: async () => {},
    increaseMongoDBPriority: async () => {},
    decreaseMongoDBPriority: async () => {},
    isolateContainerNetwork: async (container) => {
      calls.push(["isolateContainerNetwork", container]);
    },
    connectContainerNetwork: async () => {},
    isolateDataCenterNetwork: async (dataCenterId) => ({
      dataCenterId,
      region: "AMER",
      containers: ["Default_1", "ApplicationServer-amer-seattle-us"],
      networks: ["amer-shared", "amer-new-york-local"]
    }),
    connectDataCenterNetwork: async (dataCenterId) => ({
      dataCenterId,
      region: "AMER",
      containers: ["Default_1", "ApplicationServer-amer-seattle-us"],
      networks: ["amer-shared", "amer-new-york-local"]
    }),
    setPreferredStatusService: async () => ({
      preferredStatusService: "Default_1",
      serviceRuntime: "replica"
    }),
    shardReplicaSet: async (shardName) => ({ shardName, alreadyExists: false }),
    stopContainer: async () => {},
    startContainer: async () => {},
    SHARD_NAME_PATTERN: /^[A-Za-z0-9_-]+$/
  });

  const applyHandler = app.route("POST", "/api/configurations/apply");
  const addNodeHandler = app.route("POST", "/api/replicaset/nodes/add");
  const stopHardHandler = app.route("POST", "/api/mongodb/stop-hard");
  const isolateHandler = app.route("POST", "/api/network/isolate");

  {
    const req = createMockReq({
      configuration: { name: "global-replicaset", sharded: false },
      progressToken: "parity-test-token"
    });
    const res = createMockRes();
    await applyHandler(req, res);
    assert.equal(res.statusCode, 202);
    assert.equal(res.payload?.ok, true);
    assert.equal(res.payload?.accepted, true);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(runtimeSettings.location, "new-york");
    assert.equal(runtimeSettings.deploymentProfile, "consolidated");
    assert.ok(
      calls.some((entry) => entry[0] === "applyTemplateAndRebuild" && entry[1] === "global-replicaset"),
      "Expected full template rebuild orchestration on apply."
    );
  }

  {
    const req = createMockReq({
      name: "Node_X",
      role: "voting",
      dataCenter: "new-york"
    });
    const res = createMockRes();
    await addNodeHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.ok(
      calls.some((entry) => entry[0] === "addReplicaNode" && entry[5] === "new-york"),
      "Expected node add operation to honor template-applied data-center IDs."
    );
  }

  {
    const req = createMockReq({ service: "Default_2" });
    const res = createMockRes();
    await stopHardHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.ok(calls.some((entry) => entry[0] === "stopMongoDBHard"));
  }

  {
    const req = createMockReq({ container: "Default_1" });
    const res = createMockRes();
    await isolateHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.ok(calls.some((entry) => entry[0] === "isolateContainerNetwork"));
  }

  {
    const req = createMockReq({
      configuration: { name: "invalid-template", sharded: false },
      progressToken: "parity-invalid-token"
    });
    const res = createMockRes();
    await applyHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.equal(res.payload?.ok, false);
    assert.ok(Array.isArray(res.payload?.validationErrors));
  }

  console.log("PASS: template apply integration parity validated with topology/failure controls.");
})().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
EOF
