const MAX_ELECTION_TIMEOUT_APPLY_ATTEMPTS = 12;
const ELECTION_TIMEOUT_RETRY_MS = 2000;

function isWritablePrimaryElectionError(message) {
  const m = String(message || "").toLowerCase();
  return (
    m.includes("secondary") ||
    m.includes("not master") ||
    m.includes("not writer") ||
    m.includes("not primary") ||
    m.includes("not writable") ||
    (m.includes("replsetreconfig") && m.includes("primary"))
  );
}

function createElectionTimeoutService(deps) {
  const {
    normalizeElectionTimeoutMs,
    listShardsFromConfigServer,
    resolvePrimaryServiceForReplicaSet,
    resolveCurrentPrimaryService,
    runCompose,
    getReplicaSetElectionTimeoutMs,
    getDefaultReplicaSetName,
    getApplicationServerSettings,
    sleep
  } = deps;

  async function delay(ms) {
    if (typeof sleep === "function") {
      await sleep(ms);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  function buildReplicaSetElectionTimeoutScript(electionTimeoutMs) {
    return `
config = rs.conf();
config.settings = config.settings || {};
config.settings.electionTimeoutMillis = ${Number(electionTimeoutMs)};
rs.reconfig(config);
`.trim();
  }

  async function buildTargetsFromPersistedTopology(suppressErrors) {
    const targets = [];
    let settings;
    try {
      settings = await getApplicationServerSettings();
    } catch (error) {
      if (!suppressErrors) {
        throw error;
      }
      return targets;
    }
    const topo = settings?.templateTopology;
    if (!topo) {
      try {
        const primaryService = await resolveCurrentPrimaryService();
        targets.push({
          shardName: null,
          replicaSetName: getDefaultReplicaSetName(),
          primaryService,
          memberHosts: []
        });
      } catch (error) {
        if (!suppressErrors) {
          throw error;
        }
      }
      return targets;
    }
    if (topo.sharded && Array.isArray(topo.shards)) {
      for (const shard of topo.shards) {
        const replSetName = String(shard?.name || "").trim();
        if (!replSetName) {
          continue;
        }
        const hosts = (shard.nodes || [])
          .map((node) => `${String(node?.name || "").trim()}:27017`)
          .filter((host) => host !== ":27017");
        try {
          const primaryService = await resolvePrimaryServiceForReplicaSet(replSetName, hosts);
          targets.push({
            shardName: replSetName,
            replicaSetName: replSetName,
            primaryService,
            memberHosts: hosts
          });
        } catch (error) {
          if (!suppressErrors) {
            throw error;
          }
        }
      }
      return targets;
    }
    try {
      const primaryService = await resolveCurrentPrimaryService();
      targets.push({
        shardName: null,
        replicaSetName: getDefaultReplicaSetName(),
        primaryService,
        memberHosts: []
      });
    } catch (error) {
      if (!suppressErrors) {
        throw error;
      }
    }
    return targets;
  }

  async function applyReplicaSetElectionTimeout(electionTimeoutMs, options = {}) {
    const timeoutValue = normalizeElectionTimeoutMs(electionTimeoutMs);
    const suppressErrors = options.suppressErrors === true;
    const targets = [];
    const shardsFromMongos = await listShardsFromConfigServer({ suppressErrors: true });
    if (shardsFromMongos.length > 0) {
      for (const shard of shardsFromMongos) {
        try {
          const primaryService = await resolvePrimaryServiceForReplicaSet(
            shard.replSetName,
            shard.hosts || []
          );
          targets.push({
            shardName: shard.shardName || null,
            replicaSetName: shard.replSetName || shard.shardName || "unknown",
            primaryService,
            memberHosts: shard.hosts || []
          });
        } catch (error) {
          if (!suppressErrors) {
            throw error;
          }
        }
      }
    } else {
      const fromTopology = await buildTargetsFromPersistedTopology(suppressErrors);
      for (const entry of fromTopology) {
        targets.push(entry);
      }
    }
    const errors = [];
    const appliedReplicaSets = [];
    const script = buildReplicaSetElectionTimeoutScript(timeoutValue);
    const maxAttempts = suppressErrors ? 1 : MAX_ELECTION_TIMEOUT_APPLY_ATTEMPTS;

    async function resolvePrimaryForElectionTarget(target) {
      const hosts = target.memberHosts || [];
      if (hosts.length > 0) {
        return resolvePrimaryServiceForReplicaSet(target.replicaSetName, hosts);
      }
      return resolveCurrentPrimaryService();
    }

    async function applyElectionTimeoutToTarget(target) {
      let lastPrimaryService = target.primaryService;
      let succeeded = false;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
          lastPrimaryService = await resolvePrimaryForElectionTarget(target);
          await runCompose(
            ["exec", "-T", lastPrimaryService, "mongosh", "--quiet", "--eval", script],
            30000
          );
          succeeded = true;
          break;
        } catch (error) {
          if (suppressErrors) {
            break;
          }
          const retryable =
            attempt < maxAttempts - 1 && isWritablePrimaryElectionError(error.message);
          if (retryable) {
            await delay(ELECTION_TIMEOUT_RETRY_MS);
            continue;
          }
          return {
            type: "error",
            message: `${target.replicaSetName}@${lastPrimaryService}: ${error.message}`
          };
        }
      }
      if (succeeded) {
        return {
          type: "applied",
          entry: {
            shardName: target.shardName,
            replicaSetName: target.replicaSetName,
            primaryService: lastPrimaryService
          }
        };
      }
      return { type: "skipped" };
    }

    const targetResults = await Promise.all(targets.map((target) => applyElectionTimeoutToTarget(target)));
    for (const result of targetResults) {
      if (result.type === "applied") {
        appliedReplicaSets.push(result.entry);
      } else if (result.type === "error") {
        errors.push(result.message);
      }
    }
    if (errors.length) {
      throw new Error(`Failed to apply replica-set election timeout: ${errors.join(" | ")}`);
    }
    return {
      electionTimeoutMs: timeoutValue,
      appliedReplicaSets
    };
  }

  async function applyPersistedReplicaSetElectionTimeout(options = {}) {
    const electionTimeoutMs = await getReplicaSetElectionTimeoutMs();
    return applyReplicaSetElectionTimeout(electionTimeoutMs, options);
  }

  return {
    applyReplicaSetElectionTimeout,
    applyPersistedReplicaSetElectionTimeout
  };
}

module.exports = {
  createElectionTimeoutService
};
