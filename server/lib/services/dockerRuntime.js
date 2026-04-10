const { execFile } = require("child_process");

const DEFAULT_TIMEOUT_MS = 30000;
const DEFAULT_MAX_BUFFER = 1024 * 1024 * 4;

function createDockerRuntime(options = {}) {
  const projectRoot = options.projectRoot;
  const defaultTimeoutMs = Number(options.defaultTimeoutMs || DEFAULT_TIMEOUT_MS);
  if (!projectRoot) {
    throw new Error("createDockerRuntime requires projectRoot");
  }

  function runCompose(args, timeoutMs = defaultTimeoutMs) {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        ["compose", ...args],
        {
          cwd: projectRoot,
          timeout: timeoutMs,
          maxBuffer: DEFAULT_MAX_BUFFER
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`docker compose ${args.join(" ")} failed: ${stderr || error.message}`.trim()));
            return;
          }
          resolve({ stdout, stderr });
        }
      );
    });
  }

  function runDocker(args, timeoutMs = defaultTimeoutMs) {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        args,
        {
          cwd: projectRoot,
          timeout: timeoutMs,
          maxBuffer: DEFAULT_MAX_BUFFER
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`docker ${args.join(" ")} failed: ${stderr || error.message}`.trim()));
            return;
          }
          resolve({ stdout, stderr });
        }
      );
    });
  }

  return {
    runCompose,
    runDocker
  };
}

module.exports = {
  createDockerRuntime
};
