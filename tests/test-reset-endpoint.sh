#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

if ! curl -fsS "${BASE_URL}/api/application-server/location" >/dev/null; then
  echo "Server is not reachable at ${BASE_URL}. Start the app first (npm start)." >&2
  exit 1
fi

echo "Stopping ApplicationServer services (if running)..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
(
  cd "$SCRIPT_DIR"
  AS_SERVICES="$(docker compose config --services 2>/dev/null | grep '^ApplicationServer' || true)"
  if [[ -n "$AS_SERVICES" ]]; then
    echo "$AS_SERVICES" | xargs docker compose stop >/dev/null 2>&1 || true
  else
    docker compose stop ApplicationServer >/dev/null 2>&1 || true
  fi
)

echo "Calling /api/replicaset/reset..."
RESET_RESPONSE="$(curl -fsS -X POST "${BASE_URL}/api/replicaset/reset")"

node -e '
const payload = JSON.parse(process.argv[1]);
if (!payload || payload.ok !== true) {
  console.error("Reset endpoint did not return ok:true");
  console.error(JSON.stringify(payload, null, 2));
  process.exit(1);
}
console.log("PASS: reset succeeded with ApplicationServer stopped.");
' "$RESET_RESPONSE"
