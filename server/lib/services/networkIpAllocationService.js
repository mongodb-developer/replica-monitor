const fs = require("fs/promises");
const path = require("path");

function createNetworkIpAllocationService(deps) {
  const {
    networkIpAllocationsPath,
    runDocker,
    getApplicationServerSettings,
    getAllManagedNetworkNames
  } = deps;

  let networkIpAllocationCache = null;

  function normalizeNetworkIpAllocations(payload) {
    const source = payload?.allocations && typeof payload.allocations === "object"
      ? payload.allocations
      : payload;
    if (!source || typeof source !== "object") {
      return {};
    }
    const normalized = {};
    for (const [networkName, containerMap] of Object.entries(source)) {
      const normalizedNetworkName = String(networkName || "").trim();
      if (!normalizedNetworkName || !containerMap || typeof containerMap !== "object") {
        continue;
      }
      const normalizedContainerMap = {};
      for (const [containerName, ipAddress] of Object.entries(containerMap)) {
        const normalizedContainerName = String(containerName || "").trim();
        const normalizedIpAddress = String(ipAddress || "").trim();
        if (!normalizedContainerName || !normalizedIpAddress) {
          continue;
        }
        normalizedContainerMap[normalizedContainerName] = normalizedIpAddress;
      }
      normalized[normalizedNetworkName] = normalizedContainerMap;
    }
    return normalized;
  }

  async function loadNetworkIpAllocations() {
    if (networkIpAllocationCache) {
      return networkIpAllocationCache;
    }
    try {
      const raw = await fs.readFile(networkIpAllocationsPath, "utf8");
      networkIpAllocationCache = normalizeNetworkIpAllocations(JSON.parse(raw));
    } catch (error) {
      if (error?.code !== "ENOENT") {
        console.warn(`Unable to parse network IP allocations: ${error.message || error}`);
      }
      networkIpAllocationCache = {};
    }
    return networkIpAllocationCache;
  }

  async function saveNetworkIpAllocations(allocations) {
    const normalized = normalizeNetworkIpAllocations(allocations);
    await fs.mkdir(path.dirname(networkIpAllocationsPath), { recursive: true });
    const uniqueSuffix = `${process.pid}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const tempPath = `${networkIpAllocationsPath}.tmp-${uniqueSuffix}`;
    try {
      await fs.writeFile(tempPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");
      await fs.rename(tempPath, networkIpAllocationsPath);
    } finally {
      await fs.unlink(tempPath).catch(() => {});
    }
    networkIpAllocationCache = normalized;
  }

  async function resetNetworkIpAllocations() {
    await saveNetworkIpAllocations({});
  }

  function ipv4ToInt(ipAddress) {
    const parts = String(ipAddress || "")
      .trim()
      .split(".")
      .map((part) => Number(part));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
      return null;
    }
    return (
      (((parts[0] << 24) >>> 0) |
        ((parts[1] << 16) >>> 0) |
        ((parts[2] << 8) >>> 0) |
        (parts[3] >>> 0)) >>>
      0
    );
  }

  function intToIpv4(value) {
    const unsigned = Number(value) >>> 0;
    return [
      (unsigned >>> 24) & 255,
      (unsigned >>> 16) & 255,
      (unsigned >>> 8) & 255,
      unsigned & 255
    ].join(".");
  }

  function parseIpv4Subnet(cidr) {
    const [ipAddress, prefixRaw] = String(cidr || "").trim().split("/");
    const networkInt = ipv4ToInt(ipAddress);
    const prefix = Number(prefixRaw);
    if (!Number.isInteger(networkInt) || !Number.isInteger(prefix) || prefix < 0 || prefix > 32) {
      return null;
    }
    const mask = prefix === 0 ? 0 : ((0xffffffff << (32 - prefix)) >>> 0);
    const networkBase = (networkInt & mask) >>> 0;
    const hostCount = 2 ** (32 - prefix);
    const broadcast = (networkBase + hostCount - 1) >>> 0;
    const firstHost = prefix >= 31 ? networkBase : (networkBase + 1) >>> 0;
    const lastHost = prefix >= 31 ? broadcast : (broadcast - 1) >>> 0;
    return {
      cidr: `${intToIpv4(networkBase)}/${prefix}`,
      prefix,
      network: intToIpv4(networkBase),
      networkInt: networkBase,
      broadcast: intToIpv4(broadcast),
      broadcastInt: broadcast,
      firstHostInt: firstHost,
      lastHostInt: lastHost
    };
  }

  function extractIpv4WithoutPrefix(value) {
    return String(value || "")
      .trim()
      .split("/")[0]
      .trim();
  }

  function isIpv4InSubnet(ipAddress, subnet) {
    const ipInt = ipv4ToInt(ipAddress);
    if (!subnet || !Number.isInteger(ipInt)) {
      return false;
    }
    return ipInt >= subnet.networkInt && ipInt <= subnet.broadcastInt;
  }

  async function inspectNetworkDetails(networkName) {
    const { stdout } = await runDocker(["network", "inspect", networkName], 10000);
    const payload = JSON.parse(String(stdout || "[]"));
    const details = Array.isArray(payload) ? payload[0] : null;
    if (!details) {
      throw new Error(`No details returned for network ${networkName}.`);
    }
    return details;
  }

  function getIpv4SubnetFromNetworkDetails(networkName, details) {
    const configs = Array.isArray(details?.IPAM?.Config) ? details.IPAM.Config : [];
    const subnetCidr = configs
      .map((entry) => String(entry?.Subnet || "").trim())
      .find((value) => value.includes(".") && value.includes("/"));
    if (!subnetCidr) {
      throw new Error(`Network ${networkName} does not expose an IPv4 subnet in IPAM config.`);
    }
    const subnet = parseIpv4Subnet(subnetCidr);
    if (!subnet) {
      throw new Error(`Unsupported IPv4 subnet format for ${networkName}: ${subnetCidr}`);
    }
    return subnet;
  }

  function buildNetworkIpOwners(details) {
    const owners = new Map();
    const containers = details?.Containers && typeof details.Containers === "object" ? details.Containers : {};
    for (const endpoint of Object.values(containers)) {
      const ipAddress = extractIpv4WithoutPrefix(endpoint?.IPv4Address);
      const containerName = String(endpoint?.Name || "").trim();
      if (!ipAddress || !containerName) {
        continue;
      }
      owners.set(ipAddress, containerName);
    }
    return owners;
  }

  function findFirstFreeIpInSubnet(subnet, usedIps, reservedIps) {
    for (let candidate = subnet.firstHostInt; candidate <= subnet.lastHostInt; candidate += 1) {
      const candidateIp = intToIpv4(candidate);
      if (usedIps.has(candidateIp) || reservedIps.has(candidateIp)) {
        continue;
      }
      return candidateIp;
    }
    throw new Error(`No available IP addresses remain in subnet ${subnet.cidr}.`);
  }

  async function resolveContainerNetworkIpAllocation(networkName, containerName) {
    const allocations = await loadNetworkIpAllocations();
    const networkAllocations = allocations[networkName] && typeof allocations[networkName] === "object"
      ? allocations[networkName]
      : {};
    const mappedIp = String(networkAllocations[containerName] || "").trim();
    const details = await inspectNetworkDetails(networkName);
    const subnet = getIpv4SubnetFromNetworkDetails(networkName, details);
    const owners = buildNetworkIpOwners(details);
    const currentOwnerIp = [...owners.entries()].find(([, owner]) => owner === containerName)?.[0] || "";

    if (currentOwnerIp && isIpv4InSubnet(currentOwnerIp, subnet)) {
      return currentOwnerIp;
    }

    if (mappedIp && isIpv4InSubnet(mappedIp, subnet)) {
      const mappedOwner = owners.get(mappedIp);
      if (!mappedOwner || mappedOwner === containerName) {
        return mappedIp;
      }
    }

    const usedIps = new Set(owners.keys());
    const reservedIps = new Set([subnet.network, subnet.broadcast]);
    const gatewayIps = (Array.isArray(details?.IPAM?.Config) ? details.IPAM.Config : [])
      .map((entry) => extractIpv4WithoutPrefix(entry?.Gateway))
      .filter(Boolean);
    if (gatewayIps.length) {
      gatewayIps.forEach((ipAddress) => reservedIps.add(ipAddress));
    } else if (subnet.prefix < 31) {
      reservedIps.add(intToIpv4(subnet.firstHostInt));
    }

    return findFirstFreeIpInSubnet(subnet, usedIps, reservedIps);
  }

  async function resolveManagedNetworksForIpTracking() {
    const settings = await getApplicationServerSettings();
    return getAllManagedNetworkNames(settings?.dataCenters);
  }

  async function refreshNetworkIpAllocationsFromDocker() {
    const trackedNetworks = await resolveManagedNetworksForIpTracking();
    const merged = await loadNetworkIpAllocations();
    for (const networkName of trackedNetworks) {
      try {
        const details = await inspectNetworkDetails(networkName);
        const owners = buildNetworkIpOwners(details);
        if (!owners.size) {
          continue;
        }
        if (!merged[networkName] || typeof merged[networkName] !== "object") {
          merged[networkName] = {};
        }
        for (const [ipAddress, owner] of owners.entries()) {
          merged[networkName][owner] = ipAddress;
        }
      } catch (_error) {
        // Skip networks that are not yet created or cannot be inspected.
      }
    }
    await saveNetworkIpAllocations(merged);
    return merged;
  }

  return {
    resetNetworkIpAllocations,
    resolveContainerNetworkIpAllocation,
    refreshNetworkIpAllocationsFromDocker
  };
}

module.exports = {
  createNetworkIpAllocationService
};
