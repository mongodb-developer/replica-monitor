/**
 * Compose service names for per–data-center ApplicationServer instances: ApplicationServer-<dataCenterId>
 */
const APPLICATION_SERVER_NAME_PREFIX = "ApplicationServer";

/** Docker network for mongos ↔ config connectivity (no netem latency). */
const APPLICATION_SERVER_MESH_NETWORK_NAME = "application-server-mesh-net";

function applicationServerServiceNameForDataCenterId(dcId) {
  const id = String(dcId || "").trim();
  if (!id) {
    return null;
  }
  return `${APPLICATION_SERVER_NAME_PREFIX}-${id}`;
}

function listApplicationServerServiceNames(settings) {
  const dcs = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
  const names = [];
  for (let i = 0; i < Math.min(4, dcs.length); i += 1) {
    const n = applicationServerServiceNameForDataCenterId(dcs[i]?.id);
    if (n) {
      names.push(n);
    }
  }
  return names;
}

function getPrimaryApplicationServerServiceName(settings) {
  const names = listApplicationServerServiceNames(settings);
  return names.length ? names[0] : null;
}

function getActiveApplicationServerServiceName(settings) {
  const names = listApplicationServerServiceNames(settings);
  if (!names.length) {
    return null;
  }
  const loc = String(settings?.location || "").trim();
  const match = applicationServerServiceNameForDataCenterId(loc);
  if (match && names.includes(match)) {
    return match;
  }
  const locLower = loc.toLowerCase();
  const dcs = Array.isArray(settings?.dataCenters) ? settings.dataCenters : [];
  for (let i = 0; i < Math.min(4, dcs.length); i += 1) {
    const id = String(dcs[i]?.id || "").trim();
    if (id && id.toLowerCase() === locLower) {
      const n = applicationServerServiceNameForDataCenterId(id);
      if (n && names.includes(n)) {
        return n;
      }
    }
  }
  return names[0];
}

function isApplicationServerComposeServiceName(serviceName) {
  const s = String(serviceName || "").trim();
  return s === APPLICATION_SERVER_NAME_PREFIX || s.startsWith(`${APPLICATION_SERVER_NAME_PREFIX}-`);
}

function parseDataCenterIdFromApplicationServerServiceName(serviceName) {
  const s = String(serviceName || "").trim();
  if (s === APPLICATION_SERVER_NAME_PREFIX) {
    return null;
  }
  if (!s.startsWith(`${APPLICATION_SERVER_NAME_PREFIX}-`)) {
    return null;
  }
  return s.slice(APPLICATION_SERVER_NAME_PREFIX.length + 1) || null;
}

module.exports = {
  APPLICATION_SERVER_NAME_PREFIX,
  APPLICATION_SERVER_MESH_NETWORK_NAME,
  applicationServerServiceNameForDataCenterId,
  listApplicationServerServiceNames,
  getPrimaryApplicationServerServiceName,
  getActiveApplicationServerServiceName,
  isApplicationServerComposeServiceName,
  parseDataCenterIdFromApplicationServerServiceName
};
