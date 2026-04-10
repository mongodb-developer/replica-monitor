#!/usr/bin/env bash
# Run sharded template helper smoke (no Docker). From repo root:
#   FailoverMonitor/tests/smoke-sharded-template.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node tests/smoke-sharded-template.js
