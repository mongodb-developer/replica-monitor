#!/bin/bash
set -euo pipefail

# netem-multi-network.sh
#
# Usage:
#   ./netem-multi-network.sh apply
#   ./netem-multi-network.sh clear
#   ./netem-multi-network.sh apply amer-apac-net
#   ./netem-multi-network.sh clear amer-apac-net
#   ./netem-multi-network.sh init
#   ./netem-multi-network.sh cleanup
#
# Notes:
# - Uses a single compose-managed helper container (netem-helper).
# - The helper enters target container net namespaces with nsenter.
# - Targets interfaces by matching Docker-network MAC addresses.

ACTION="${1:-}"
TARGET_NETWORK="${2:-}"
HELPER_CONTAINER_NAME="netem-helper"
HELPER_IMAGE="nicolaka/netshoot"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LATENCY_FILE="${SCRIPT_DIR}/server/data/netem-latencies.json"
NETEM_TARGET_LIST_FILE="${SCRIPT_DIR}/server/data/netem-target-containers.txt"
TARGET_CONTAINERS=()
# Optional override: comma-separated Docker container names (e.g. scoped DC recovery).
if [[ -n "${NETEM_TARGET_CONTAINERS:-}" ]]; then
  IFS=',' read -ra _netem_parts <<< "${NETEM_TARGET_CONTAINERS}"
  for _part in "${_netem_parts[@]}"; do
    _part="$(echo "${_part}" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')"
    if [[ -n "$_part" ]]; then
      TARGET_CONTAINERS+=("$_part")
    fi
  done
elif [[ -f "$NETEM_TARGET_LIST_FILE" ]]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    line="$(echo "$line" | tr -d '\r')"
    if [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]]; then
      continue
    fi
    TARGET_CONTAINERS+=("$line")
  done < "$NETEM_TARGET_LIST_FILE"
fi
if [[ ${#TARGET_CONTAINERS[@]} -eq 0 ]]; then
  TARGET_CONTAINERS=("ApplicationServer" "ConfigServer")
fi

if [[ "$ACTION" != "apply" && "$ACTION" != "clear" && "$ACTION" != "init" && "$ACTION" != "cleanup" ]]; then
  echo "Usage: $0 <apply|clear|init|cleanup> [network-name]"
  exit 1
fi

# -------- Configure your network latency map here --------
NETWORKS_ALL=(
  "amer-net"
  "emea-net"
  "latam-net"
  "apac-net"
  "amer-emea-net"
  "amer-apac-net"
  "amer-latam-net"
  "latam-emea-net"
  "latam-apac-net"
  "emea-apac-net"
)

get_delay_for_network() {
  local key="$1"
  if [[ -f "$LATENCY_FILE" ]] && command -v jq >/dev/null 2>&1; then
    local ms
    ms="$(jq -r --arg k "$key" '.[$k] // empty' "$LATENCY_FILE" 2>/dev/null || true)"
    if [[ -n "$ms" && "$ms" != "null" ]]; then
      echo "${ms}ms"
      return 0
    fi
  fi
  case "$key" in
    amer-net) echo "25ms" ;;
    emea-net) echo "25ms" ;;
    latam-net) echo "25ms" ;;
    apac-net) echo "25ms" ;;
    amer-emea-net) echo "120ms" ;;
    amer-apac-net) echo "220ms" ;;
    amer-latam-net) echo "80ms" ;;
    latam-emea-net) echo "160ms" ;;
    latam-apac-net) echo "260ms" ;;
    emea-apac-net) echo "200ms" ;;
    *) return 1 ;;
  esac
}
# ---------------------------------------------------------

if [[ -n "$TARGET_NETWORK" ]]; then
  if [[ "$ACTION" != "apply" && "$ACTION" != "clear" ]]; then
    echo "Network argument is only valid for apply/clear."
    exit 1
  fi
  if ! get_delay_for_network "$TARGET_NETWORK" >/dev/null; then
    echo "Network '$TARGET_NETWORK' not found in NETWORK_DELAY map."
    exit 1
  fi
  NETWORKS=("$TARGET_NETWORK")
else
  NETWORKS=("${NETWORKS_ALL[@]}")
fi

container_exists() {
  local name="$1"
  docker container inspect "$name" >/dev/null 2>&1
}

helper_running() {
  docker inspect -f '{{.State.Running}}' "$HELPER_CONTAINER_NAME" 2>/dev/null | awk 'tolower($0)=="true"{found=1} END{exit(found?0:1)}'
}

