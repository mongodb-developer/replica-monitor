function createScriptCleanupService(deps) {
  const { path, fs, fsSync, scriptsDir, allowedLocalScriptFiles } = deps;

  async function cleanupGeneratedReplicaInitScripts() {
    let entries = [];
    try {
      entries = await fs.readdir(scriptsDir, { withFileTypes: true });
    } catch (error) {
      if (error && error.code === "ENOENT") {
        return { removed: [] };
      }
      throw error;
    }

    const removed = [];
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      if (allowedLocalScriptFiles.has(entry.name)) {
        continue;
      }
      const filePath = path.join(scriptsDir, entry.name);
      await fs.rm(filePath, { force: true });
      removed.push(entry.name);
    }
    return { removed };
  }

  function cleanupGeneratedReplicaInitScriptsSync() {
    let entries = [];
    try {
      entries = fsSync.readdirSync(scriptsDir, { withFileTypes: true });
    } catch (error) {
      if (error && error.code === "ENOENT") {
        return true;
      }
      return false;
    }

    let allOk = true;
    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }
      if (allowedLocalScriptFiles.has(entry.name)) {
        continue;
      }
      const filePath = path.join(scriptsDir, entry.name);
      try {
        fsSync.rmSync(filePath, { force: true });
      } catch (_error) {
        allOk = false;
      }
    }
    return allOk;
  }

  return {
    cleanupGeneratedReplicaInitScripts,
    cleanupGeneratedReplicaInitScriptsSync
  };
}

module.exports = {
  createScriptCleanupService
};
