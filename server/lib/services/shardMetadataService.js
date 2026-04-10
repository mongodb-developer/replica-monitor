function createShardMetadataService(deps) {
  const {
    runCompose,
    runDocker,
    COMPOSE_PROJECT_NAME,
    resolveConfigServerContainerName,
    parseJsonPayload,
    parseShardHostDescriptor,
    memberNameToService,
    queryStatusFromService,
    assertValidServiceName
  } = deps;

  async function runConfigServerMongosEval(script, timeoutMs = 30000) {
    const configServerContainerName = await resolveConfigServerContainerName();
    return runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        configServerContainerName,
        "mongosh",
        "mongodb://localhost:27017",
        "--quiet",
        "--eval",
        script
      ],
      timeoutMs
    );
  }

  async function doesContainerExist(containerName) {
    assertValidServiceName(containerName);
    try {
      await runDocker(["container", "inspect", containerName], 8000);
      return true;
    } catch (error) {
      const message = String(error.message || "").toLowerCase();
      if (message.includes("no such container") || message.includes("not found")) {
        return false;
      }
      throw error;
    }
  }

  async function listShardsFromConfigServer(options = {}) {
    const suppressErrors = options.suppressErrors === true;
    const configServerContainerName = await resolveConfigServerContainerName();
    if (!(await doesContainerExist(configServerContainerName))) {
      return [];
    }
    try {
      const { stdout } = await runConfigServerMongosEval(
        `const result = db.adminCommand({ listShards: 1 });
if (!result || result.ok !== 1) {
  throw new Error("listShards failed");
}
print(JSON.stringify({ shards: result.shards || [] }));`,
        10000
      );
      const payload = parseJsonPayload(stdout, "listShards");
      return (payload.shards || []).map((shard) => {
        const shardName = String(shard._id || "").trim();
        const hostDescriptor = String(shard.host || "").trim();
        const { replSetName, hosts } = parseShardHostDescriptor(hostDescriptor);
        const tags = Array.isArray(shard.tags)
          ? shard.tags.map((entry) => String(entry || "").trim()).filter(Boolean)
          : [];
        return { shardName, replSetName: replSetName || shardName, hosts, tags };
      });
    } catch (error) {
      if (suppressErrors) {
        return [];
      }
      throw error;
    }
  }

  async function resolveShardByHostFromConfigServer() {
    const shardByHost = new Map();
    const shards = await listShardsFromConfigServer({ suppressErrors: true });
    for (const shard of shards) {
      for (const host of shard.hosts) {
        shardByHost.set(host, shard.shardName || null);
      }
    }
    return shardByHost;
  }

  async function resolveShardTarget(shardName) {
    const normalized = String(shardName || "").trim();
    if (!normalized) {
      return null;
    }
    const shards = await listShardsFromConfigServer();
    return shards.find((shard) => shard.shardName === normalized) || null;
  }

  async function resolveReplicaSetNameFromService(serviceName) {
    const script = `
const cfg = rs.conf();
print(JSON.stringify({ replSetName: String(cfg._id || "") }));
`.trim();
    const { stdout } = await runCompose(
      ["exec", "-T", serviceName, "mongosh", "--quiet", "--eval", script],
      15000
    );
    const payload = parseJsonPayload(stdout, "replica set name");
    return String(payload.replSetName || "").trim();
  }

  async function resolvePrimaryServiceForReplicaSet(replSetName, memberHosts = []) {
    const services = [...new Set(memberHosts.map((host) => memberNameToService(host)).filter(Boolean))];
    for (const serviceName of services) {
      try {
        const status = await queryStatusFromService(serviceName);
        const primaryService = memberNameToService(status.primaryName);
        if (!primaryService) {
          continue;
        }
        const primarySetName = await resolveReplicaSetNameFromService(primaryService);
        if (primarySetName === replSetName) {
          return primaryService;
        }
      } catch (_error) {
        // Try next service.
      }
    }
    throw new Error(`Unable to resolve primary for replica set ${replSetName}.`);
  }

  return {
    runConfigServerMongosEval,
    doesContainerExist,
    listShardsFromConfigServer,
    resolveShardByHostFromConfigServer,
    resolveShardTarget,
    resolveReplicaSetNameFromService,
    resolvePrimaryServiceForReplicaSet
  };
}

module.exports = {
  createShardMetadataService
};
