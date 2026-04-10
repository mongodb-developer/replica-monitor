const path = require("path");
const fs = require("fs/promises");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const NETEM_LATENCIES_PATH = path.resolve(PROJECT_ROOT, "server/data/netem-latencies.json");

/**
 * Flatten template latencies shape { intraRegionMs, interRegionMs } to { "amer-net": 25, ... } for netem script.
 */
function flattenTemplateLatencies(latencies) {
  if (!latencies || typeof latencies !== "object") {
    return {};
  }
  const out = {};
  const intra = latencies.intraRegionMs;
  const inter = latencies.interRegionMs;
  if (intra && typeof intra === "object") {
    for (const [k, v] of Object.entries(intra)) {
      const n = Number(v);
      if (Number.isFinite(n)) {
        out[k] = n;
      }
    }
  }
  if (inter && typeof inter === "object") {
    for (const [k, v] of Object.entries(inter)) {
      const n = Number(v);
      if (Number.isFinite(n)) {
        out[k] = n;
      }
    }
  }
  return out;
}

async function ensureDataDir() {
  await fs.mkdir(path.dirname(NETEM_LATENCIES_PATH), { recursive: true });
}

async function writeNetemLatencyFileFromTemplate(latencies) {
  const flat = flattenTemplateLatencies(latencies);
  await ensureDataDir();
  await fs.writeFile(NETEM_LATENCIES_PATH, `${JSON.stringify(flat, null, 2)}\n`, "utf8");
  return flat;
}

module.exports = {
  NETEM_LATENCIES_PATH,
  flattenTemplateLatencies,
  writeNetemLatencyFileFromTemplate
};
