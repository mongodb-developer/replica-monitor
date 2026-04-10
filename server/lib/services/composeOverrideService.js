function createComposeOverrideService(deps) {
  const { DEFAULT_STATUS_QUERY_SERVICES } = deps;

  function buildReplicaNodeComposeOverride(
    serviceName,
    hostPort,
    networkNames,
    replicaSetName = "mongodb-repl-set",
    seedHosts = DEFAULT_STATUS_QUERY_SERVICES.map((service) => `${service}:27017`)
  ) {
    const networks = Array.isArray(networkNames) ? networkNames.filter(Boolean) : [];
    if (!networks.length) {
      throw new Error("Replica node override requires at least one network.");
    }
    const networksYaml = networks.map((networkName) => `      - ${networkName}`).join("\n");
    const externalNetworksYaml = networks
      .map((networkName) => `  ${networkName}:\n    external: true\n    name: ${networkName}`)
      .join("\n");
    const mongoUri = `mongodb://${seedHosts.join(",")}/?replicaSet=${replicaSetName}`;
    return `services:
  ${serviceName}:
    image: andrewmorgan818/mongodb-repl-custom:latest
    container_name: ${serviceName}
    hostname: ${serviceName}
    volumes:
      - ./scripts:/scripts:ro
    networks:
${networksYaml}
    environment:
      - MONGODB_URI=${mongoUri}
    stdin_open: true
    tty: true
    init: true
    ports: ["${hostPort}:27017"]
    command: ["bash", "-lc", "tail -f /dev/null"]
    healthcheck:
      test: ["CMD-SHELL", "mongosh --quiet --eval 'db.runCommand({ ping: 1 })' || exit 1"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s
    restart: no
networks:
${externalNetworksYaml}
`;
  }

  return {
    buildReplicaNodeComposeOverride
  };
}

module.exports = {
  createComposeOverrideService
};
