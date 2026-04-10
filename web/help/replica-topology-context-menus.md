# Replica Topology Context Menus

Use **right-click** on a **replica node** or on **empty canvas** in the topology view to open context menus. These actions drive the live Docker/MongoDB stack behind the demo.

In **read-only** mode, context menus do not open—use **Admin** (see **Other Controls** → **Read-only and admin**) to unlock operator controls for your browser first.

## Node menu

### MongoDB process

| Menu item | API | What happens |
| --- | --- | --- |
| Stop MongoDB (Graceful) | `POST /api/mongodb/stop-graceful` | Sends SIGTERM to `mongod` in the container (`kill` via shell). |
| Crash MongoDB (Hard Stop) | `POST /api/mongodb/stop-hard` | Sends SIGKILL to `mongod`. |
| Start MongoDB | `POST /api/mongodb/start` | Starts `mongod` with the container’s config file. |
| Increase / Decrease MongoDB Priority | `POST /api/mongodb/priority/increase` / `decrease` | Reconfigures the replica set from the current primary using `mongosh`. |

### Container and network

| Menu item | API | What happens |
| --- | --- | --- |
| Stop Server | `POST /api/container/stop` | Stops the member’s container (`docker compose stop` or equivalent). |
| Start Server | `POST /api/container/start` | Starts the container again. |
| Server Network Failure | `POST /api/network/isolate` | Detaches that member from the simulated WAN/regional networks (see multi-network model in the developer README). |
| Server Network Recovery | `POST /api/network/connect` | Re-attaches required networks. |

### Topology

| Menu item | API | What happens |
| --- | --- | --- |
| Set as Status Node | `POST /api/status-node/set` | Chooses which member the UI prefers for status polling. |
| Remove Node | `POST /api/replicaset/nodes/remove` | Removes the member from the replica set and destroys the container, then reconciles networking. Not allowed on the current primary. |

## Canvas menu (empty area)

| Menu item | API | What happens |
| --- | --- | --- |
| Add node | `POST /api/replicaset/nodes/add` | Creates/starts a new member and joins the set (or shard), including compose overrides. In **sharded** mode you supply a **shard name**; adding a brand-new shard may ask for confirmation. |
| Shard Replica Set | `POST /api/replicaset/shard` | Converts the existing replica set into a sharded deployment (configsvr + mongos on Application Server, addShard, shard collection, etc.). Hidden once the cluster is already sharded. |
| Data Center Network Failure / Recovery | `POST /api/network/datacenter/isolate` / `connect` | Disconnects or reconnects **all** members in a data center from the relevant wide-area links while preserving local site connectivity. |

## Behavior notes

- “Graceful” MongoDB stop uses OS signals, not `db.shutdownServer()` inside `mongosh`.
- Network failures are simulated by **Docker network detach/attach**, so they behave like real link loss from the cluster’s point of view.
- Isolating the **primary** triggers normal MongoDB failover rules (quorum, priorities, election timeout).

For **configuration templates** (replacing the whole topology from JSON) use **Configurations** in the header, not the context menus.
