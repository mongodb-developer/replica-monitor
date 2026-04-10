const path = require("path");
const fs = require("fs");

const COMPOSE_PROJECT_NAME = "failovermonitor";
const COMPOSE_GENERATED_FILE = "docker-compose.generated.yml";

/**
 * Build docker compose CLI args: project name, compose file list (-f base [-f generated] [-f extra...]), then subcommand args.
 * Leading `-f path` pairs in `args` are merged after the generated file (for temporary overrides).
 */
function normalizeComposeArgs(projectRoot, args) {
  const prefix = ["-p", COMPOSE_PROJECT_NAME];
  const files = ["-f", "docker-compose.yml"];
  const genPath = path.join(projectRoot, COMPOSE_GENERATED_FILE);
  try {
    if (fs.existsSync(genPath) && fs.statSync(genPath).size > 0) {
      files.push("-f", COMPOSE_GENERATED_FILE);
    }
  } catch (_e) {
    // ignore
  }
  let rest = [...args];
  while (rest.length >= 2 && rest[0] === "-f") {
    files.push("-f", rest[1]);
    rest = rest.slice(2);
  }
  return [...prefix, ...files, ...rest];
}

function buildComposeDownArgs(projectRoot) {
  return normalizeComposeArgs(projectRoot, ["down", "--remove-orphans"]);
}

module.exports = {
  COMPOSE_PROJECT_NAME,
  COMPOSE_GENERATED_FILE,
  normalizeComposeArgs,
  buildComposeDownArgs
};
