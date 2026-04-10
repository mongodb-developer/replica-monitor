const fs = require("fs");
const path = require("path");
const { buildComposeDownArgs, COMPOSE_GENERATED_FILE } = require("../composeFileArgs");

function createStackLifecycleService(deps) {
  const {
    resetNetworkIpAllocations,
    runCompose,
    waitForServiceRunning,
    listApplicationServerServiceNames,
    COMPOSE_UP_TIMEOUT_MS,
    APPLICATION_SERVER_START_TIMEOUT_MS,
    runNetemLatencyScript,
    syncLegacyAppMongoUri,
    ensureApplicationServerLocationApplied,
    getApplicationServerSettings,
    normalizeDataCenter,
    ensureDefaultDataCenterTagsOnPrimary,
    syncDataCenterHostsEntries,
    refreshNetworkIpAllocationsFromDocker,
    runNetemLatencyScriptSync,
    spawnSync,
    PROJECT_ROOT,
    collectReplicaNodesFromSettings,
    writeGeneratedComposeFile,
    removeGeneratedComposeFile,
    ensureComposeRegionalNetworks
  } = deps;

  async function startStack(options = {}) {
    const templateApplyRebuild = options.templateApplyRebuild === true;
    const locationOptions = templateApplyRebuild
      ? { skipElectionTimeoutAndNetemApply: true }
      : {};
    const settings = await getApplicationServerSettings();
    const topologyCheck = collectReplicaNodesFromSettings(settings);
    if (topologyCheck.error) {
      throw new Error(topologyCheck.error);
    }
    await writeGeneratedComposeFile(settings);
    await ensureComposeRegionalNetworks();
    await resetNetworkIpAllocations();
    const result = await runCompose(["up", "-d"], COMPOSE_UP_TIMEOUT_MS); //GCR - Most time spent here - check compose file to see if any optimizations are possible
    const appServerNames = listApplicationServerServiceNames(settings);
    await Promise.all(
      appServerNames.map((svc) => waitForServiceRunning(svc, APPLICATION_SERVER_START_TIMEOUT_MS))
    );
    await runNetemLatencyScript("init", { strict: true });
    await syncLegacyAppMongoUri(); //GCR This points the workload app to the mongos router on 'ConfigServer' - why not the ApplicationServer?
    await ensureApplicationServerLocationApplied(locationOptions); //GCR - check this - a bit slow.
    const initialDataCenterEntry = settings?.dataCenters?.[0] || null;
    const initialDataCenter = normalizeDataCenter(initialDataCenterEntry?.region); //GCR - this is using the old 4 region fixed data centers i.e. AMER, EMEA, LATAM, APAC
    await ensureDefaultDataCenterTagsOnPrimary(initialDataCenter);
    await syncDataCenterHostsEntries(); //GCR - check this is only called once
    await refreshNetworkIpAllocationsFromDocker(); //GCR - check this is only called once
    return result;
  }

  async function stopStack() {
    // Best-effort: when the stack was never started or helpers/targets are gone, netem scripts exit
    // non-zero (e.g. netem-helper missing). Do not fail teardown or block template apply.
    let latencyClearError = null;
    try {
      await runNetemLatencyScript("clear", { strict: false });
    } catch (error) {
      latencyClearError = error;
    }

    let latencyCleanupError = null;
    try {
      await runNetemLatencyScript("cleanup", { strict: false });
    } catch (error) {
      latencyCleanupError = error;
    }

    let stackDownError = null;
    try {
      await runCompose(["down", "--remove-orphans"], 120000);
    } catch (error) {
      stackDownError = error;
    }

    const failures = [];
    if (latencyClearError) {
      failures.push(`Latency clear failed: ${latencyClearError.message}`);
    }
    if (latencyCleanupError) {
      failures.push(`Latency helper cleanup failed: ${latencyCleanupError.message}`);
    }
    if (stackDownError) {
      failures.push(`Docker stack down failed: ${stackDownError.message}`);
    }
    if (failures.length) {
      throw new Error(failures.join("; "));
    }

    try {
      await removeGeneratedComposeFile();
    } catch (_e) {
      // non-fatal
    }

    return { stdout: "", stderr: "" };
  }

  function stopStackSync() {
    const latencyClearOk = runNetemLatencyScriptSync("clear");
    const latencyCleanupOk = runNetemLatencyScriptSync("cleanup");
    const stopResult = spawnSync("docker", ["compose", ...buildComposeDownArgs(PROJECT_ROOT)], {
      cwd: PROJECT_ROOT,
      stdio: "ignore"
    });
    try {
      const genPath = path.join(PROJECT_ROOT, COMPOSE_GENERATED_FILE);
      if (fs.existsSync(genPath)) {
        fs.unlinkSync(genPath);
      }
    } catch (_e) {
      // non-fatal
    }
    return stopResult.status === 0 && latencyClearOk && latencyCleanupOk;
  }

  return {
    startStack,
    stopStack,
    stopStackSync
  };
}

module.exports = {
  createStackLifecycleService
};
