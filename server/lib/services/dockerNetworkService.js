const { execFile } = require("child_process");
const { COMPOSE_REGIONAL_NETWORKS } = require("../composeNetworkDefinitions");

function createDockerNetworkService(deps) {
  const {
    PROJECT_ROOT,
    COMPOSE_TIMEOUT_MS,
    COMPOSE_PROJECT_NAME,
    resolveContainerNetworkIpAllocation,
    refreshNetworkIpAllocationsFromDocker,
    getContainerAttachedNetworks
  } = deps;

  async function runDockerNetworkCommand(command, networkName, containerName, options = {}) {
    const args = ["network", command];
    if (command === "connect" && options.ipAddress) {
      args.push("--ip", options.ipAddress);
    }
    args.push(networkName, containerName);
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        args,
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, stdout, stderr) => {
          if (error) {
            const ipFragment =
              command === "connect" && options.ipAddress ? ` --ip ${options.ipAddress}` : "";
            reject(
              new Error(
                `docker network ${command}${ipFragment} ${networkName} ${containerName} failed: ${stderr || error.message}`.trim()
              )
            );
            return;
          }
          resolve({ stdout, stderr });
        }
      );
    });
  }

  function inspectNetworkJson(networkName) {
    return new Promise((resolve) => {
      execFile(
        "docker",
        ["network", "inspect", networkName],
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, stdout) => {
          if (error) {
            resolve(null);
            return;
          }
          try {
            const arr = JSON.parse(stdout);
            resolve(Array.isArray(arr) ? arr[0] : null);
          } catch (_e) {
            resolve(null);
          }
        }
      );
    });
  }

  function removeNetwork(networkName) {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        ["network", "rm", networkName],
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, _stdout, stderr) => {
          if (error) {
            reject(new Error(`docker network rm ${networkName} failed: ${stderr || error.message}`.trim()));
            return;
          }
          resolve();
        }
      );
    });
  }

  function createNetworkWithSubnetAndLabels(networkName, subnet) {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        [
          "network",
          "create",
          "--driver",
          "bridge",
          "--subnet",
          subnet,
          "--label",
          `com.docker.compose.project=${COMPOSE_PROJECT_NAME}`,
          "--label",
          `com.docker.compose.network=${networkName}`,
          networkName
        ],
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (error, stdout, stderr) => {
          if (error) {
            const msg = String(stderr || error.message || "");
            if (msg.toLowerCase().includes("already exists")) {
              resolve({ created: false });
              return;
            }
            reject(new Error(`docker network create ${networkName} failed: ${msg}`.trim()));
            return;
          }
          resolve({ created: true, stdout });
        }
      );
    });
  }

  /**
   * Ensures regional/inter-region networks exist with Compose-compatible labels before
   * `docker compose up`. Avoids "incorrect label com.docker.compose.network" when a same-named
   * network was created without Compose metadata.
   */
  async function ensureComposeRegionalNetworks() {
    for (const { name, subnet } of COMPOSE_REGIONAL_NETWORKS) {
      const existing = await inspectNetworkJson(name);
      if (!existing) {
        await createNetworkWithSubnetAndLabels(name, subnet);
        continue;
      }
      const labels = existing.Labels || {};
      const labelOk =
        String(labels["com.docker.compose.network"] || "") === name &&
        String(labels["com.docker.compose.project"] || "") === COMPOSE_PROJECT_NAME;
      if (labelOk) {
        continue;
      }
      const attached = existing.Containers && typeof existing.Containers === "object"
        ? Object.keys(existing.Containers).length
        : 0;
      if (attached > 0) {
        throw new Error(
          `Docker network "${name}" exists but has incompatible Compose labels and has ${attached} attached endpoint(s). ` +
            `Remove endpoints or run "docker network rm ${name}" after disconnecting containers, then retry.`
        );
      }
      await removeNetwork(name);
      await createNetworkWithSubnetAndLabels(name, subnet);
    }
  }

  async function ensureDockerNetworkExists(networkName) {
    return new Promise((resolve, reject) => {
      execFile(
        "docker",
        ["network", "inspect", networkName],
        {
          cwd: PROJECT_ROOT,
          timeout: COMPOSE_TIMEOUT_MS,
          maxBuffer: 1024 * 1024 * 4
        },
        (inspectError) => {
          if (!inspectError) {
            resolve({ created: false });
            return;
          }
          execFile(
            "docker",
            [
              "network",
              "create",
              "--label",
              `com.docker.compose.project=${COMPOSE_PROJECT_NAME}`,
              "--label",
              `com.docker.compose.network=${networkName}`,
              networkName
            ],
            {
              cwd: PROJECT_ROOT,
              timeout: COMPOSE_TIMEOUT_MS,
              maxBuffer: 1024 * 1024 * 4
            },
            (createError, stdout, stderr) => {
              if (createError) {
                const lowerMessage = String(stderr || createError.message || "").toLowerCase();
                if (lowerMessage.includes("already exists")) {
                  resolve({ created: false });
                  return;
                }
                reject(
                  new Error(
                    `docker network create ${networkName} failed: ${stderr || createError.message}`.trim()
                  )
                );
                return;
              }
              resolve({ created: true, stdout });
            }
          );
        }
      );
    });
  }

  function isIgnorableNetworkError(action, message) {
    const text = String(message || "").toLowerCase();
    const missingNetwork = text.includes("network") && text.includes("not found");
    if (missingNetwork) {
      return true;
    }
    if (action === "disconnect") {
      return text.includes("is not connected to network");
    }
    if (action === "connect") {
      return text.includes("already exists") || text.includes("already connected");
    }
    return false;
  }

  async function updateContainerNetworks(containerName, networks, action) {
    const normalizedNetworks = [...new Set((Array.isArray(networks) ? networks : []).filter(Boolean))];
    const failures = [];
    for (const networkName of normalizedNetworks) {
      try {
        const options = {};
        if (action === "connect") {
          await ensureDockerNetworkExists(networkName);
          options.ipAddress = await resolveContainerNetworkIpAllocation(networkName, containerName);
        }
        await runDockerNetworkCommand(action, networkName, containerName, options);
      } catch (error) {
        if (isIgnorableNetworkError(action, error.message)) {
          continue;
        }
        failures.push(`${networkName}: ${error.message}`);
      }
    }
    if (failures.length) {
      throw new Error(
        `Failed to ${action} ${containerName} ${action === "disconnect" ? "from" : "to"} data-center networks: ${failures.join(" | ")}`
      );
    }
    await refreshNetworkIpAllocationsFromDocker();
    return { container: containerName, networks: normalizedNetworks };
  }

  async function reconcileContainerToNetworks(containerName, desiredNetworks, managedNetworks) {
    const desired = [...new Set((desiredNetworks || []).filter(Boolean))];
    const managed = [...new Set((managedNetworks || []).filter(Boolean))];
    const attached = await getContainerAttachedNetworks(containerName);
    const toDisconnect = managed.filter((networkName) => attached.has(networkName) && !desired.includes(networkName));
    const toConnect = desired.filter((networkName) => !attached.has(networkName));
    await updateContainerNetworks(containerName, toDisconnect, "disconnect");
    await updateContainerNetworks(containerName, toConnect, "connect");
    return desired;
  }

  return {
    runDockerNetworkCommand,
    ensureDockerNetworkExists,
    ensureComposeRegionalNetworks,
    isIgnorableNetworkError,
    updateContainerNetworks,
    reconcileContainerToNetworks
  };
}

module.exports = {
  createDockerNetworkService
};
