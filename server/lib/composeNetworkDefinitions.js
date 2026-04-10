/**
 * Named Docker networks used by the stack (netem, placement). Subnets match the historical
 * docker-compose.yml IPAM so existing tooling keeps stable addressing.
 */
const COMPOSE_REGIONAL_NETWORKS = [
  { name: "amer-net", subnet: "172.20.1.0/24" },
  { name: "latam-net", subnet: "172.20.2.0/24" },
  { name: "emea-net", subnet: "172.20.3.0/24" },
  { name: "apac-net", subnet: "172.20.4.0/24" },
  { name: "amer-emea-net", subnet: "172.20.5.0/24" },
  { name: "amer-apac-net", subnet: "172.20.6.0/24" },
  { name: "amer-latam-net", subnet: "172.20.7.0/24" },
  { name: "latam-emea-net", subnet: "172.20.8.0/24" },
  { name: "latam-apac-net", subnet: "172.20.9.0/24" },
  { name: "emea-apac-net", subnet: "172.20.10.0/24" },
  /** ApplicationServer ↔ ApplicationServer (mongos → config); excluded from netem. */
  { name: "application-server-mesh-net", subnet: "172.20.15.0/24" }
];

module.exports = {
  COMPOSE_REGIONAL_NETWORKS
};
