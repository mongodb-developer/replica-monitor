function createStatusParsingService(deps) {
  const { isReplicaServiceCandidate, inspectContainerAddresses } = deps;

  function parseSummaryOutput(rawOutput) {
    const trimmed = (rawOutput || "").trim();
    if (!trimmed) {
      throw new Error("Empty status output from summary script.");
    }

    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
      throw new Error(`Unable to locate JSON payload in summary output: ${trimmed}`);
    }

    const payloadText = trimmed.slice(jsonStart, jsonEnd + 1);
    let payload;
    try {
      payload = JSON.parse(payloadText);
    } catch (error) {
      throw new Error(`Failed to parse summary JSON: ${error.message}`);
    }

    if (!payload || !Array.isArray(payload.members)) {
      throw new Error("Summary payload missing members array.");
    }

    return payload;
  }

  function memberNameToService(memberName) {
    return String(memberName || "")
      .split(":")[0]
      .trim();
  }

  function normalizeStatus(payload) {
    const members = payload.members
      .filter((member) => isReplicaServiceCandidate(memberNameToService(member?.name)))
      .map((member) => {
        const state = String(member.stateStr || "").toUpperCase();
        const role = state === "PRIMARY" ? "primary" : state === "SECONDARY" ? "secondary" : "other";
        const isHealthy = Number(member.health) === 1;

        return {
          name: member.name,
          stateStr: member.stateStr,
          health: Number(member.health),
          priority: Number(member.priority ?? 0),
          votes: Number(member.votes ?? 1),
          dataCenter: member.dataCenter || "AMER",
          dataCenterRegion: member.dataCenterRegion || null,
          role,
          isHealthy
        };
      });

    const primary = members.find((member) => member.role === "primary");
    const primaryName = payload.primaryName || (primary ? primary.name : null);
    const primaryHealthy = primary ? primary.isHealthy : false;
    const replicationEdges = primaryName
      ? members
          .filter((member) => member.name !== primaryName)
          .map((member) => ({
            from: primaryName,
            to: member.name,
            active: primaryHealthy && member.isHealthy
          }))
      : [];

    return {
      updatedAt: new Date().toISOString(),
      members,
      primaryName,
      replicationEdges
    };
  }

  function parseJsonPayload(rawOutput, contextLabel) {
    const trimmed = String(rawOutput || "").trim();
    if (!trimmed) {
      throw new Error(`Empty output while parsing ${contextLabel}.`);
    }
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd < jsonStart) {
      throw new Error(`Unable to locate JSON payload while parsing ${contextLabel}.`);
    }
    const payloadText = trimmed.slice(jsonStart, jsonEnd + 1);
    try {
      return JSON.parse(payloadText);
    } catch (error) {
      throw new Error(`Failed to parse ${contextLabel} JSON: ${error.message}`);
    }
  }

  function parseMemberHostPort(memberName) {
    const raw = String(memberName || "").trim();
    if (!raw) {
      return { host: "", port: "27017" };
    }
    const parts = raw.split(":");
    if (parts.length < 2) {
      return { host: raw, port: "27017" };
    }
    const port = String(parts.pop() || "").trim();
    const host = String(parts.join(":") || "").trim();
    return {
      host,
      port: port || "27017"
    };
  }

  function addAddressMapEntry(addressMap, key, memberName) {
    const normalizedKey = String(key || "").trim().toLowerCase();
    const normalizedMemberName = String(memberName || "").trim();
    if (!normalizedKey || !normalizedMemberName) {
      return;
    }
    addressMap[normalizedKey] = normalizedMemberName;
  }

  async function buildMemberAddressMap(members) {
    const output = {};
    const sourceMembers = Array.isArray(members) ? members : [];
    const serviceAddressesByName = new Map();
    const services = [...new Set(sourceMembers.map((member) => memberNameToService(member?.name)).filter(Boolean))];

    await Promise.all(
      services.map(async (serviceName) => {
        try {
          const addresses = await inspectContainerAddresses(serviceName);
          serviceAddressesByName.set(serviceName, addresses);
        } catch (_error) {
          serviceAddressesByName.set(serviceName, []);
        }
      })
    );

    for (const member of sourceMembers) {
      const memberName = String(member?.name || "").trim();
      if (!memberName) {
        continue;
      }
      const { host, port } = parseMemberHostPort(memberName);
      const serviceName = memberNameToService(memberName);
      addAddressMapEntry(output, memberName, memberName);
      addAddressMapEntry(output, host, memberName);
      if (host && port) {
        addAddressMapEntry(output, `${host}:${port}`, memberName);
      }
      if (serviceName) {
        addAddressMapEntry(output, serviceName, memberName);
        addAddressMapEntry(output, `${serviceName}:${port}`, memberName);
        const addresses = serviceAddressesByName.get(serviceName) || [];
        for (const address of addresses) {
          addAddressMapEntry(output, address, memberName);
          addAddressMapEntry(output, `${address}:${port}`, memberName);
        }
      }
    }
    return output;
  }

  return {
    parseSummaryOutput,
    memberNameToService,
    normalizeStatus,
    parseJsonPayload,
    buildMemberAddressMap
  };
}

module.exports = {
  createStatusParsingService
};
