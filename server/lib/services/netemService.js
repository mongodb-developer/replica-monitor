const path = require("path");
const fsSync = require("fs");
const fs = require("fs/promises");
const { execFile, spawnSync } = require("child_process");

const DEFAULT_SCRIPT_CANDIDATES = ["netem-multi-network.sh", "natem-multi-networks.sh"];

function createNetemService(options = {}) {
  const projectRoot = options.projectRoot;
  const scriptCandidates = Array.isArray(options.scriptCandidates) && options.scriptCandidates.length
    ? options.scriptCandidates
    : DEFAULT_SCRIPT_CANDIDATES;
  if (!projectRoot) {
    throw new Error("createNetemService requires projectRoot");
  }

  async function resolveScriptPath() {
    for (const candidate of scriptCandidates) {
      const scriptPath = path.resolve(projectRoot, candidate);
      try {
        await fs.access(scriptPath);
        return scriptPath;
      } catch (_error) {
        // Try next candidate.
      }
    }
    return null;
  }

  function resolveScriptPathSync() {
    for (const candidate of scriptCandidates) {
      const scriptPath = path.resolve(projectRoot, candidate);
      if (fsSync.existsSync(scriptPath)) {
        return scriptPath;
      }
    }
    return null;
  }

  async function run(action, options = {}) {
    const strict = options.strict === true;
    const targetContainers = Array.isArray(options.targetContainers)
      ? [...new Set(options.targetContainers.map((n) => String(n || "").trim()).filter(Boolean))]
      : null;
    const scriptPath = await resolveScriptPath();
    if (!scriptPath) {
      const message = `Latency script not found. Expected one of: ${scriptCandidates.join(", ")}`;
      if (strict) {
        throw new Error(message);
      }
      console.warn(message);
      return { ok: false, skipped: true };
    }

    const env = { ...process.env };
    if (targetContainers !== null && targetContainers.length > 0) {
      env.NETEM_TARGET_CONTAINERS = targetContainers.join(",");
    }

    return new Promise((resolve, reject) => {
      execFile(
        "bash",
        [scriptPath, action],
        {
          cwd: projectRoot,
          env,
          timeout: 120000,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, stdout, stderr) => {
          if (error) {
            const scriptError = new Error(
              `Latency script failed for action "${action}": ${stderr || error.message}`.trim()
            );
            if (strict) {
              reject(scriptError);
              return;
            }
            console.warn(scriptError.message);
            resolve({ ok: false, skipped: false, stdout, stderr });
            return;
          }
          resolve({ ok: true, skipped: false, stdout, stderr });
        }
      );
    });
  }

  function runSync(action) {
    const scriptPath = resolveScriptPathSync();
    if (!scriptPath) {
      return false;
    }
    const result = spawnSync("bash", [scriptPath, action], {
      cwd: projectRoot,
      stdio: "ignore"
    });
    return result.status === 0;
  }

  return {
    run,
    runSync
  };
}

module.exports = {
  createNetemService
};
