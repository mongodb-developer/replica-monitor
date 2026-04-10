const path = require("path");
const fsSync = require("fs");
const fs = require("fs/promises");
const countries = require("i18n-iso-countries");
const enLocale = require("i18n-iso-countries/langs/en.json");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const ZONES_FILE_PATH = path.resolve(PROJECT_ROOT, "server/data/zones.json");
const ZONE_NAME_PATTERN = /^[A-Za-z0-9]+$/;
const COUNTRY_CODE_PATTERN = /^[A-Z]{2}$/;

countries.registerLocale(enLocale);

function buildCountryOptions() {
  const englishNamesByCode = countries.getNames("en", { select: "official" });
  const options = Object.entries(englishNamesByCode)
    .map(([code, name]) => ({
      code: String(code || "")
        .trim()
        .toUpperCase(),
      name: String(name || "").trim()
    }))
    .filter((entry) => entry.code !== "XK");
  options.sort((a, b) => a.name.localeCompare(b.name));
  return options;
}

const COUNTRY_OPTIONS = buildCountryOptions();
const COUNTRY_CODE_SET = new Set(COUNTRY_OPTIONS.map((entry) => entry.code));
const COUNTRY_CODE_BOUNDARIES = [...COUNTRY_CODE_SET].sort((a, b) => a.localeCompare(b));
COUNTRY_CODE_BOUNDARIES.push("ZZ");

async function ensureZonesDirectory() {
  await fs.mkdir(path.dirname(ZONES_FILE_PATH), { recursive: true });
}

function normalizeZoneName(value) {
  return String(value || "").trim();
}

function normalizeCountryCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function normalizeShardName(value) {
  return String(value || "").trim();
}

function normalizeZones(rawZones) {
  if (!Array.isArray(rawZones)) {
    throw new Error("zones must be an array");
  }
  const normalized = [];
  const namesSeen = new Set();
  const countryToZone = new Map();

  for (let index = 0; index < rawZones.length; index += 1) {
    const zone = rawZones[index] || {};
    const zoneName = normalizeZoneName(zone.name);
    if (!zoneName) {
      throw new Error(`zones[${index}].name is required`);
    }
    if (!ZONE_NAME_PATTERN.test(zoneName)) {
      throw new Error(`zones[${index}].name is invalid (letters and numbers only)`);
    }
    const normalizedNameKey = zoneName.toLowerCase();
    if (namesSeen.has(normalizedNameKey)) {
      throw new Error(`Zone name "${zoneName}" is duplicated`);
    }
    namesSeen.add(normalizedNameKey);

    const countriesRaw = Array.isArray(zone.countries) ? zone.countries : [];
    const shardsRaw = Array.isArray(zone.shards) ? zone.shards : [];
    const countries = [];
    const shards = [];
    const countriesSeenInZone = new Set();
    const shardsSeenInZone = new Set();

    for (const countryEntry of countriesRaw) {
      const code = normalizeCountryCode(countryEntry);
      if (!COUNTRY_CODE_PATTERN.test(code) || !COUNTRY_CODE_SET.has(code)) {
        throw new Error(`zones[${index}].countries contains invalid country code "${code}"`);
      }
      if (countriesSeenInZone.has(code)) {
        continue;
      }
      const existingZoneName = countryToZone.get(code);
      if (existingZoneName && existingZoneName !== zoneName) {
        throw new Error(`Country "${code}" is already assigned to zone "${existingZoneName}"`);
      }
      countryToZone.set(code, zoneName);
      countriesSeenInZone.add(code);
      countries.push(code);
    }

    for (const shardEntry of shardsRaw) {
      const shardName = normalizeShardName(shardEntry);
      if (!shardName) {
        continue;
      }
      if (shardsSeenInZone.has(shardName)) {
        continue;
      }
      shardsSeenInZone.add(shardName);
      shards.push(shardName);
    }

    normalized.push({
      name: zoneName,
      countries,
      shards
    });
  }

  return normalized;
}

async function getZones() {
  try {
    const raw = await fs.readFile(ZONES_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    const zones = normalizeZones(parsed?.zones || []);
    const updatedAt = String(parsed?.updatedAt || "").trim() || null;
    return { zones, updatedAt };
  } catch (_error) {
    return { zones: [], updatedAt: null };
  }
}

async function setZones(rawZones) {
  const zones = normalizeZones(rawZones);
  const updatedAt = new Date().toISOString();
  await ensureZonesDirectory();
  await fs.writeFile(
    ZONES_FILE_PATH,
    `${JSON.stringify(
      {
        zones,
        updatedAt
      },
      null,
      2
    )}\n`,
    "utf8"
  );
  return { zones, updatedAt };
}

async function clearZonesData() {
  await ensureZonesDirectory();
  await fs.writeFile(
    ZONES_FILE_PATH,
    `${JSON.stringify(
      {
        zones: [],
        updatedAt: null
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

function clearZonesDataSync() {
  fsSync.mkdirSync(path.dirname(ZONES_FILE_PATH), { recursive: true });
  fsSync.writeFileSync(
    ZONES_FILE_PATH,
    `${JSON.stringify(
      {
        zones: [],
        updatedAt: null
      },
      null,
      2
    )}\n`,
    "utf8"
  );
}

function getCountryOptions() {
  return COUNTRY_OPTIONS.map((entry) => ({ ...entry }));
}

function getCountryCodeBoundaries() {
  return [...COUNTRY_CODE_BOUNDARIES];
}

module.exports = {
  ZONE_NAME_PATTERN,
  COUNTRY_CODE_PATTERN,
  ZONES_FILE_PATH,
  getZones,
  setZones,
  clearZonesData,
  clearZonesDataSync,
  normalizeZones,
  getCountryOptions,
  getCountryCodeBoundaries
};
