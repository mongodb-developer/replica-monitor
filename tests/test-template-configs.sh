#!/usr/bin/env bash
set -euo pipefail

node - <<'EOF'
const fs = require("fs");
const path = require("path");
const {
  listTemplates,
  getTemplateById,
  validateTemplatePayload
} = require("./server/lib/templateConfigs");

(async () => {
  const templates = await listTemplates();
  if (!Array.isArray(templates) || templates.length < 1) {
    throw new Error("Expected at least one configuration template.");
  }

  for (const entry of templates) {
    if (!entry || !entry.id || !entry.name) {
      throw new Error("Template listing contains invalid entry.");
    }
    const template = await getTemplateById(entry.id);
    const validation = await validateTemplatePayload(template);
    if (!validation.ok) {
      throw new Error(`Template ${entry.id} failed validation: ${validation.errors.join("; ")}`);
    }
  }

  console.log(`PASS: validated ${templates.length} configuration template(s).`);

  const gcrPath = path.join(process.cwd(), "server/config/templates/gcr-sharded.json");
  const gcr = JSON.parse(fs.readFileSync(gcrPath, "utf8"));
  const badZone = JSON.parse(JSON.stringify(gcr));
  badZone.zones[0].shards = ["shard_amer_emea"];
  const badCheck = await validateTemplatePayload(badZone);
  if (badCheck.ok) {
    throw new Error("Expected zone shard reference that does not exist in shards to fail validation.");
  }
  const hasUnknownShard = badCheck.errors.some((e) =>
    e.includes("shard_amer_emea") && e.includes("unknown shard")
  );
  if (!hasUnknownShard) {
    throw new Error(`Expected unknown shard error, got: ${badCheck.errors.join("; ")}`);
  }
})().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
EOF
