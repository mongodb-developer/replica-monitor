#!/usr/bin/env bash
set -euo pipefail

node - <<'EOF'
const {
  getApplicationServerSettings,
  setApplicationServerSettings,
  DEPLOYMENT_PROFILE_CONSOLIDATED
} = require("./server/lib/applicationServerLocation");
const { validateTemplatePayload } = require("./server/lib/templateConfigs");

(async () => {
  const original = await getApplicationServerSettings();

  try {
    const consolidated = await setApplicationServerSettings({
      ...original,
      deploymentProfile: "consolidated"
    });
    if (consolidated.deploymentProfile !== DEPLOYMENT_PROFILE_CONSOLIDATED) {
      throw new Error("Expected consolidated deployment profile to persist.");
    }

    const normalized = await setApplicationServerSettings({
      ...consolidated,
      deploymentProfile: "invalid-profile"
    });
    if (normalized.deploymentProfile !== DEPLOYMENT_PROFILE_CONSOLIDATED) {
      throw new Error(
        `Expected invalid deployment profile to normalize to ${DEPLOYMENT_PROFILE_CONSOLIDATED}.`
      );
    }

    const legacyStandard = await setApplicationServerSettings({
      ...normalized,
      deploymentProfile: "standard"
    });
    if (legacyStandard.deploymentProfile !== DEPLOYMENT_PROFILE_CONSOLIDATED) {
      throw new Error("Expected legacy standard value to normalize to consolidated.");
    }

    const baseTemplate = {
      version: 1,
      name: "profile-validation",
      dataCenters: original.dataCenters,
      applicationServerLocation: original.location,
      electionTimeoutMs: original.electionTimeoutMs,
      writeConcern: original.writeConcern,
      readConcern: original.readConcern,
      readPreference: original.readPreference,
      latencies: {
        intraRegionMs: {},
        interRegionMs: {}
      },
      sharded: false,
      replicaSet: {
        name: "mongodb-repl-set",
        nodes: [
          {
            name: "Default_1",
            type: "voting",
            priority: 1,
            dataCenter: String(original.dataCenters[0]?.id || "")
          }
        ]
      }
    };

    const withIgnoredProfile = await validateTemplatePayload({
      ...baseTemplate,
      deploymentProfile: "standard"
    });
    if (!withIgnoredProfile.ok) {
      throw new Error(
        `Expected template with legacy deploymentProfile to validate: ${withIgnoredProfile.errors.join("; ")}`
      );
    }

    console.log("PASS: deployment profile normalizes to consolidated; templates ignore deploymentProfile.");
  } finally {
    await setApplicationServerSettings(original);
  }
})().catch((error) => {
  console.error(error.message || String(error));
  process.exit(1);
});
EOF
