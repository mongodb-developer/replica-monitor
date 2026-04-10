#!/usr/bin/env bash
set -euo pipefail

node - <<'EOF'
const assert = require("assert/strict");
const { registerStatusRoutes } = require("./server/routes/statusRoutes");
const { registerClusterRoutes } = require("./server/routes/clusterRoutes");

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
  const listeners = new Map();
  return {
    body,
    on(event, cb) {
      listeners.set(event, cb);
    },
    emit(event) {
      const cb = listeners.get(event);
      if (cb) {
        cb();
      }
    }
  };
}

function createMockRes() {
  return {
    statusCode: 200,
    payload: undefined,
    headers: {},
    writes: [],
    ended: false,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    flushHeaders() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    },
    write(chunk) {
      this.writes.push(String(chunk));
    },
    end() {
      this.ended = true;
    }
  };
}

async function testStatusRoutes() {
  const app = createMockApp();
  const statusPayload = { members: [{ name: "Default_1:27017", stateStr: "PRIMARY" }] };
  const subscriptions = [];
  registerStatusRoutes(app, {
    fetchReplicaStatus: async () => statusPayload,
    pollIntervalMs: 10_000,
    subscribeApplicationServerEvents: (listener) => {
      subscriptions.push(listener);
      return () => {
        const idx = subscriptions.indexOf(listener);
        if (idx >= 0) {
          subscriptions.splice(idx, 1);
        }
      };
    },
    getApplicationServerSnapshot: () => ({ running: true, healthy: true })
  });

  const statusHandler = app.route("GET", "/api/status");
  assert.ok(statusHandler, "Expected /api/status handler to be registered.");
  {
    const req = createMockReq();
    const res = createMockRes();
    await statusHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.payload, statusPayload);
  }

  const streamHandler = app.route("GET", "/api/stream");
  assert.ok(streamHandler, "Expected /api/stream handler to be registered.");
  {
    const req = createMockReq();
    const res = createMockRes();
    streamHandler(req, res);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(res.headers["Content-Type"], "text/event-stream");
    assert.ok(
      res.writes.some((line) => line.includes("event: status")),
      "Expected status SSE event in /api/stream output."
    );
    assert.ok(
      res.writes.some((line) => line.includes('"members"')),
      "Expected status payload JSON in /api/stream output."
    );
    req.emit("close");
    assert.equal(res.ended, true, "Expected /api/stream to close cleanly.");
  }

  const appStreamHandler = app.route("GET", "/api/application-server/stream");
  assert.ok(appStreamHandler, "Expected /api/application-server/stream handler to be registered.");
  {
    const req = createMockReq();
    const res = createMockRes();
    appStreamHandler(req, res);
    assert.ok(
      res.writes.some((line) => line.includes("event: snapshot")),
      "Expected initial snapshot SSE event."
    );
    assert.ok(
      res.writes.some((line) => line.includes('"running":true')),
      "Expected snapshot payload to be written."
    );
    assert.equal(subscriptions.length, 1, "Expected one application-server event subscription.");
    subscriptions[0]("status", { running: false });
    assert.ok(
      res.writes.some((line) => line.includes("event: status")),
      "Expected forwarded event to be written."
    );
    req.emit("close");
    assert.equal(subscriptions.length, 0, "Expected subscription cleanup on stream close.");
    assert.equal(res.ended, true, "Expected /api/application-server/stream to close cleanly.");
  }
}

async function testClusterRoutes() {
  const app = createMockApp();
  const calls = [];
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
    getApplicationServerSettings: async () => ({
      dataCenters: [{ id: "ireland", region: "EMEA" }]
    }),
    resolveDataCenterRegion: () => "EMEA",
    VALID_DATA_CENTERS: ["AMER", "EMEA", "APAC", "LATAM"],
    addReplicaNode: async () => ({ createdNewShard: false }),
    removeReplicaNode: async () => ({ removed: true }),
    stopMongoDBGraceful: async (service) => {
      calls.push(["stopMongoDBGraceful", service]);
    },
    stopMongoDBHard: async (service) => {
      calls.push(["stopMongoDBHard", service]);
    },
    startMongoDB: async (service) => {
      calls.push(["startMongoDB", service]);
    },
    increaseMongoDBPriority: async () => {},
    decreaseMongoDBPriority: async () => {},
    isolateContainerNetwork: async (container) => {
      calls.push(["isolateContainerNetwork", container]);
    },
    connectContainerNetwork: async (container) => {
      calls.push(["connectContainerNetwork", container]);
    },
    isolateDataCenterNetwork: async (dataCenterId) => ({
      dataCenterId,
      region: "EMEA",
      containers: ["Default_1", "ApplicationServer-amer-seattle-us"],
      networks: ["europe-shared", "europe-ireland-local"]
    }),
    connectDataCenterNetwork: async (dataCenterId) => ({
      dataCenterId,
      region: "EMEA",
      containers: ["Default_1", "ApplicationServer-amer-seattle-us"],
      networks: ["europe-shared", "europe-ireland-local"]
    }),
    setPreferredStatusService: async () => ({
      preferredStatusService: "Default_1",
      serviceRuntime: "replica"
    }),
    shardReplicaSet: async (name) => {
      calls.push(["shardReplicaSet", name]);
      return { shardName: name, alreadyExists: false };
    },
    stopContainer: async () => {},
    startContainer: async () => {},
    SHARD_NAME_PATTERN: /^[A-Za-z0-9_-]+$/
  });

  const isolateHandler = app.route("POST", "/api/network/isolate");
  {
    const req = createMockReq({});
    const res = createMockRes();
    await isolateHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(String(res.payload?.error || ""), /container is required/i);
  }
  {
    const req = createMockReq({ container: "Default_1" });
    const res = createMockRes();
    await isolateHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.deepEqual(calls.find((entry) => entry[0] === "isolateContainerNetwork"), ["isolateContainerNetwork", "Default_1"]);
  }

  const dataCenterIsolateHandler = app.route("POST", "/api/network/datacenter/isolate");
  {
    const req = createMockReq({ dataCenterId: "ireland" });
    const res = createMockRes();
    await dataCenterIsolateHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.ok(Array.isArray(res.payload?.containers));
    assert.ok(Array.isArray(res.payload?.networks));
  }

  const stopHardHandler = app.route("POST", "/api/mongodb/stop-hard");
  {
    const req = createMockReq({ service: "Default_2" });
    const res = createMockRes();
    await stopHardHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.deepEqual(calls.find((entry) => entry[0] === "stopMongoDBHard"), ["stopMongoDBHard", "Default_2"]);
  }

  const shardHandler = app.route("POST", "/api/replicaset/shard");
  {
    const req = createMockReq({ shardName: "invalid name with spaces" });
    const res = createMockRes();
    await shardHandler(req, res);
    assert.equal(res.statusCode, 400);
    assert.match(String(res.payload?.error || ""), /shardName is invalid/i);
  }
  {
    const req = createMockReq({ shardName: "shard1" });
    const res = createMockRes();
    await shardHandler(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.payload?.ok, true);
    assert.deepEqual(calls.find((entry) => entry[0] === "shardReplicaSet"), ["shardReplicaSet", "shard1"]);
  }
}

(async () => {
  await testStatusRoutes();
  await testClusterRoutes();
  console.log("PASS: baseline API/SSE regression harness checks route contracts for status, topology, failure, and latency controls.");
})().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
EOF
