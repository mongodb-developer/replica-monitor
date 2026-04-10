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
    _id: "mongodb-repl-set",
    version: 1,
    members: [
      { _id: 0, host: "Default_1:27017", priority: 1, votes: 1, tags: {dataCenter: "AMER"}},
      { _id: 1, host: "Default_2:27017", priority: 1, votes: 1, tags: {dataCenter: "AMER"}},
      { _id: 2, host: "Default_3:27017", priority: 1, votes: 1, tags: {dataCenter: "AMER"}}
    ]
  });
}

if (!waitForPrimary(30, 1000)) {
  throw new Error("Primary was not elected in time.");
}

print("Replica set initialization complete.");