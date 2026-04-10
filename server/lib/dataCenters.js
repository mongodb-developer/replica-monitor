const countries = require("i18n-iso-countries");
const enLocale = require("i18n-iso-countries/langs/en.json");

countries.registerLocale(enLocale);

const REGION_KEYS = ["AMER", "EMEA", "APAC", "LATAM"];

const DEFAULT_DATA_CENTERS = [
  { id: "amer-denver-us", region: "AMER", name: "AMER", city: "Denver", country: "US", lat: 39.7392, lng: -104.9903 },
  { id: "emea-london-gb", region: "EMEA", name: "EMEA", city: "London", country: "GB", lat: 51.5072, lng: -0.1276 },
  { id: "apac-sydney-au", region: "APAC", name: "APAC", city: "Sydney", country: "AU", lat: -33.8688, lng: 151.2093 },
  {
    id: "latam-sao-paulo-br",
    region: "LATAM",
    name: "LATAM",
    city: "Sao Paulo",
    country: "BR",
    lat: -23.5505,
    lng: -46.6333
  }
];

const LATAM_COUNTRY_CODES = new Set([
  "AG", "AI", "AN", "AR", "AW", "BB", "BL", "BM", "BO", "BQ", "BR", "BS", "BZ", "CL", "CO", "CR",
  "CU", "CW", "DM", "DO", "EC", "FK", "GD", "GF", "GP", "GT", "GY", "HN", "HT", "JM", "KN", "KY",
  "LC", "MF", "MQ", "MS", "NI", "PA", "PE", "PM", "PR", "PY", "SR", "SV", "SX", "TC", "TT", "UY",
  "VC", "VE", "VG", "VI"
]);

const APAC_COUNTRY_CODES = new Set([
  "AE", "AF", "AM", "AQ", "AU", "AZ", "BD", "BH", "BN", "BT", "CC", "CN", "CX", "CY", "FJ", "FM",
  "GE", "GU", "HK", "ID", "IL", "IN", "IO", "IQ", "IR", "JO", "JP", "KG", "KH", "KI", "KM", "KP",
  "KR", "KW", "KZ", "LA", "LB", "LK", "MM", "MN", "MO", "MP", "MV", "MY", "NC", "NF", "NP", "NR",
  "NU", "NZ", "OM", "PF", "PG", "PH", "PK", "PN", "PS", "PW", "QA", "SA", "SB", "SG", "SY", "TH",
  "TJ", "TK", "TL", "TM", "TO", "TR", "TV", "TW", "UZ", "VN", "VU", "WF", "WS", "YE"
]);

const EMEA_COUNTRY_CODES = new Set([
  "AD", "AL", "AO", "AT", "BA", "BE", "BF", "BG", "BI", "BJ", "BV", "BW", "BY", "CD", "CF", "CG",
  "CH", "CI", "CM", "CV", "CZ", "DE", "DJ", "DK", "DZ", "EE", "EG", "EH", "ER", "ES", "ET", "FI",
  "FO", "FR", "GA", "GB", "GG", "GH", "GI", "GL", "GM", "GN", "GQ", "GR", "GW", "HR", "HU", "IE",
  "IM", "IS", "IT", "JE", "KE", "LI", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME",
  "MG", "MK", "ML", "MR", "MT", "MU", "MW", "MZ", "NA", "NE", "NG", "NL", "NO", "PL", "PT", "RE",
  "RO", "RS", "RU", "RW", "SC", "SD", "SE", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SS",
  "ST", "SZ", "TD", "TF", "TG", "TN", "TZ", "UA", "UG", "VA", "XK", "YT", "ZA", "ZM", "ZW"
]);

const COUNTRY_CODE_SET = new Set(
  Object.keys(countries.getNames("en", { select: "official" })).map((code) => String(code).toUpperCase())
);
COUNTRY_CODE_SET.delete("XK");

function normalizeCountryCode(value) {
  return String(value || "")
    .trim()
    .toUpperCase();
}

function isValidCountryCode(value) {
  const normalized = normalizeCountryCode(value);
  return /^[A-Z]{2}$/.test(normalized) && COUNTRY_CODE_SET.has(normalized);
}

function resolveRegionForCountry(countryCode) {
  const normalized = normalizeCountryCode(countryCode);
  if (LATAM_COUNTRY_CODES.has(normalized)) {
    return "LATAM";
  }
  if (APAC_COUNTRY_CODES.has(normalized)) {
    return "APAC";
  }
  if (EMEA_COUNTRY_CODES.has(normalized)) {
    return "EMEA";
  }
  return "AMER";
}

