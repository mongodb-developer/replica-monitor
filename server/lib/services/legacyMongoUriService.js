function createLegacyMongoUriService(deps) {
  const {
    fs,
    fsSync,
    legacyAppScriptPath,
    getLegacyAppDefaultMongoUri,
    configServerMongoUri,
    defaultStatusQueryServices,
    configServerContainerName,
    doesContainerExist,
    listShardsFromConfigServer,
    fetchReplicaStatus,
    isApplicationServerWorkloadRunning,
    stopApplicationServerWorkload,
    startApplicationServerWorkload
  } = deps;

  function getReplicaSetNameFromDefaultUri() {
    try {
      const uri = getLegacyAppDefaultMongoUri();
      const match = String(uri).match(/replicaSet=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : "mongodb-repl-set";
    } catch (_e) {
      return "mongodb-repl-set";
    }
  }

  async function resolveVotingReplicaHosts() {
    const defaultHosts = defaultStatusQueryServices.map((serviceName) => `${serviceName}:27017`);
    const replicaSetName = getReplicaSetNameFromDefaultUri();
    try {
      if (await doesContainerExist(configServerContainerName)) {
        const shards = await listShardsFromConfigServer({ suppressErrors: true });
        const primaryShard = shards.find((shard) => shard.replSetName === replicaSetName);
        if (primaryShard?.hosts?.length) {
          return [...new Set(primaryShard.hosts)];
        }
      }
      const status = await fetchReplicaStatus();
      const votingMembers = (status.members || []).filter((member) => Number(member.votes ?? 1) > 0);
      const votingHosts = [...new Set(
        votingMembers
          .map((member) => String(member.name || "").trim())
          .filter(Boolean)
      )];
      return votingHosts.length ? votingHosts : defaultHosts;
    } catch (_error) {
      return defaultHosts;
    }
  }

  function buildReplicaSetMongoUri(hosts) {
    return `mongodb://${hosts.join(",")}/?authSource=admin&replicaSet=${getReplicaSetNameFromDefaultUri()}`;
  }

  async function writeLegacyAppMongoUri(uri) {
    let stats;
    try {
      stats = await fs.lstat(legacyAppScriptPath);
    } catch (error) {
      if (error && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
    if (!stats.isFile()) {
      return;
    }
    const fileContents = await fs.readFile(legacyAppScriptPath, "utf8");
    const updatedContents = fileContents.replace(
      /const uri\s*=\s*"mongodb:\/\/[^"]*";/,
      `const uri =\n  "${String(uri).trim()}";`
    );
    if (updatedContents !== fileContents) {
      await fs.writeFile(legacyAppScriptPath, updatedContents, "utf8");
    }
  }

  function writeLegacyAppMongoUriSync(uri) {
    let stats;
    try {
      stats = fsSync.lstatSync(legacyAppScriptPath);
    } catch (error) {
      if (error && error.code === "ENOENT") {
        return;
      }
      throw error;
    }
    if (!stats.isFile()) {
      return;
    }
    const fileContents = fsSync.readFileSync(legacyAppScriptPath, "utf8");
    const updatedContents = fileContents.replace(
      /const uri\s*=\s*"mongodb:\/\/[^"]*";/,
      `const uri =\n  "${String(uri).trim()}";`
    );
    if (updatedContents !== fileContents) {
      fsSync.writeFileSync(legacyAppScriptPath, updatedContents, "utf8");
    }
  }

  async function setLegacyAppMongoUriToDefault() {
    await writeLegacyAppMongoUri(getLegacyAppDefaultMongoUri());
  }

  function setLegacyAppMongoUriToDefaultSync() {
    try {
      writeLegacyAppMongoUriSync(getLegacyAppDefaultMongoUri());
      return true;
    } catch (_error) {
      return false;
    }
  }

  async function setLegacyAppMongoUriToConfigServer() {
    await writeLegacyAppMongoUri(configServerMongoUri);
  }

  async function syncLegacyAppMongoUri() {
    if (await doesContainerExist(configServerContainerName)) { //GCR - why is this set to 'ConfigServer' instead of 'ApplicationServer'?
      await setLegacyAppMongoUriToConfigServer();
      return;
    }
    const votingHosts = await resolveVotingReplicaHosts();
    await writeLegacyAppMongoUri(buildReplicaSetMongoUri(votingHosts));
  }

  async function refreshWorkloadMongoConnectivity(options = {}) {
    const restartWhenRunning = options.restartWhenRunning === true;
    await syncLegacyAppMongoUri();
    if (restartWhenRunning && isApplicationServerWorkloadRunning()) {
      await stopApplicationServerWorkload();
      await startApplicationServerWorkload();
      return { workloadRestarted: true };
    }
    return { workloadRestarted: false };
  }

  return {
    setLegacyAppMongoUriToDefault,
    setLegacyAppMongoUriToDefaultSync,
    syncLegacyAppMongoUri,
    refreshWorkloadMongoConnectivity
  };
}

module.exports = {
  createLegacyMongoUriService
};
