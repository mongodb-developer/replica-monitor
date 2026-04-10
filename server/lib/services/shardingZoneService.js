function createShardingZoneService(deps) {
  const {
    getCountryCodeBoundaries,
    doesContainerExist,
    resolveConfigServerContainerName,
    ensureConfigServerMongosProcessRunning,
    runConfigServerMongosEval,
    parseJsonPayload,
    sleep
  } = deps;

  function assertMongoOk(payload, contextLabel) {
    const okValue = Number(payload?.ok);
    if (okValue !== 1) {
      throw new Error(
        `${contextLabel} failed (ok=${String(payload?.ok ?? "undefined")}): ${JSON.stringify(payload)}`
      );
    }
  }

  async function runConfigServerMongosEvalJson(script, contextLabel, timeoutMs = 30000) {
    const wrappedScript = `const __result = (() => { ${script} })(); print(JSON.stringify(__result));`;
    const { stdout } = await runConfigServerMongosEval(wrappedScript, timeoutMs);
    return parseJsonPayload(stdout, contextLabel);
  }

  function buildCountryTagRangeEntries(zones) {
    const countryBoundaries = getCountryCodeBoundaries();
    const indexByCode = new Map(countryBoundaries.map((code, index) => [code, index]));
    const entries = [];
    for (const zone of zones || []) {
      const zoneName = String(zone?.name || "").trim();
      if (!zoneName) {
        continue;
      }
      const countries = [...new Set(
        (Array.isArray(zone?.countries) ? zone.countries : [])
          .map((entry) => String(entry || "").trim().toUpperCase())
          .filter(Boolean)
      )];
      countries.sort((a, b) => {
        const aIndex = indexByCode.has(a) ? indexByCode.get(a) : Number.MAX_SAFE_INTEGER;
        const bIndex = indexByCode.has(b) ? indexByCode.get(b) : Number.MAX_SAFE_INTEGER;
        if (aIndex !== bIndex) {
          return aIndex - bIndex;
        }
        return a.localeCompare(b);
      });
      for (const countryCode of countries) {
        if (!indexByCode.has(countryCode)) {
          throw new Error(`Unable to build zone tag range: unknown country code "${countryCode}".`);
        }
        const minIndex = indexByCode.get(countryCode);
        const maxCode = countryBoundaries[minIndex + 1];
        if (!maxCode) {
          throw new Error(`Unable to build zone tag range upper bound for country code "${countryCode}".`);
        }
        entries.push({
          zoneName,
          min: { country: countryCode },
          max: { country: maxCode }
        });
      }
    }
    return entries;
  }

  async function syncZonesToSharding(zones) {
    const configServerName = await resolveConfigServerContainerName();
    if (!(await doesContainerExist(configServerName))) {
      return {
        deferred: true,
        zonesAppliedToSharding: false,
        message: `Config/mongos host "${configServerName}" not available. Zones were saved and sharding-zone wiring was skipped.`
      };
    }

    await ensureConfigServerMongosProcessRunning();
    const { stdout: shardStatusOutput } = await runConfigServerMongosEval("sh.status()", 45000);
    const stopBalancerPayload = await runConfigServerMongosEvalJson(
      `const result = sh.stopBalancer();
const ok = Number(result?.ok ?? (result === true ? 1 : 0));
return { ok, result };`,
      "stop balancer",
      30000
    );
    assertMongoOk(stopBalancerPayload, "sh.stopBalancer()");

    let balancerStopped = false;
    let lastBalancerMode = "unknown";
    try {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const balancerStatePayload = await runConfigServerMongosEvalJson(
          `const result = sh.isBalancerRunning();
let mode = "";
if (result && typeof result === "object" && Object.prototype.hasOwnProperty.call(result, "mode")) {
  mode = String(result.mode || "");
} else if (result === false) {
  mode = "off";
} else if (result === true) {
  mode = "on";
}
return { ok: 1, mode, result };`,
          "balancer state",
          30000
        );
        lastBalancerMode = String(balancerStatePayload?.mode || "unknown");
        if (lastBalancerMode === "off") {
          balancerStopped = true;
          break;
        }
        await sleep(1000);
      }

      if (!balancerStopped) {
        throw new Error(`Timed out waiting for balancer to stop. Last observed mode="${lastBalancerMode}".`);
      }

      const tagRangesPayload = await runConfigServerMongosEvalJson(
        `const rows = db.getSiblingDB("config").tags.find({ ns: "architect_day.counter" }).toArray();
return {
  ok: 1,
  ranges: rows.map((row) => ({ min: row.min, max: row.max, tag: String(row.tag || "") }))
};`,
        "list current tag ranges",
        30000
      );
      assertMongoOk(tagRangesPayload, "list current architect_day.counter tag ranges");

      for (const range of tagRangesPayload.ranges || []) {
        const removeTagRangePayload = await runConfigServerMongosEvalJson(
          `const result = sh.removeTagRange("architect_day.counter", ${JSON.stringify(range.min)}, ${JSON.stringify(range.max)});
const ok = Number(result?.ok ?? (result === true ? 1 : 0));
return { ok, result, min: ${JSON.stringify(range.min)}, max: ${JSON.stringify(range.max)} };`,
          "remove tag range",
          30000
        );
        assertMongoOk(removeTagRangePayload, "sh.removeTagRange()");
      }

      const shardTagsPayload = await runConfigServerMongosEvalJson(
        `const result = db.adminCommand({ listShards: 1 });
if (!result || Number(result.ok) !== 1) {
  return { ok: Number(result?.ok || 0), shards: [], raw: result };
}
return {
  ok: 1,
  shards: (result.shards || []).map((shard) => ({
    shardName: String(shard._id || ""),
    tags: Array.isArray(shard.tags) ? shard.tags.map((tag) => String(tag || "")) : []
  }))
};`,
        "list shard tags",
        30000
      );
      assertMongoOk(shardTagsPayload, "list shard tags");

      for (const shard of shardTagsPayload.shards || []) {
        const shardName = String(shard?.shardName || "").trim();
        if (!shardName) {
          continue;
        }
        for (const zoneNameRaw of shard.tags || []) {
          const zoneName = String(zoneNameRaw || "").trim();
          if (!zoneName) {
            continue;
          }
          const removeShardTagPayload = await runConfigServerMongosEvalJson(
            `const result = sh.removeShardTag(${JSON.stringify(shardName)}, ${JSON.stringify(zoneName)});
const ok = Number(result?.ok ?? (result === true ? 1 : 0));
return { ok, result, shardName: ${JSON.stringify(shardName)}, zoneName: ${JSON.stringify(zoneName)} };`,
            "remove shard tag",
            30000
          );
          assertMongoOk(removeShardTagPayload, "sh.removeShardTag()");
        }
      }

      const desiredShardTags = [];
      for (const zone of zones || []) {
        const zoneName = String(zone?.name || "").trim();
        if (!zoneName) {
          continue;
        }
        const shardNames = [...new Set(
          (Array.isArray(zone?.shards) ? zone.shards : [])
            .map((entry) => String(entry || "").trim())
            .filter(Boolean)
        )];
        for (const shardName of shardNames) {
          desiredShardTags.push({ shardName, zoneName });
        }
      }

      for (const association of desiredShardTags) {
        const addShardTagPayload = await runConfigServerMongosEvalJson(
          `const result = sh.addShardTag(${JSON.stringify(association.shardName)}, ${JSON.stringify(association.zoneName)});
const ok = Number(result?.ok ?? (result === true ? 1 : 0));
return { ok, result, shardName: ${JSON.stringify(association.shardName)}, zoneName: ${JSON.stringify(association.zoneName)} };`,
          "add shard tag",
          30000
        );
        assertMongoOk(addShardTagPayload, "sh.addShardTag()");
      }

      const tagRangeEntries = buildCountryTagRangeEntries(zones);
      for (const tagRangeEntry of tagRangeEntries) {
        const addTagRangePayload = await runConfigServerMongosEvalJson(
          `const result = sh.addTagRange("architect_day.counter", ${JSON.stringify(tagRangeEntry.min)}, ${JSON.stringify(tagRangeEntry.max)}, ${JSON.stringify(tagRangeEntry.zoneName)});
const ok = Number(result?.ok ?? (result === true ? 1 : 0));
return {
  ok,
  result,
  zoneName: ${JSON.stringify(tagRangeEntry.zoneName)},
  min: ${JSON.stringify(tagRangeEntry.min)},
  max: ${JSON.stringify(tagRangeEntry.max)}
};`,
          "add tag range",
          30000
        );
        assertMongoOk(addTagRangePayload, "sh.addTagRange()");
      }

      const startBalancerPayload = await runConfigServerMongosEvalJson(
        `const result = sh.startBalancer();
const ok = Number(result?.ok ?? (result === true ? 1 : 0));
return { ok, result };`,
        "start balancer",
        30000
      );
      assertMongoOk(startBalancerPayload, "sh.startBalancer()");
      balancerStopped = false;

      return {
        deferred: false,
        zonesAppliedToSharding: true,
        removedTagRanges: (tagRangesPayload.ranges || []).length,
        removedShardTagAssignments: (shardTagsPayload.shards || []).reduce(
          (sum, shard) => sum + (Array.isArray(shard.tags) ? shard.tags.length : 0),
          0
        ),
        addedShardTagAssignments: desiredShardTags.length,
        addedCountryTagRanges: tagRangeEntries.length,
        shStatusOutput: String(shardStatusOutput || "").trim()
      };
    } finally {
      if (balancerStopped) {
        try {
          const restartPayload = await runConfigServerMongosEvalJson(
            `const result = sh.startBalancer();
const ok = Number(result?.ok ?? (result === true ? 1 : 0));
return { ok, result };`,
            "restart balancer after failure",
            30000
          );
          assertMongoOk(restartPayload, "sh.startBalancer() during cleanup");
        } catch (_error) {
          // Preserve original error from zone sync path.
        }
      }
    }
  }

  return {
    syncZonesToSharding
  };
}

module.exports = {
  createShardingZoneService
};