function ensureUniqueName(name, usedNames, fallbackName) {
  const preferred = String(name || "").trim() || fallbackName;
  let candidate = preferred;
  let index = 2;
  while (usedNames.has(candidate.toLowerCase())) {
    candidate = `${preferred}-${index}`;
    index += 1;
  }
  usedNames.add(candidate.toLowerCase());
  return candidate;
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ensureUniqueId(seed, usedIds, fallback) {
  const base = slugify(seed) || slugify(fallback) || "data-center";
  let candidate = base;
  let index = 2;
  while (usedIds.has(candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }
  usedIds.add(candidate);
  return candidate;
}

function parseCoordinate(value) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === "string" && !value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseLatitude(value) {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -90 && parsed <= 90 ? parsed : null;
}

function parseLongitude(value) {
  const parsed = parseCoordinate(value);
  return parsed !== null && parsed >= -180 && parsed <= 180 ? parsed : null;
}

function normalizeConfiguredDataCenters(rawDataCenters) {
  const source = Array.isArray(rawDataCenters) ? rawDataCenters.slice(0, 4) : [];
  const usedIds = new Set();
  const usedNames = new Set();
  const usedCountries = new Set();
  const normalized = [];

  for (const entry of source) {
    const country = normalizeCountryCode(entry?.country);
    if (!isValidCountryCode(country)) {
      continue;
    }
    const region = resolveRegionForCountry(country);
    const defaults = DEFAULT_DATA_CENTERS.find((item) => item.region === region);
    const name = ensureUniqueName(entry?.name, usedNames, defaults?.name || region);
    const city = String(entry?.city || "").trim() || defaults?.city || "";
    const id = ensureUniqueId(
      entry?.id || `${name}-${city}-${country}`,
      usedIds,
      `${region}-${defaults?.city || "site"}-${country}`
    );
    var dc = { id, region, name, city, country};
    const lat = parseLatitude(entry?.lat);
    const lng = parseLongitude(entry?.lng);
    const hasValidCoordinates = lat !== null && lng !== null;
    if (hasValidCoordinates) {
      dc.lat = lat;
      dc.lng = lng;
    }
    normalized.push(dc);
    usedCountries.add(country);
  }

  const usedRegions = new Set(normalized.map((entry) => entry.region));
  const missingRegions = REGION_KEYS.filter((region) => !usedRegions.has(region));
  const defaultsByRegion = new Map(DEFAULT_DATA_CENTERS.map((entry) => [entry.region, entry]));

  for (const region of missingRegions) {
    if (normalized.length >= 4) {
      break;
    }
    const defaults = defaultsByRegion.get(region);
    if (!defaults || usedCountries.has(defaults.country)) {
      continue;
    }
    const name = ensureUniqueName(defaults.name, usedNames, defaults.region);
    const id = ensureUniqueId(
      defaults.id || `${defaults.region}-${defaults.city}-${defaults.country}`,
      usedIds,
      defaults.region
    );
    normalized.push({
      id,
      region: defaults.region,
      name,
      city: defaults.city,
      country: defaults.country,
      lat: parseLatitude(defaults.lat),
      lng: parseLongitude(defaults.lng)
    });
    usedCountries.add(defaults.country);
  }

  for (const defaults of DEFAULT_DATA_CENTERS) {
    if (normalized.length >= 4) {
      break;
    }
    if (usedCountries.has(defaults.country)) {
      continue;
    }
    const name = ensureUniqueName(defaults.name, usedNames, defaults.region);
    const id = ensureUniqueId(
      defaults.id || `${defaults.region}-${defaults.city}-${defaults.country}`,
      usedIds,
      defaults.region
    );
    normalized.push({
      id,
      region: defaults.region,
      name,
      city: defaults.city,
      country: defaults.country,
      lat: parseLatitude(defaults.lat),
      lng: parseLongitude(defaults.lng)
    });
    usedCountries.add(defaults.country);
  }

  return normalized.slice(0, 4).map((entry) => ({
    ...entry,
    lat: parseLatitude(entry.lat),
    lng: parseLongitude(entry.lng)
  }));
}

function getDefaultDataCenters() {
  return DEFAULT_DATA_CENTERS.map((entry) => ({ ...entry }));
}

module.exports = {
  REGION_KEYS,
  DEFAULT_DATA_CENTERS,
  getDefaultDataCenters,
  normalizeCountryCode,
  isValidCountryCode,
  resolveRegionForCountry,
  normalizeConfiguredDataCenters
};
