function createMongoContainerControlService(deps) {
  const {
    runCompose,
    runDocker,
    assertValidServiceName,
    doesContainerExist,
    CONFIG_SERVER_CONTAINER_NAME,
    listShardsFromConfigServer,
    resolvePrimaryServiceForReplicaSet,
    resolveCurrentPrimaryService,
    COMPOSE_PROJECT_NAME
  } = deps;

  function buildPriorityReconfigScript(serviceName, delta) {
    const targetHost = `${serviceName}:27017`;
    return `
const targetHost = ${JSON.stringify(targetHost)};
const delta = ${delta};
const config = rs.conf();
const memberIndex = config.members.findIndex((member) => member.host === targetHost);
if (memberIndex === -1) {
  throw new Error("Replica config member not found for host: " + targetHost);
}
const currentPriority = Number(config.members[memberIndex].priority);
if (!Number.isFinite(currentPriority) || !Number.isInteger(currentPriority)) {
  throw new Error("Current priority is not an integer for host: " + targetHost);
}
const nextPriority = currentPriority + delta;
if (!Number.isInteger(nextPriority)) {
  throw new Error("New priority must be an integer.");
}
if (nextPriority < 0) {
  throw new Error("Priority cannot be less than 0.");
}
if (nextPriority > 10) {
  throw new Error("Priority cannot be greater than 10.");
}
config.members[memberIndex].priority = nextPriority;
rs.reconfig(config);
print(JSON.stringify({ host: targetHost, memberIndex, previousPriority: currentPriority, newPriority: nextPriority }));
`.trim();
  }

  async function resolvePrimaryServiceForTargetMember(serviceName) {
    const targetHost = `${serviceName}:27017`;
    if (await doesContainerExist(CONFIG_SERVER_CONTAINER_NAME)) {
      const shards = await listShardsFromConfigServer({ suppressErrors: true });
      const shard = shards.find((entry) => (entry.hosts || []).includes(targetHost));
      if (shard) {
        return resolvePrimaryServiceForReplicaSet(shard.replSetName, shard.hosts || []);
      }
    }
    return resolveCurrentPrimaryService();
  }

  async function stopMongoDBGraceful(serviceName) {
    assertValidServiceName(serviceName);
    return runCompose(["exec", "-T", serviceName, "bash", "-lc", "kill $(pidof mongod)"], 20000);
  }

  async function stopMongoDBHard(serviceName) {
    assertValidServiceName(serviceName);
    return runCompose(["exec", "-T", serviceName, "bash", "-lc", "kill -9 $(pidof mongod)"], 20000);
  }

  async function startMongoDB(serviceName) {
    assertValidServiceName(serviceName);
    return runCompose(
      [
        "exec",
        "-T",
        serviceName,
        "bash",
        "-lc",
        "mongod --config /etc/mongod.conf --fork"
      ],
      20000
    );
  }

  async function stopContainer(serviceName) {
    assertValidServiceName(serviceName);
    return runCompose(["stop", serviceName], 30000);
  }

  async function startContainer(serviceName) {
    assertValidServiceName(serviceName);
    const startedViaCompose = serviceName !== CONFIG_SERVER_CONTAINER_NAME;
    try {
      if (startedViaCompose) {
        return await runCompose(["start", serviceName], 30000);
      }
      return await runDocker(["container", "start", serviceName], 30000);
    } catch (error) {
      const message = String(error?.message || "").toLowerCase();
      if (startedViaCompose || !message.includes("no such service")) {
        throw error;
      }
      const result = await runDocker(["container", "start", serviceName], 30000);
      await runDocker(
        [
          "exec",
          serviceName,
          "bash",
          "-lc",
          "if ! pidof mongod > /dev/null 2>&1; then mongod --config /etc/mongod.conf --fork; fi"
        ],
        30000
      );
      return result;
    }
  }

  async function increaseMongoDBPriority(serviceName) {
    assertValidServiceName(serviceName);
    const primaryService = await resolvePrimaryServiceForTargetMember(serviceName);
    const script = buildPriorityReconfigScript(serviceName, 1);
    return runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      30000
    );
  }

  async function decreaseMongoDBPriority(serviceName) {
    assertValidServiceName(serviceName);
    const primaryService = await resolvePrimaryServiceForTargetMember(serviceName);
    const script = buildPriorityReconfigScript(serviceName, -1);
    return runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      30000
    );
  }

  return {
    stopMongoDBGraceful,
    stopMongoDBHard,
    startMongoDB,
    stopContainer,
    startContainer,
    increaseMongoDBPriority,
    decreaseMongoDBPriority
  };
}

module.exports = {
  createMongoContainerControlService
};
