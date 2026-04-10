function createReplicaMembershipScriptService(deps) {
  const { MAX_VOTING_MEMBERS, runCompose, parseJsonPayload } = deps;

  function buildSingleNodeReplicaInitScript(replicaSetName, serviceName, dataCenter, dataCenterId = null) {
    return `
function waitForPrimary(maxAttempts, sleepMs) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const status = rs.status();
      const hasPrimary = status.members.some((member) => member.stateStr === "PRIMARY");
      if (hasPrimary) {
        return true;
      }
    } catch (error) {
      // no-op while election is still settling
    }
    sleep(sleepMs);
  }
  return false;
}

let initiated = false;
try {
  if (rs.status().ok === 1) {
    print("Replica set already initiated.");
    initiated = true;
  }
} catch (error) {
  print("Replica set not initiated yet.");
}

if (!initiated) {
  print("Initiating replica set...");
  rs.initiate({
    _id: ${JSON.stringify(replicaSetName)},
    version: 1,
    members: [
      {
        _id: 0,
        host: ${JSON.stringify(`${serviceName}:27017`)},
        priority: 1,
        votes: 1,
        tags: ${
          dataCenterId
            ? `{ dataCenter: ${JSON.stringify(dataCenter)}, dataCenterId: ${JSON.stringify(dataCenterId)} }`
            : `{ dataCenter: ${JSON.stringify(dataCenter)} }`
        }
      }
    ]
  });
}

if (!waitForPrimary(30, 1000)) {
  throw new Error("Primary was not elected in time.");
}

print("Replica set initialization complete.");
`.trim();
  }

  function buildReplicaPreflightScript(serviceName, role) {
    const host = `${serviceName}:27017`;
    if (role === "voting") {
      return `
const host = ${JSON.stringify(host)};
const cfg = rs.conf();
const exists = cfg.members.some((member) => member.host === host);
if (exists) {
  throw new Error("Replica set already contains host: " + host);
}
const votingCount = cfg.members.filter((member) => Number(member.votes ?? 1) > 0).length;
if (votingCount >= ${MAX_VOTING_MEMBERS}) {
  throw new Error("Cannot add voting node: maximum of ${MAX_VOTING_MEMBERS} voting members reached.");
}
print(JSON.stringify({ ok: true, host, role: "voting", votingCount }));
`.trim();
    }
    return `
const host = ${JSON.stringify(host)};
const cfg = rs.conf();
const exists = cfg.members.some((member) => member.host === host);
if (exists) {
  throw new Error("Replica set already contains host: " + host);
}
print(JSON.stringify({ ok: true, host, role: "analytics" }));
`.trim();
  }

  async function assertReplicaAddPreconditions(primaryService, serviceName, role) {
    const script = buildReplicaPreflightScript(serviceName, role);
    const { stdout } = await runCompose(
      ["exec", "-T", primaryService, "mongosh", "--quiet", "--eval", script],
      30000
    );
    return parseJsonPayload(stdout, "replica add preflight");
  }

  function buildReplicaAddScript(serviceName, role, dataCenter, dataCenterId = null) {
    const host = `${serviceName}:27017`;
    if (role === "voting") {
      return `
const host = ${JSON.stringify(host)};
const dataCenter = ${JSON.stringify(dataCenter)};
const dataCenterId = ${JSON.stringify(dataCenterId)};
const cfg = rs.conf();
const existing = cfg.members.find((member) => member.host === host);
if (existing) {
  throw new Error("Replica set already contains host: " + host);
}
const votingCount = cfg.members.filter((member) => Number(member.votes ?? 1) > 0).length;
if (votingCount >= ${MAX_VOTING_MEMBERS}) {
  throw new Error("Cannot add voting node: maximum of ${MAX_VOTING_MEMBERS} voting members reached.");
}
rs.add({
  host,
  priority: 1,
  tags: dataCenterId ? { dataCenter, dataCenterId } : { dataCenter }
});
print(JSON.stringify({ host, role: "voting", votingCountBefore: votingCount }));
`.trim();
    }
    return `
const host = ${JSON.stringify(host)};
const dataCenter = ${JSON.stringify(dataCenter)};
const dataCenterId = ${JSON.stringify(dataCenterId)};
const cfg = rs.conf();
const existing = cfg.members.find((member) => member.host === host);
if (existing) {
  throw new Error("Replica set already contains host: " + host);
}
rs.add({
  host,
  priority: 0,
  votes: 0,
  tags: dataCenterId ? { role: "analytics", dataCenter, dataCenterId } : { role: "analytics", dataCenter }
});
print(JSON.stringify({ host, role: "analytics" }));
`.trim();
  }

  return {
    buildSingleNodeReplicaInitScript,
    assertReplicaAddPreconditions,
    buildReplicaAddScript
  };
}

module.exports = {
  createReplicaMembershipScriptService
};
