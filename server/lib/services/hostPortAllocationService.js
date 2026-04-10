function createHostPortAllocationService(deps) {
  const { execFile, net, PROJECT_ROOT, COMPOSE_TIMEOUT_MS } = deps;

  async function getUsedDockerHostPorts() {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        ["ps", "--format", "{{.Ports}}"],
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(new Error(`docker ps failed: ${stderr || error.message}`.trim()));
            return;
          }
          const usedPorts = new Set();
          const lines = String(stdout || "")
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);
          for (const line of lines) {
            const matches = [...line.matchAll(/:(\d+)->/g)];
            for (const match of matches) {
              usedPorts.add(Number(match[1]));
            }
          }
          resolve(usedPorts);
        }
      );
    });
  }

  async function isPortAvailable(port) {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.unref();
      server.on("error", () => {
        resolve(false);
      });
      server.listen({ port, host: "0.0.0.0" }, () => {
        server.close(() => resolve(true));
      });
    });
  }

  async function findFirstAvailableHostPort(startPort = 27004) {
    const usedDockerPorts = await getUsedDockerHostPorts();
    let port = startPort;
    while (port <= 65535) {
      if (!usedDockerPorts.has(port) && (await isPortAvailable(port))) {
        return port;
      }
      port += 1;
    }
    throw new Error("Unable to allocate an available host port.");
  }

  return {
    findFirstAvailableHostPort
  };
}

module.exports = {
  createHostPortAllocationService
};
