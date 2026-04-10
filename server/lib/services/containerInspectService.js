function createContainerInspectService(deps) {
  const { execFile, runDocker, PROJECT_ROOT, COMPOSE_TIMEOUT_MS } = deps;

  async function inspectContainerNetworkIp(containerName, networkName) {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        [
          "inspect",
          "-f",
          `{{with index .NetworkSettings.Networks "${networkName}"}}{{.IPAddress}}{{end}}`,
          containerName
        ],
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, stdout, stderr) => {
          if (error) {
            reject(
              new Error(
                `docker inspect ip for ${containerName} on ${networkName} failed: ${stderr || error.message}`.trim()
              )
            );
            return;
          }
          resolve(String(stdout || "").trim());
        }
      );
    });
  }

  async function getContainerAttachedNetworks(containerName) {
    const { stdout } = await runDocker(["inspect", containerName], 10000);
    const payload = JSON.parse(String(stdout || "[]"));
    const details = Array.isArray(payload) ? payload[0] : null;
    const networks = details?.NetworkSettings?.Networks || {};
    return new Set(Object.keys(networks).filter(Boolean));
  }

  async function inspectContainerAddresses(containerName) {
    const { stdout } = await runDocker(["inspect", containerName], 10000);
    const payload = JSON.parse(String(stdout || "[]"));
    const details = Array.isArray(payload) ? payload[0] : null;
    const networks = details?.NetworkSettings?.Networks || {};
    const addresses = [];
    for (const network of Object.values(networks)) {
      const ipAddress = String(network?.IPAddress || "").trim();
      if (ipAddress) {
        addresses.push(ipAddress);
      }
    }
    return [...new Set(addresses)];
  }

  return {
    inspectContainerNetworkIp,
    getContainerAttachedNetworks,
    inspectContainerAddresses
  };
}

module.exports = {
  createContainerInspectService
};
