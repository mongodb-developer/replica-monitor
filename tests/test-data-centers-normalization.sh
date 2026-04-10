#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
SETTINGS_FILE="server/data/settings.json"
BACKUP_FILE="$(mktemp)"
HAD_SETTINGS_FILE=0

cleanup() {
  if [[ "$HAD_SETTINGS_FILE" -eq 1 ]]; then
    cp "$BACKUP_FILE" "$SETTINGS_FILE"
  else
    rm -f "$SETTINGS_FILE"
  fi
  rm -f "$BACKUP_FILE"
}
trap cleanup EXIT

if ! curl -fsS "${BASE_URL}/api/application-server/location" >/dev/null; then
  echo "Server is not reachable at ${BASE_URL}. Start the app first (npm start)." >&2
  exit 1
fi

if [[ -f "$SETTINGS_FILE" ]]; then
  cp "$SETTINGS_FILE" "$BACKUP_FILE"
  HAD_SETTINGS_FILE=1
fi

cat >"$SETTINGS_FILE" <<'EOF'
{
  "dataCenters": [
    { "name": "EuroHub", "city": "Frankfurt", "country": "DE" },
    { "name": "BadEntry", "city": "Nowhere", "country": "ZZ" }
  ],
  "location": "XXXX",
  "electionTimeoutMs": 10000,
  "userLocation": "US",
  "writeConcern": "majority",
  "readConcern": "local",
  "readPreference": "primary"
}
EOF

PAYLOAD="$(curl -fsS "${BASE_URL}/api/application-server/location")"

node -e '
const payload = JSON.parse(process.argv[1]);
if (!payload || payload.ok !== true) {
  throw new Error("Expected ok:true from /api/application-server/location");
}
if (!Array.isArray(payload.dataCenters) || payload.dataCenters.length !== 4) {
  throw new Error("Expected exactly 4 normalized dataCenters entries.");
}
const ids = payload.dataCenters.map((entry) => String(entry.id || ""));
if (!ids.every((id) => id)) {
  throw new Error("Expected each normalized data center to include a non-empty id.");
}
const regions = payload.dataCenters.map((entry) => String(entry.region || "").toUpperCase());
const required = ["AMER", "EMEA", "APAC", "LATAM"];
for (const key of required) {
  if (!regions.includes(key)) {
    throw new Error(`Missing normalized region: ${key}`);
  }
}
if (regions[0] !== "EMEA") {
  throw new Error(`Expected first normalized data center to be EMEA, got: ${regions[0]}`);
}
if (payload.location !== ids[0]) {
  throw new Error(`Expected normalized location to match first data center id (${ids[0]}), got: ${payload.location}`);
}
console.log("PASS: data center normalization and location fallback are correct.");
' "$PAYLOAD"
