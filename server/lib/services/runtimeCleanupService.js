function createRuntimeCleanupService(deps) {
  const {
    assertValidServiceName,
    execFile,
    PROJECT_ROOT,
    COMPOSE_TIMEOUT_MS,
    runCompose,
    parseJsonPayload,
    spawnSync,
    configServerContainerName,
    runtimeAddedReplicaServices,
    trackedReplicaServices,
    isolatedContainers,
    resolveCurrentPrimaryService,
    resolveCurrentPrimaryServiceSync,
    doesContainerExist,
    listShardsFromConfigServer,
    resolvePrimaryServiceForReplicaSet
  } = deps;

  async function resolvePrimaryServiceForTargetMember(serviceName) {
    const targetHost = `${serviceName}:27017`;
    if (await doesContainerExist(configServerContainerName)) {
      const shards = await listShardsFromConfigServer({ suppressErrors: true });
      const shard = shards.find((entry) => (entry.hosts || []).includes(targetHost));
      if (shard) {
        return resolvePrimaryServiceForReplicaSet(shard.replSetName, shard.hosts || []);
      }
    }
    return resolveCurrentPrimaryService();
  }

  async function removeContainer(containerName) {
    assertValidServiceName(containerName);
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        ["rm", "-f", containerName],
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(
              new Error(`docker rm -f ${containerName} failed: ${stderr || error.message}`.trim())
            );
            return;
          }
          resolve({ stdout, stderr });
        }
      );
    });
  }

  function buildReplicaRemoveScript(serviceName, options = {}) {
    const enforceVotingFloor = options.enforceVotingFloor !== false;
    const allowMissing = options.allowMissing === true;
    const host = `${serviceName}:27017`;
    return `
const host = ${JSON.stringify(host)};
const cfg = rs.conf();
const member = cfg.members.find((entry) => entry.host === host);
const exists = Boolean(member);
if (!exists) {
  ${allowMissing ? 'print(JSON.stringify({ host, removed: false, reason: "missing" }));' : 'throw new Error("Replica set does not contain host: " + host);'}
} else {
  const votingCount = cfg.members.filter((entry) => Number(entry.votes ?? 1) > 0).length;
  const isVotingMember = Number(member.votes ?? 1) > 0;
  if (${enforceVotingFloor ? "true" : "false"} && isVotingMember && votingCount <= 1) {
    throw new Error("Cannot remove voting node: replica set must keep at least one voting member.");
  }
  rs.remove(host);
  print(JSON.stringify({ host, removed: true, wasVoting: isVotingMember, votingCountBefore: votingCount }));
}
`.trim();
  }

  async function removeReplicaMemberFromSet(primaryService, serviceName, options = {}) {
    const script = buildReplicaRemoveScript(serviceName, options);
    const { stdout } = await runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      30000
    );
    return parseJsonPayload(stdout, `replica remove ${serviceName}`);
  }

  function removeReplicaMemberFromSetSync(primaryService, serviceName, options = {}) {
    const script = buildReplicaRemoveScript(serviceName, options);
    const result = spawnSync(
      "docker",
      ["compose", "exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      { cwd: PROJECT_ROOT, encoding: "utf8" }
    );
    if (result.status !== 0) {
      throw new Error((result.stderr || "").trim() || `rs.remove failed for ${serviceName}`);
    }
    parseJsonPayload(result.stdout || "", `replica remove ${serviceName}`);
  }

  async function cleanupRuntimeReplicaContainers() {
    const failures = [];
    let primaryService = null;
    if (runtimeAddedReplicaServices.size > 0) {
      try {
        primaryService = await resolveCurrentPrimaryService();
      } catch (error) {
        failures.push(`primary resolution failed: ${error.message}`);
      }
    }

    for (const serviceName of [...runtimeAddedReplicaServices]) {
      try {
        if (primaryService) {
          await removeReplicaMemberFromSet(primaryService, serviceName, { allowMissing: true });
        }
        await removeContainer(serviceName);
        runtimeAddedReplicaServices.delete(serviceName);
        trackedReplicaServices.delete(serviceName);
        isolatedContainers.delete(serviceName);
      } catch (error) {
        failures.push(`${serviceName}: ${error.message}`);
      }
    }

    if (failures.length) {
      throw new Error(`Failed to remove runtime-added containers: ${failures.join(" | ")}`);
    }
  }

  async function cleanupConfigServerContainer() {
    if (!(await doesContainerExist(configServerContainerName))) {
      return false;
    }
    await removeContainer(configServerContainerName);
    return true;
  }

  function cleanupRuntimeReplicaContainersSync() {
    let allOk = true;
    let primaryService = null;
    if (runtimeAddedReplicaServices.size > 0) {
      try {
        primaryService = resolveCurrentPrimaryServiceSync();
      } catch (_error) {
        allOk = false;
      }
    }
    for (const serviceName of [...runtimeAddedReplicaServices]) {
      if (primaryService) {
        try {
          removeReplicaMemberFromSetSync(primaryService, serviceName, { allowMissing: true });
        } catch (_error) {
          allOk = false;
        }
      } else {
        allOk = false;
      }
      const result = spawnSync("docker", ["rm", "-f", serviceName], {
        cwd: PROJECT_ROOT,
        stdio: "ignore"
      });
      if (result.status !== 0) {
        allOk = false;
        continue;
      }
      runtimeAddedReplicaServices.delete(serviceName);
      trackedReplicaServices.delete(serviceName);
      isolatedContainers.delete(serviceName);
    }
    return allOk;
  }

  function cleanupConfigServerContainerSync() {
    const inspectResult = spawnSync("docker", ["container", "inspect", configServerContainerName], {
      cwd: PROJECT_ROOT,
      encoding: "utf8"
    });
    if (inspectResult.status !== 0) {
      const text = `${inspectResult.stderr || ""}${inspectResult.stdout || ""}`.toLowerCase();
      if (text.includes("no such container")) {
        return true;
      }
      return false;
    }

    const removeResult = spawnSync("docker", ["rm", "-f", configServerContainerName], {
      cwd: PROJECT_ROOT,
      stdio: "ignore"
    });
    return removeResult.status === 0;
  }

  return {
    resolvePrimaryServiceForTargetMember,
    removeContainer,
    removeReplicaMemberFromSet,
    cleanupRuntimeReplicaContainers,
    cleanupConfigServerContainer,
    cleanupRuntimeReplicaContainersSync,
    cleanupConfigServerContainerSync
  };
}

module.exports = {
  createRuntimeCleanupService
};