ensure_helper_image() {
  docker image inspect "$HELPER_IMAGE" >/dev/null 2>&1 || docker pull "$HELPER_IMAGE" >/dev/null
}

ensure_helper_ready_for_runtime() {
  if ! container_exists "$HELPER_CONTAINER_NAME"; then
    echo "Required compose-managed helper container '$HELPER_CONTAINER_NAME' not found."
    echo "Start the FailoverMonitor stack to create it."
    return 1
  fi
  if ! helper_running; then
    echo "Compose-managed helper '$HELPER_CONTAINER_NAME' is not running."
    echo "Start/restart the FailoverMonitor stack so the helper stays long-lived."
    return 1
  fi
}

target_pid() {
  local container="$1"
  docker inspect -f '{{.State.Pid}}' "$container" 2>/dev/null || true
}

run_tc_in_target_namespace() {
  local container="$1"
  local network="$2"
  local delay="$3"
  local pid
  local mac

  if ! container_exists "$container"; then
    echo "[$container][$network] skip: target container not found"
    return 0
  fi

  pid="$(target_pid "$container")"
  if [[ -z "$pid" || "$pid" == "0" ]]; then
    echo "[$container][$network] skip: target PID unavailable"
    return 0
  fi

  mac="$(docker inspect -f "{{with index .NetworkSettings.Networks \"$network\"}}{{.MacAddress}}{{end}}" "$container" 2>/dev/null || true)"
  if [[ -z "$mac" ]]; then
    echo "[$container][$network] skip: no MAC for network"
    return 0
  fi

  if [[ "$ACTION" == "apply" ]]; then
    echo "[$container][$network] apply delay=$delay (pid=$pid mac=$mac)"
    docker exec \
      -e TARGET_PID="$pid" \
      -e TARGET_MAC="$mac" \
      -e DELAY="$delay" \
      "$HELPER_CONTAINER_NAME" \
      sh -lc '
        iface="$(
          nsenter -t "$TARGET_PID" -n ip -o link | awk -v mac="$TARGET_MAC" "
            BEGIN { IGNORECASE=1 }
            \$0 ~ \"link/ether \" mac {
              name=\$2; sub(\":\", \"\", name); sub(/@.*/, \"\", name); print name; exit
            }
          "
        )"
        if [ -z "$iface" ]; then
          echo "Could not find iface for MAC $TARGET_MAC in target PID $TARGET_PID" >&2
          exit 1
        fi
        nsenter -t "$TARGET_PID" -n tc qdisc replace dev "$iface" root netem delay "$DELAY"
        nsenter -t "$TARGET_PID" -n tc qdisc show dev "$iface"
      '
  else
    echo "[$container][$network] clear netem (pid=$pid mac=$mac)"
    docker exec \
      -e TARGET_PID="$pid" \
      -e TARGET_MAC="$mac" \
      "$HELPER_CONTAINER_NAME" \
      sh -lc '
        iface="$(
          nsenter -t "$TARGET_PID" -n ip -o link | awk -v mac="$TARGET_MAC" "
            BEGIN { IGNORECASE=1 }
            \$0 ~ \"link/ether \" mac {
              name=\$2; sub(\":\", \"\", name); sub(/@.*/, \"\", name); print name; exit
            }
          "
        )"
        if [ -z "$iface" ]; then
          echo "Could not find iface for MAC $TARGET_MAC in target PID $TARGET_PID" >&2
          exit 1
        fi
        nsenter -t "$TARGET_PID" -n tc qdisc del dev "$iface" root 2>/dev/null || true
        nsenter -t "$TARGET_PID" -n tc qdisc show dev "$iface"
      '
  fi
}

if [[ "$ACTION" == "init" ]]; then
  ensure_helper_image
  ensure_helper_ready_for_runtime
  echo "Done."
  exit 0
fi

if [[ "$ACTION" == "cleanup" ]]; then
  # Compose manages helper lifecycle; helper will be removed by compose down.
  echo "Compose-managed helper cleanup is handled by docker compose down."
  echo "Done."
  exit 0
fi

ensure_helper_ready_for_runtime

for network in "${NETWORKS[@]}"; do
  delay="$(get_delay_for_network "$network")"
  echo "=== $ACTION on network: $network ${ACTION/apply/(delay=$delay)} ==="
  for target in "${TARGET_CONTAINERS[@]}"; do
    run_tc_in_target_namespace "$target" "$network" "$delay"
  done
done

echo "Done."