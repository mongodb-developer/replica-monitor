const fs = require("fs");
const http = require("http");
const https = require("https");
const path = require("path");
const express = require("express");
const {
  startStack,
  stopStack,
  stopStackSync,
  resetRuntimeState,
  initReplicaSet,
  fetchReplicaStatus,
  stopMongoDBGraceful,
  stopMongoDBHard,
  startMongoDB,
  stopContainer,
  startContainer,
  increaseMongoDBPriority,
  decreaseMongoDBPriority,
  addReplicaNode,
  removeReplicaNode,
  isolateContainerNetwork,
  connectContainerNetwork,
  isolateDataCenterNetwork,
  connectDataCenterNetwork,
  shardReplicaSet,
  syncZonesToSharding,
  setPreferredStatusService,
  cleanupGeneratedReplicaInitScripts,
  cleanupGeneratedReplicaInitScriptsSync,
  setLegacyAppMongoUriToDefault,
  setLegacyAppMongoUriToDefaultSync,
  VALID_DATA_CENTERS,
  getApplicationServerLocation,
  updateApplicationServerLocation,
  updateApplicationServerUserLocation,
  applyTemplateAndRebuild
} = require("./lib/compose");
const {
  startApplicationServerWorkload,
  stopApplicationServerWorkload,
  restartApplicationServerWorkload,
  subscribe: subscribeApplicationServerEvents,
  buildSnapshot: getApplicationServerSnapshot
} = require("./lib/applicationServer");
const {
  ELECTION_TIMEOUT_MIN_MS,
  ELECTION_TIMEOUT_MAX_MS,
  VALID_READ_CONCERNS,
  VALID_READ_PREFERENCES,
  parseWriteConcern,
  resolveDataCenterRegion,
  getApplicationServerSettings,
  setApplicationServerSettings,
  setLastAppliedTemplateId,
  getReplicaSetElectionTimeoutMs,
  getApplicationServerUserLocation
} = require("./lib/applicationServerLocation");
const {
  getZones,
  setZones,
  clearZonesData,
  clearZonesDataSync,
  getCountryOptions
} = require("./lib/zones");
const {
  listTemplates,
  getTemplateById,
  validateTemplatePayload,
  buildRuntimeTemplatePayload,
  writeTemplateFile,
  templateJsonFileExists,
  getConfigurationSaveContext,
  normalizeAppliedTemplateFilename
} = require("./lib/templateConfigs");
const { registerStatusRoutes } = require("./routes/statusRoutes");
const { registerUiControlRoutes } = require("./routes/uiControlRoutes");
const { registerApplicationServerRoutes } = require("./routes/applicationServerRoutes");
const { registerConfigurationRoutes } = require("./routes/configurationRoutes");
const { registerClusterRoutes } = require("./routes/clusterRoutes");

const app = express();
const port = process.env.PORT || 3000;
const SSL_KEY_PATH = path.join(__dirname, "../web/certificates/privkey.pem");
const SSL_CERT_PATH = path.join(__dirname, "../web/certificates/fullchain.pem");
const pollIntervalMs = Number(process.env.POLL_INTERVAL_MS || 2000);
const SHARD_NAME_PATTERN = /^[A-Za-z0-9_-]+$/;

app.use(express.json());
registerUiControlRoutes(app);
app.use(express.static(path.resolve(__dirname, "../web")));
app.use("/vendor/leaflet", express.static(path.resolve(__dirname, "../node_modules/leaflet/dist")));
registerStatusRoutes(app, {
  fetchReplicaStatus,
  pollIntervalMs,
  subscribeApplicationServerEvents,
  getApplicationServerSnapshot
});
registerApplicationServerRoutes(app, {
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
});
registerConfigurationRoutes(app, {
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
});
registerClusterRoutes(app, {
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
});

app.get("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../web/index.html"));
});

let server;

async function startServer() {
  try {
    await clearZonesData();
  } catch (error) {
    console.error(`Startup zones cleanup failed: ${error.message}`);
  }
  try {
    await setLegacyAppMongoUriToDefault();
  } catch (error) {
    console.error(`Startup Mongo URI reset failed: ${error.message}`);
  }
  try {
    await cleanupGeneratedReplicaInitScripts();
  } catch (error) {
    console.error(`Startup script cleanup failed: ${error.message}`);
  }

  const keyExists = fs.existsSync(SSL_KEY_PATH);
  const certExists = fs.existsSync(SSL_CERT_PATH);
  if (process.env.USE_TLS === "1" && (!keyExists || !certExists)) {
    throw new Error(
      "USE_TLS=1 requires web/certificates/privkey.pem and web/certificates/fullchain.pem"
    );
  }

  const useTls = process.env.USE_TLS !== "0" && keyExists && certExists;

  if (useTls) {
    server = https.createServer(
      {
        key: fs.readFileSync(SSL_KEY_PATH),
        cert: fs.readFileSync(SSL_CERT_PATH)
      },
      app
    );
  } else {
    if (process.env.USE_TLS !== "0") {
      console.warn(
        "SSL: web/certificates/privkey.pem or fullchain.pem missing; starting HTTP. Set USE_TLS=0 to silence this warning."
      );
    }
    server = http.createServer(app);
  }

  server.listen(port, () => {
    const scheme = useTls ? "https" : "http";
    console.log(`Failover monitor listening on ${scheme}://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error(`Failed to start server: ${error.message}`);
  process.exit(1);
});

let shutdownInProgress = false;
let stackStopStarted = false;
let stackStopCompleted = false;

function markStackStopStarted() {
  stackStopStarted = true;
}

function markStackStopCompleted() {
  stackStopCompleted = true;
}

function ensureStackStoppedSync() {
  if (stackStopCompleted) {
    return;
  }
  const stopped = stopStackSync();
  if (!stopped) {
    console.error("Synchronous Docker stack shutdown did not complete cleanly.");
  }
  setLegacyAppMongoUriToDefaultSync();
  clearZonesDataSync();
  cleanupGeneratedReplicaInitScriptsSync();
  markStackStopCompleted();
}

async function gracefulShutdown(signal) {
  if (shutdownInProgress) {
    return;
  }
  shutdownInProgress = true;

  console.log(`Received ${signal}. Stopping HTTP server and Docker stack...`);

  if (server && typeof server.closeAllConnections === "function") {
    server.closeAllConnections();
  }

  if (!server) {
    try {
      await stopApplicationServerWorkload();
      markStackStopStarted();
      await stopStack();
      markStackStopCompleted();
      await setLegacyAppMongoUriToDefault();
      await clearZonesData();
      await cleanupGeneratedReplicaInitScripts();
    } catch (error) {
      console.error(`Failed to stop Docker stack: ${error.message}`);
      ensureStackStoppedSync();
    } finally {
      process.exit(0);
    }
    return;
  }

  server.close(async () => {
    try {
      await stopApplicationServerWorkload();
      markStackStopStarted();
      await stopStack();
      markStackStopCompleted();
      await setLegacyAppMongoUriToDefault();
      await clearZonesData();
      await cleanupGeneratedReplicaInitScripts();
      console.log("Docker stack stopped.");
    } catch (error) {
      console.error(`Failed to stop Docker stack: ${error.message}`);
      ensureStackStoppedSync();
    } finally {
      process.exit(0);
    }
  });

  setTimeout(() => {
    console.error("Forced shutdown timeout reached. Stopping Docker stack synchronously.");
    if (stackStopStarted && !stackStopCompleted) {
      console.error("Async Docker stack stop did not complete before timeout.");
    }
    ensureStackStoppedSync();
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("exit", () => {
  ensureStackStoppedSync();
});
