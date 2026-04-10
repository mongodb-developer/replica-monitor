/**
 * All replica service names from persisted sharded template topology (every shard's nodes).
 * Used so configureShardServerMongodConfigs can enable shardsvr on every node before listShards is populated.
 */
function collectReplicaServiceNamesFromShardedTopology(settings) {
  const topo = settings?.templateTopology;
  if (!topo?.sharded || !Array.isArray(topo.shards)) {
    return [];
  }
  const names = new Set();
  for (const shard of topo.shards) {
    for (const n of shard?.nodes || []) {
      const name = String(n?.name || "").trim();
      if (name) {
        names.add(name);
      }
    }
  }
  return [...names];
}

const {
  APPLICATION_SERVER_MESH_NETWORK_NAME,
  listApplicationServerServiceNames,
  getPrimaryApplicationServerServiceName
} = require("../applicationServerNaming");

function createConfigServerSetupService(deps) {
  const {
    runCompose,
    COMPOSE_PROJECT_NAME,
    sleep,
    fetchReplicaStatus,
    memberNameToService,
    checkMongodRunning,
    escapeSingleQuotes,
    getApplicationServerSettings,
    inspectContainerNetworkIp,
    isApplicationServerComposeServiceName
  } = deps;

  async function configurePrimaryConfigReplicaAndMongos(primaryServiceName) {
    const configSetupTimeoutMs = 30000;
    const mongodReadyWaitSeconds = 90;
    await runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        primaryServiceName,
        "bash",
        "-lc",
        "set -e && sed -i 's/^[[:space:]]*port:[[:space:]]*27017[[:space:]]*$/  port: 27019/' /etc/mongod.conf && sed -i 's/^[[:space:]]*bindIp:[[:space:]]*127\\.0\\.0\\.1[^[:space:]]*[[:space:]]*$/  bindIp: 0.0.0.0/' /etc/mongod.conf && sed -i 's/^[[:space:]]*replSetName:[[:space:]]*mongodb-repl-set[[:space:]]*$/  replSetName: config-repl-set/' /etc/mongod.conf && if ! grep -q '^sharding:' /etc/mongod.conf; then printf '\\nsharding:\\n  clusterRole: configsvr\\n' >> /etc/mongod.conf; fi"
      ],
      configSetupTimeoutMs
    );

    await runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        primaryServiceName,
        "bash",
        "-lc",
        "cat > /etc/mongos.conf <<'EOF'\nsharding:\n  configDB: config-repl-set/localhost:27019\nnet:\n  bindIp: 0.0.0.0\n#security:\n#  keyFile: /var/mongodb/pki/mongodb-keyfile\n#processManagement:\n#  fork: true  # fork and run in background\n# where to write logging data.\nsystemLog:\n  destination: file\n  logAppend: true\n  path: /var/log/mongodb/mongos.log\nEOF"
      ],
      configSetupTimeoutMs
    );

    await runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        primaryServiceName,
        "bash",
        "-lc",
        "if ! pidof mongod > /dev/null 2>&1; then mongod --config /etc/mongod.conf --fork; fi"
      ],
      configSetupTimeoutMs
    );

    let mongodReady = false;
    for (let attempt = 1; attempt <= mongodReadyWaitSeconds; attempt += 1) {
      try {
        await runCompose(
          [
            "-p",
            COMPOSE_PROJECT_NAME,
            "exec",
            "-T",
            primaryServiceName,
            "bash",
            "-lc",
            "pidof mongod > /dev/null 2>&1"
          ],
          5000
        );
        mongodReady = true;
        break;
      } catch (_error) {
        await sleep(1000);
      }
    }
    if (!mongodReady) {
      throw new Error(`ConfigServer mongod process did not become available in time (${mongodReadyWaitSeconds}s).`);
    }

    const esc = escapeSingleQuotes(primaryServiceName);
    await runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        primaryServiceName,
        "mongosh",
        "mongodb://localhost:27019",
        "--eval",
        `try { rs.status(); } catch (e) { rs.initiate({_id: "config-repl-set", version: 1, members: [{ _id: 0, host: "${primaryServiceName}:27019"}]}); }`
      ],
      configSetupTimeoutMs
    );
  }

  async function resolvePrimaryMeshIp(primaryServiceName) {
    for (let attempt = 1; attempt <= 30; attempt += 1) {
      const ip = await inspectContainerNetworkIp(primaryServiceName, APPLICATION_SERVER_MESH_NETWORK_NAME);
      if (ip && String(ip).trim()) {
        return String(ip).trim();
      }
      await sleep(1000);
    }
    throw new Error(
      `Unable to resolve ${primaryServiceName} IPv4 on ${APPLICATION_SERVER_MESH_NETWORK_NAME} for secondary mongos configDB.`
    );
  }

  async function configureSecondaryMongos(secondaryServiceName, primaryMeshIp) {
    const configSetupTimeoutMs = 30000;
    const escIp = escapeSingleQuotes(primaryMeshIp);
    await runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        secondaryServiceName,
        "bash",
        "-lc",
        `cat > /etc/mongos.conf <<'EOF'
sharding:
  configDB: config-repl-set/${primaryMeshIp}:27019
net:
  bindIp: 0.0.0.0
systemLog:
  destination: file
  logAppend: true
  path: /var/log/mongodb/mongos.log
EOF`
      ],
      configSetupTimeoutMs
    );
    await runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        secondaryServiceName,
        "bash",
        "-lc",
        "set +e; (pkill mongos || true); for i in $(seq 1 15); do if ! pidof mongos > /dev/null 2>&1; then break; fi; sleep 1; done; mongos --config /etc/mongos.conf --fork"
      ],
      configSetupTimeoutMs
    );
  }

  async function configureConfigServerMongodConfig() { //GCR - This  sets up the config mongod on the first app server, then configures the mongos on the other app servers to point to it.
    const settings = await getApplicationServerSettings();
    const primary = getPrimaryApplicationServerServiceName(settings);
    if (!primary) {
      throw new Error("Unable to resolve primary ApplicationServer for config replica set.");
    }
    const allAs = listApplicationServerServiceNames(settings);
    await configurePrimaryConfigReplicaAndMongos(primary);
    const primaryMeshIp = await resolvePrimaryMeshIp(primary);
    const secondaries = allAs.filter((svc) => svc !== primary);
    await Promise.all(secondaries.map((svc) => configureSecondaryMongos(svc, primaryMeshIp)));
  }

  async function configureShardServerMongodConfigs() {
    const status = await fetchReplicaStatus();
    const fromStatus = [...new Set(
      (status.members || [])
        .map((member) => memberNameToService(member.name))
        .filter(
          (serviceName) =>
            Boolean(serviceName) &&
            !isApplicationServerComposeServiceName(serviceName)
        )
    )];

    let fromTemplate = [];
    if (typeof getApplicationServerSettings === "function") {
      try {
        const settings = await getApplicationServerSettings();
        fromTemplate = collectReplicaServiceNamesFromShardedTopology(settings);
      } catch (_error) {
        fromTemplate = [];
      }
    }

    const shardServices = [...new Set([...fromStatus, ...fromTemplate])].filter(
      (serviceName) => Boolean(serviceName) && !isApplicationServerComposeServiceName(serviceName)
    );

    await Promise.all(
      shardServices.map(async (serviceName) => {
        await runCompose(
          [
            "-p",
            COMPOSE_PROJECT_NAME,
            "exec",
            "-T",
            serviceName,
            "bash",
            "-lc",
            "if ! grep -q '^sharding:' /etc/mongod.conf; then printf '\\nsharding:\\n  clusterRole: shardsvr\\n' >> /etc/mongod.conf; fi"
          ],
          30000
        );
        await runCompose(
          [
            "-p",
            COMPOSE_PROJECT_NAME,
            "exec",
            "-T",
            serviceName,
            "bash",
            "-lc",
            "set +e; (pkill mongod || true); stopped=0; for _ in $(seq 1 30); do if ! pidof mongod > /dev/null 2>&1; then stopped=1; break; fi; sleep 1; done; [ \"$stopped\" -eq 1 ] || exit 1; mongod --config /etc/mongod.conf --fork; ready=0; for _ in $(seq 1 30); do mongosh --quiet --eval 'db.runCommand({ ping: 1 })' > /dev/null 2>&1 && ready=1 && break; sleep 1; done; [ \"$ready\" -eq 1 ] || exit 1"
          ],
          30000
        );
      })
    );
  }

  async function waitForMongodRunning(serviceName, timeoutMs = 30000) {
    const startedAt = Date.now();
    while (Date.now() - startedAt < timeoutMs) {
      if (await checkMongodRunning(serviceName)) {
        return;
      }
      await sleep(1000);
    }
    throw new Error(`Timed out waiting for MongoDB to be ready on ${serviceName}.`);
  }

  async function waitForReplicaMemberHealthy(serviceName, timeoutMs = 60000, pollIntervalMs = 1000) {
    const startedAt = Date.now();
    const targetName = `${serviceName}:27017`;
    while (Date.now() - startedAt < timeoutMs) {
      try {
        const status = await fetchReplicaStatus();
        const member = (status.members || []).find((entry) => String(entry?.name || "").trim() === targetName);
        if (member) {
          const state = String(member.stateStr || "").trim().toUpperCase();
          const healthy = Number(member.health) === 1;
          if ((state === "SECONDARY" || state === "PRIMARY") && healthy) {
            return { ready: true, state, health: Number(member.health) };
          }
        }
      } catch (_error) {
        // Keep polling while replica status converges.
      }
      await sleep(pollIntervalMs);
    }
    throw new Error(
      `Timed out waiting for ${serviceName} to report healthy PRIMARY/SECONDARY replica state (${timeoutMs}ms).`
    );
  }

  async function configureNewShardNodeMongodConfig(serviceName, replicaSetName) {
    const escapedReplicaSetName = escapeSingleQuotes(replicaSetName);
    await runCompose(
      [
        "exec",
        "-T",
        serviceName,
        "bash",
        "-lc",
        `set -e
if grep -q '^[[:space:]]*replSetName:' /etc/mongod.conf; then
  sed -i 's/^[[:space:]]*replSetName:[[:space:]]*.*$/  replSetName: ${escapedReplicaSetName}/' /etc/mongod.conf
else
  printf '\\nreplication:\\n  replSetName: ${escapedReplicaSetName}\\n' >> /etc/mongod.conf
fi
if ! grep -q '^sharding:' /etc/mongod.conf; then
  printf '\\nsharding:\\n  clusterRole: shardsvr\\n' >> /etc/mongod.conf
fi`
      ],
      30000
    );
  }

  async function restartMongodForConfigUpdate(serviceName) {
    await runCompose(
      [
        "exec",
        "-T",
        serviceName,
        "bash",
        "-lc",
        "set +e; (pkill mongod || true); stopped=0; for _ in $(seq 1 30); do if ! pidof mongod > /dev/null 2>&1; then stopped=1; break; fi; sleep 1; done; [ \"$stopped\" -eq 1 ] || exit 1; mongod --config /etc/mongod.conf --fork; ready=0; for _ in $(seq 1 30); do mongosh --quiet --eval 'db.runCommand({ ping: 1 })' > /dev/null 2>&1 && ready=1 && break; sleep 1; done; [ \"$ready\" -eq 1 ] || exit 1"
      ],
      30000
    );
  }

  return {
    configureConfigServerMongodConfig,
    configureShardServerMongodConfigs,
    waitForMongodRunning,
    waitForReplicaMemberHealthy,
    configureNewShardNodeMongodConfig,
    restartMongodForConfigUpdate
  };
}

module.exports = {
  createConfigServerSetupService,
  collectReplicaServiceNamesFromShardedTopology
};
