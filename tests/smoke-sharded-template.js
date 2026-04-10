#!/usr/bin/env node
/**
 * Lightweight readiness check for sharded template topology helpers (no Docker).
 * Run from FailoverMonitor: node tests/smoke-sharded-template.js
 */
const assert = require("assert/strict");
const fs = require("fs");
const path = require("path");
const { collectReplicaServiceNamesFromShardedTopology } = require("../server/lib/services/configServerSetupService");

const templatePath = path.join(__dirname, "../server/config/templates/global-sharded.json");
const template = JSON.parse(fs.readFileSync(templatePath, "utf8"));

assert.equal(template.sharded, true, "global-sharded.json must have sharded: true");
assert.ok(Array.isArray(template.shards) && template.shards.length >= 2, "expect at least two shards");

const settings = {
  templateTopology: {
    sharded: true,
    replicaSet: null,
    shards: template.shards.map((s) => ({ ...s }))
  }
};

const names = collectReplicaServiceNamesFromShardedTopology(settings);
const expected = new Set();
for (const shard of template.shards) {
  for (const n of shard.nodes || []) {
    expected.add(String(n.name).trim());
  }
}
assert.deepEqual(new Set(names), expected, "topology helper must list every template replica service name");
assert.equal(names.length, expected.size, "no duplicate service names");

console.log(`smoke-sharded-template: ok (${names.length} replica services)`);
