const { listApplicationServerServiceNames } = require("../applicationServerNaming");

function createConfigServerProcessService(deps) {
  const {
    runCompose,
    doesContainerExist,
    getApplicationServerSettings,
    COMPOSE_PROJECT_NAME,
    sleep
  } = deps;

  async function resolveApplicationServerContainerNames() {
    const settings = await getApplicationServerSettings();
    return listApplicationServerServiceNames(settings);
  }

  async function assertConfigServerMongodProcessRunning() {
    const names = await resolveApplicationServerContainerNames();
    const primary = names[0];
    if (!primary) {
      throw new Error("No ApplicationServer containers configured.");
    }
    await runCompose(
      [
        "-p",
        COMPOSE_PROJECT_NAME,
        "exec",
        "-T",
        primary,
        "bash",
        "-lc",
        "pidof mongod > /dev/null 2>&1"
      ],
      5000
    );
  }

  async function stopMongosOnApplicationServers(containerNames) {
    const names = [...new Set((containerNames || []).map((n) => String(n || "").trim()).filter(Boolean))];
    if (!names.length) {
      return { stopped: false, wasRunning: false };
    }
    let wasRunningAny = false;
    for (const name of names) {
      if (!(await doesContainerExist(name))) {
        continue;
      }
      const { stdout } = await runCompose(
        [
          "-p",
          COMPOSE_PROJECT_NAME,
          "exec",
          "-T",
          name,
          "bash",
          "-lc",
          "set -e; was_running=0; if pidof mongos > /dev/null 2>&1; then was_running=1; fi; (pkill mongos || true); for i in $(seq 1 30); do if ! pidof mongos > /dev/null 2>&1; then break; fi; sleep 1; done; if pidof mongos > /dev/null 2>&1; then echo 'mongos did not stop in time' >&2; exit 1; fi; echo \"$was_running\""
        ],
        60000
      );
      if (String(stdout || "").trim() === "1") {
        wasRunningAny = true;
      }
    }
    return { stopped: true, wasRunning: wasRunningAny };
  }

  async function stopConfigServerMongosProcess() {
    const names = await resolveApplicationServerContainerNames();
    return stopMongosOnApplicationServers(names);
  }

  async function startMongosOnApplicationServers(containerNames) {
    const names = [...new Set((containerNames || []).map((n) => String(n || "").trim()).filter(Boolean))];
    if (!names.length) {
      return { started: false };
    }
    const startResults = await Promise.all(
      names.map(async (name) => {
        if (!(await doesContainerExist(name))) {
          return false;
        }
        await runCompose(
          [
            "-p",
            COMPOSE_PROJECT_NAME,
            "exec",
            "-T",
            name,
            "bash",
            "-lc",
            "set -e; if [ ! -f /etc/mongos.conf ]; then exit 0; fi; set +e; (pkill mongos || true); for i in $(seq 1 30); do if ! pidof mongos > /dev/null 2>&1; then break; fi; sleep 1; done; if pidof mongos > /dev/null 2>&1; then echo 'mongos did not stop in time' >&2; exit 1; fi; set -e; mongos --config /etc/mongos.conf --fork"
          ],
          60000
        );
        return true;
      })
    );
    const ranStart = startResults.some(Boolean);
    if (!ranStart) {
      return { started: false };
    }
    const verifyName =
      names.find((name, index) => startResults[index]) || names.find((n) => n) || null;
    if (!verifyName) {
      return { started: false };
    }
    for (let attempt = 1; attempt <= 30; attempt += 1) {
      try {
        await runCompose(
          [
            "-p",
            COMPOSE_PROJECT_NAME,
            "exec",
            "-T",
            verifyName,
            "bash",
            "-lc",
            "[ ! -f /etc/mongos.conf ] || pidof mongos > /dev/null 2>&1"
          ],
          5000
        );
        return { started: true };
      } catch (_error) {
        await sleep(1000);
      }
    }
    throw new Error("ConfigServer mongos process did not become available in time (30s).");
  }

  async function startConfigServerMongosProcess() {
    const names = await resolveApplicationServerContainerNames();
    return startMongosOnApplicationServers(names);
  }

  async function ensureConfigServerMongosProcessRunning() {
    const names = await resolveApplicationServerContainerNames();
    let needStart = false;
    for (const name of names) {
      if (!(await doesContainerExist(name))) {
        continue;
      }
      try {
        await runCompose(
          [
            "-p",
            COMPOSE_PROJECT_NAME,
            "exec",
            "-T",
            name,
            "bash",
            "-lc",
            "[ ! -f /etc/mongos.conf ] || pidof mongos > /dev/null 2>&1"
          ],
          5000
        );
      } catch (_error) {
        needStart = true;
        break;
      }
    }
    if (!needStart) {
      return { ensured: true, started: false };
    }
    await startConfigServerMongosProcess();
    return { ensured: true, started: true };
  }

  async function restartConfigServerMongosProcess() {
    await stopConfigServerMongosProcess();
    return startConfigServerMongosProcess();
  }

  return {
    assertConfigServerMongodProcessRunning,
    stopMongosOnApplicationServers,
    startMongosOnApplicationServers,
    stopConfigServerMongosProcess,
    startConfigServerMongosProcess,
    ensureConfigServerMongosProcessRunning,
    restartConfigServerMongosProcess
  };
}

module.exports = {
  createConfigServerProcessService
};
