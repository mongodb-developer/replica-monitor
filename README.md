# Failover Monitor

Node.js + Express application for visualizing MongoDB replica set behavior in Docker, simulating network faults across data centers, running an application workload, and promoting a replica set into a sharded cluster.

## Current Behavior Snapshot

- Workload console layout is expanded and reorganized:
  - 2x2 chart grid
  - chart visibility toggles
  - collapsible console output panel
- Dashboard supports two switchable views:
  - `Node Monitor Layout` (existing topology-first screen)
  - `Geographic Layout` (world map + simplified workload panel + data-center node table)
- Geographic layout behavior:
  - map occupies the primary screen area
  - top-row controls are hidden (`Reset Replica Set`, `Refresh Now`, upper `Settings`, and `Help`)
  - title, connection status pill, and status text share one row
  - map pins represent configured data centers
  - selecting a pin filters the bottom table to members in that data center
  - bottom table includes replica-member fields plus shard zones and last read value
  - `Data Center Nodes` table can be expanded/collapsed
  - in non-sharded mode, `Last Read Value` is cluster-level for all rows
  - in sharded mode, `Last Read Value` is shard-aware per row (same for nodes in same shard, may differ across shards)
- Geographic map includes zone visualization:
  - countries assigned to zones are highlighted with per-zone colors
  - zone legend supports hover emphasis of a single zone
- Geographic map includes role pulse indicators:
  - pulsing ring for application server data center (always on)
  - pulsing ring for read and write handling data centers (only while workload is running)
  - if one data center has multiple roles, pulse color cycles between roles
  - pulse legend shows current role-color mapping
- Application-server location and read preference controls are configured in the workload console (not in the settings modal).
- MongoDB write/read concern and read preference are now applied server-side and hot-updated for the running workload.
- Last read value selection is mode-aware:
  - `[READ:default]` before sharding
  - `[READ:mongos]` after sharding (cluster-level summary card)
- Zone workflows are wired to sharding commands, and zone data is cleared on startup/shutdown/reset.
- Edit Zones modal usability improvements:
  - countries and shards/replica sets now use dual-list pickers (`Available` -> `Selected`) instead of a single multi-select list
  - move controls allow explicit add/remove between columns
  - picker surfaces use the app's dark modal palette for visual consistency
  - invalid zone names are highlighted inline in the modal and focused on save validation failure
- Active config-host `mongos` startup/restart sequencing is ordered around host/network changes:
  - on initial sharding, `mongos` starts only after host sync + latency apply
  - on app/config relocation, `mongos` is stopped before network/hosts/netem updates and started before workload restart
- Network-failure actions use the multi-network model:
  - single-node failure disconnects that node from local, intra-region, and inter-region links
  - data-center failure disconnects site members from intra/inter-region links while preserving local data-center links

## Topology and configuration

MongoDB replica nodes and `ApplicationServer` are **not** defined in the committed `docker-compose.yml`. After you **apply a configuration template** (Configurations in the UI, or `POST /api/configurations/apply`), the server writes `docker-compose.generated.yml` from `templateTopology` in `server/data/settings.json` and brings up containers whose names match the template node names. Replica set names and seed URIs come from the template.

`analytics` members are optional and can be added at runtime.

## Core Capabilities

- Start and initialize the stack and replica set.
- Live status updates over SSE for replica health and workload telemetry.
- Dual-view dashboard:
  - topology canvas with data-center segments and contextual actions
  - geographic map with pin-based data-center inspection
- Right-click member actions:
  - Stop MongoDB (graceful)
  - Crash MongoDB (hard stop)
  - Increase/decrease priority
  - Stop/start server container
  - Isolate/reconnect server network
  - Set status node
  - Remove node (non-primary only)
- Right-click canvas actions:
  - Add node
  - Data center network failure/recovery
  - Shard Replica Set (hidden once the cluster is already sharded)
- In-app Help system:
  - Header `Help` button opens a modal with topic sidebar + markdown content pane
  - Help topics are loaded from `web/help/*.md` and rendered client-side
  - Modal supports close button, backdrop click, and `Escape` key close

## Network Model (Implemented)

Each active node can participate in three network layers:

- Site-local network: `dc-<siteId>-net` (same data center only)
- Intra-region network: one of `amer-net`, `emea-net`, `apac-net`, `latam-net`
- Inter-region networks: region pair links (for example `amer-emea-net`)

Host-entry precedence in managed `/etc/hosts` blocks is:
1. same data center (site-local IP)
2. same region (intra-region IP)

Failure actions:
- Server Network Failure (node-level): disconnects the target from local + intra-region + inter-region links
- Data Center Network Failure (site-level): disconnects all site members from intra/inter-region links while preserving local site connectivity

## Settings Modal

The `Settings` modal currently includes:

- MongoDB Write Concern:
  - `majority` (default)
  - Integer values from `0` to the current number of voting members
- MongoDB Read Concern:
  - `local` (default), `available`, `majority`, `linearizable`, `snapshot`
- Replica set `electionTimeout` input (`1000` to `10000`, default `10000`)
- `Edit Zones` button (shown only when the cluster is sharded)

Deployment is **consolidated-only**: the `ApplicationServer` container hosts config-server and `mongos` processes (there is no separate `ConfigServer` service).

Behavior:
- `Save` applies write concern, read concern, and election timeout.
- If none of those values changed, `Save` closes the modal without re-applying.
- Application-server location and read preference are configured directly from the workload console (not from this modal).
- In the `Edit Zones` modal:
  - each zone shows dual-column pickers for countries and shard assignment
  - countries already assigned to other zones are hidden from the available list
  - invalid zone-name validation is shown on the relevant zone card (inline), not only in the global status text

## Sharding Flow (Current Implementation)

At a glance:
1. Confirm sharding and provide initial shard name (`^[A-Za-z0-9_-]+$`).
2. Configure `ApplicationServer` as the config-server and `mongos` host.
3. Convert existing replica-set members to `shardsvr` and restart/verify.
4. Reconcile managed networks and `/etc/hosts`, re-apply latency shaping, then start `mongos`.
5. Register the existing replica set via `addShard`, then validate with `sh.status()`.

Technical details:
- The active config host is always `ApplicationServer`, using:
  - `/etc/mongod.conf`: `port 27019`, `bindIp 0.0.0.0`, `replication.replSetName config-repl-set`, `sharding.clusterRole configsvr`
  - `/etc/mongos.conf`: `sharding.configDB config-repl-set/ApplicationServer:27019`
- Network attachments for the application/config role include site-local (`dc-<siteId>-net`), the site region network (`amer-net`, `emea-net`, `apac-net`, `latam-net`), and relevant inter-region links.

After sharding:
- Replica members table includes a `Shard` column.
- Topology nodes render shard name beneath node name (above role).

### Add Node In Sharded Mode

When the cluster is already sharded, `Add Node` requires a shard name.

- If shard name matches an existing shard:
  - The backend resolves that shard's current primary.
  - The new node is configured as `shardsvr` with that shard's replica set name.
  - The node is added to the existing replica set via `rs.add(...)`.
- If shard name does not match an existing shard:
  - UI asks for confirmation to create a new shard.
  - The first node must be `Voting` (`Analytics` is rejected).
  - A shard-specific init script (`/scripts/init-<shard>-rs.js`) is generated and executed.
  - The new replica set is registered with `addShard`.
  - `sh.status()` is validated to confirm shard name and new host are present.

Shard name validation is strict: letters, numbers, hyphen, underscore (`^[A-Za-z0-9_-]+$`).

## Application Server Location Behavior

At a glance:
- There is **one ApplicationServer container per configured data center** (up to four), each pinned to that data center’s network set at deploy time.
- The **Application Server Location** selector chooses which instance supplies the workload console stream (logs/metrics) and runs `workload.js`; it does **not** move containers between networks.
- Managed `/etc/hosts` entries are rebuilt (site-local peers first, then same-region peers). In sharded mode, additional entries on `application-server-mesh-net` connect ApplicationServer instances for mongos → config traffic (no netem latency on that network).
- Host entries are re-synced after member add/remove events.
- Latency simulation is re-applied via `netem-multi-network.sh` (targets are listed in `server/data/netem-target-containers.txt` after compose generation).
- `POST /api/application-server/location` returns `relocationSequence` for observability.

Location change sequence (workload only):
1. Stop workload on the **previous** ApplicationServer instance (if running).
2. Persist the new location.
3. Start workload on the **new** active instance (if it was running before).

Sharded mode additionally uses a **config replica set** on the **first** data center’s ApplicationServer (`dataCenters[0]`); other ApplicationServer instances run `mongos` with `configDB` pointing at that host on the mesh network.

Unified settings persistence:
- Stored in `server/data/settings.json`
- Includes both application-server settings and configurable data-center definitions
- If `settings.json` is missing on first start, a one-time import runs from legacy `server/data/application-server-location.json` (then that file is deleted). Otherwise all settings come only from `settings.json`

Data-center configuration rules (`settings.json`):
- Define up to 4 entries in `dataCenters`, each with `name`, `city`, and ISO alpha-2 `country`
- Optional explicit coordinates per entry:
  - `lat` (latitude, number from `-90` to `90`)
  - `lng` (longitude, number from `-180` to `180`)
- If either coordinate is missing/invalid, map placement falls back to:
  1. country centroid from world GeoJSON (when country code resolves)
  2. region default (`AMER`/`EMEA`/`APAC`/`LATAM`) if country centroid is unavailable
- Entries with invalid country codes are ignored and replaced by unused defaults
- If fewer than 4 valid entries are present, defaults are appended until there are 4
- If more than 4 entries are present, entries after the fourth are ignored
- Country codes are enforced as unique across the final 4 configured entries
- Country-to-region mapping binds each configured center to one of: `AMER`, `EMEA`, `APAC`, `LATAM`
- Application Server location is normalized to a valid configured data-center ID; invalid values are moved to the first configured data center

Example entry:

```json
{
  "id": "amer-mexico-city-mx",
  "name": "MEXICO",
  "city": "Mexico City",
  "country": "MX",
  "lat": 19.4326,
  "lng": -99.1332
}
```

## Notes on Scope

- This README describes behavior currently implemented in the running app.
- Region mapping is determined from configured country codes using the server-side country-to-region map.
- `zones.json` remains separate from `settings.json`.

## Workload Console

The workload console shows:
- `Workload Console <flag>` for current application-server location
- User's Location selector (`MDB_USER_LOCATION`)
- Application Server Location selector
- Read Preference selector
- Last read value:
  - from `[READ:default]` when not sharded
  - from `[READ:mongos]` once sharded
- Chart grid (2x2), with layout-specific chart visibility controls:
  - `Node Monitor Layout` latency toggles are independent from `Geographic Layout` latency toggles
  - Node defaults: write latency shown, read latency shown
- Collapsible workload console output section

Runtime behavior:
- Changing Application Server Location from the workload console applies immediately.
- Changing Read Preference from the workload console applies immediately.
- Workload reads MongoDB concern/preference settings from environment/runtime configuration and rebinds collection options when settings change.

In `Geographic Layout`, the workload panel is intentionally simplified:
- Keep core controls/selectors
- Hide time-since charts
- Show read/write latency charts stacked vertically
- Show chart visibility controls for read/write latency charts only
- Default geographic chart visibility:
  - read latency: shown
  - write latency: hidden
- Geographic latency toggles are independent from Node Monitor latency toggles
- Hide console output panel

## In-App Help System

Use the header `Help` button in `Node Monitor Layout` to open the documentation modal.

Current help topics:
- `Replica Topology Context Menus`
  - Documents node and canvas context-menu actions
  - Includes simulated failure/recovery behavior and underlying Docker/Bash operations
- `Workload Application`
  - Explains workload purpose and what each chart represents
- `Shard Zones`
  - Explains zone purpose, prerequisites, and setup flow through `Settings` -> `Edit Zones`
- `Other Controls`
  - Covers key global/workload/layout controls and visibility toggles

Help content source files:
- `web/help/replica-topology-context-menus.md`
- `web/help/workload-application.md`
- `web/help/shard-zones.md`
- `web/help/other-controls.md`

## Read-only dashboard and admin control

Whether the UI opens in **read-only** mode depends on the **admin password file** (see below). In all modes, **at most one browser session** is the active **operator** (admin view); everyone else is read-only until they claim or take over.

| Password file | Claiming admin | Mutating APIs |
| --- | --- | --- |
| **Present** (non-empty first line) | **Admin** modal: enter the shared password. | Require a valid controller session (`X-Session-Id` + `Authorization: Bearer <token>`) except `POST /api/ui-control/claim`. |
| **Absent** or **empty** | **No password**: the first connected session **auto-claims** operator. Later sessions are asked on load whether to **assume admin**; **Yes** takes over (previous session becomes read-only), **No** stays read-only. You can also use **Admin** → **Assume admin**; if another session is operator, the UI confirms takeover (same as password mode after a `409` conflict). | Same as password mode: mutating `POST` routes require a valid controller token; `POST /api/ui-control/claim` does not. |

Status payloads include `uiControl.controllerSessionId`, `uiControl.passwordRequiredForClaim`, and `uiControl.adminClaimRequired` (the last two match: `false` when the password file is missing or empty). Clients use these fields to show the right **Admin** modal (password vs passwordless) and to demote other tabs when `controllerSessionId` changes.

### When the password file **is** configured

**What observers see (read-only):**

- **Node Monitor Layout:** `Configurations`, `Settings`, `Start Workload`, and `Stop Workload` are hidden. **User's Location**, **Application Server Location**, and **Read Preference** are disabled (values still follow the server). Replica topology **context menus** (node and canvas) do not open. An **Admin** button appears next to **Help**.
- **Geographic Layout:** `Start Workload` and `Stop Workload` are hidden (header controls are already minimized in this layout). Switch to **Node Monitor Layout** to use **Admin** or **Help**.

**Becoming the operator (admin):**

1. Create a single-line password file: `server/data/adminPassword` (this path is gitignored).
2. In **Node Monitor Layout**, click **Admin**, enter the password, and submit.
3. The server issues a **controller token** for your browser **session** (`sessionStorage`). Mutating API calls send `X-Session-Id` and `Authorization: Bearer <token>`.

### When the password file **is** missing or empty

- New visitors start **read-only** until the UI obtains a controller token (first session auto-claims; no password field).
- If another session already holds operator when you connect, a **confirm** asks whether to assume admin; the other browser switches to read-only if you accept.
- From read-only, **Admin** opens the **Assume admin** flow (no password). If someone else is operator, you must **confirm** takeover before your view becomes admin.

**Single active controller (both modes):** If someone else already holds control and you complete a successful claim (correct password, or passwordless takeover after confirm), the previous session’s token is invalidated and that UI becomes read-only.

**API enforcement:** All mutating `POST` routes require a valid controller session except `POST /api/ui-control/claim`. Read-only clients still receive `GET` responses and SSE streams.

**Optional release:** `POST /api/ui-control/release` (with controller headers) lets the active operator step down without closing the browser.

**Security note:** When you use a password file, it is a shared secret on disk; use HTTPS in untrusted networks (see below). Without a password file, anyone who can reach the UI can take operator control (or take over); use a password in untrusted environments. TLS does not replace careful secret handling.

## HTTPS (TLS)

The server uses **HTTPS** when both of these files exist:

- `web/certificates/privkey.pem` — private key  
- `web/certificates/fullchain.pem` — certificate (full chain)

Paths are resolved from the server directory (`server/` → `../web/certificates/`). If either file is missing, the app starts over **plain HTTP** and logs a warning (unless you opt out; see environment variables).

**Environment variables:**

| Variable | Meaning |
| --- | --- |
| `USE_TLS=0` | Force HTTP even if certificate files are present; suppresses the “missing cert” warning when you intentionally run without TLS. |
| `USE_TLS=1` | Require TLS; startup **fails** if the PEM files are missing. |
| (unset) | Use HTTPS when both PEM files exist; otherwise HTTP with a warning. |

After startup, the console prints either `https://localhost:<PORT>` or `http://localhost:<PORT>`. Open the matching URL in the browser. Self-signed or mismatched hostnames will trigger normal browser certificate warnings until you trust the cert or align the cert CN/SAN with how you access the host.

## Prerequisites

- Docker Desktop (or Docker Engine + Compose plugin)
- Node.js 18+
- npm

## Install and Run

```bash
npm install
npm start
```

Open the URL printed at startup (for example [https://localhost:3000](https://localhost:3000) when TLS is enabled, or [http://localhost:3000](http://localhost:3000) when running without certificates). The default port is `3000` unless you set `PORT`.

## Quick Start

1. Start the application (`npm start`); stack startup and replica set initialization run automatically.
2. Optionally adjust `Settings`.
3. Click `Start Workload`.
4. Use node/data-center context menus to simulate failures and recoveries.
5. Use `Help` (Node Monitor Layout) to review action descriptions and workflow guidance.
6. Use `Reset Replica Set` to rebuild containers and restore startup defaults.
7. Use the workload-console selectors to change user location, app-server location, and read preference at runtime.

## API Endpoints

### Status and Streaming
- `GET /api/status` (includes `uiControl`: `controllerSessionId`, `passwordRequiredForClaim`, `adminClaimRequired` — the latter two are `false` when `server/data/adminPassword` is missing or empty)
- `GET /api/stream` (replica status SSE; same `uiControl` object in each `status` event)
- `GET /api/application-server/stream` (workload SSE)
- `GET /api/deployment-progress/stream?token=...` (SSE for long-running deployment steps; terminal `complete` event includes the same result payload the HTTP POST used to return)
- `GET /api/deployment-progress/status?token=...` (JSON: `running` | `done` | `error` | `unknown` — optional poll if the SSE drops)

### Stack and Replica Set
- `POST /api/stack/start`
- `POST /api/replicaset/init`
- `POST /api/replicaset/reset`
- `POST /api/replicaset/nodes/add` (`role`: `voting` or `analytics`)
- `POST /api/replicaset/nodes/remove`
- `POST /api/replicaset/shard` — body: `shardName`, **required** `progressToken`; returns **`202 Accepted`**; final result on deployment-progress SSE `complete` event

### MongoDB Process Controls
- `POST /api/mongodb/stop-graceful`
- `POST /api/mongodb/stop-hard`
- `POST /api/mongodb/start`
- `POST /api/mongodb/priority/increase`
- `POST /api/mongodb/priority/decrease`

### Network Controls
- `POST /api/network/isolate` (single server)
- `POST /api/network/connect` (single server recovery)
- `POST /api/network/datacenter/isolate` (`dataCenterId` payload)
- `POST /api/network/datacenter/connect` (`dataCenterId` payload)

### Application Server Controls
- `POST /api/application-server/start`
- `POST /api/application-server/stop`
- `POST /api/application-server/restart`
- `GET /api/application-server/location`
- `POST /api/application-server/location`
- `POST /api/application-server/user-location`

### Zone Controls
- `GET /api/zones`
- `POST /api/zones`

### Misc Controls
- `POST /api/status-node/set`
- `POST /api/container/stop`
- `POST /api/container/start`

### UI control (read-only vs operator)

- `POST /api/ui-control/claim` — body: `sessionId`, `password` (ignored when no password is configured), optional `forceTakeover` (required after a `409` with `conflict: true` if another session holds control). Returns `controllerToken` on success.
- `POST /api/ui-control/release` — requires valid controller `X-Session-Id` and `Authorization: Bearer <controllerToken>`; releases control.

### Configuration templates (API)

- `GET /api/configurations` — list templates (metadata from each `.json` file).
- `GET /api/configurations/save-context` — whether a template was applied this session and overwrite/save-as context.
- `GET /api/configurations/:id` — load one template by filename (e.g. `gcr-replica.json` or `gcr-replica`).
- `POST /api/configurations/validate` — body `{ "configuration": <template object> }`; returns `{ ok, errors[] }`.
- `POST /api/configurations/apply` — body: `configurationId` and/or inline `configuration`, and **required** `progressToken` (open the deployment-progress SSE first). Returns **`202 Accepted`** immediately with `{ ok, accepted, progressToken }` after validation; the rebuild runs in the background. Final `{ ok, ...applyResult, lastAppliedTemplateId }` is delivered on the SSE `complete` event (`data.result`).
- `POST /api/configurations/save` — body `mode`: `overwrite` | `saveAs`, optional `filename`, `name`, `description`; builds a template from current runtime settings (requires a prior successful apply).

Template files live in `server/config/templates/`. Legacy `deploymentProfile` keys in JSON are **ignored**; deployment is **consolidated-only** (ApplicationServer hosts configsvr + mongos).

## Configuration template format (JSON)

Authoritative rules are implemented in `server/lib/templateConfigs.js` (`validateTemplateShape`, `CONFIG_VERSION === 1`). `POST /api/configurations/validate` and file reads use the same checks.

### Template files on disk

- Directory: `server/config/templates/`.
- Filename (for `GET`/`save`): only the basename, no path segments. Allowed pattern: `^[a-zA-Z0-9._-]+\.json$` (`.json` appended if omitted). Resolved paths must stay under the templates directory.

### Top-level fields

| Field | Validation |
| --- | --- |
| `version` | Required. Must be exactly `1`. |
| `name` | Required non-empty string (human-readable template title). |
| `description` | Optional string; used when listing templates in the UI (defaults to empty if omitted). |
| `dataCenters` | Required array with **exactly four** objects. Each object must have: `id`, `region`, `name`, `country` (non-empty strings); `lat` and `lng` (finite numbers). IDs must be unique across the four entries and are the only valid values for node `dataCenter` fields. Shipped examples also include `city`; it is not validated by `validateTemplateShape` but is persisted when present. |
| `applicationServerLocation` | Required string; must equal one of the four `dataCenters[].id` values (the active Application Server / workload host for the template). |
| `electionTimeoutMs` | Required; must be an **integer** (e.g. `2000`). Template validation does **not** enforce the UI’s 1000–10000 ms range; prefer staying within that range for consistency with `POST /api/application-server/location`. |
| `writeConcern` | Required. Either the string `"majority"` or a **non-negative integer** (numeric quorum). |
| `readConcern` | Required. One of: `local`, `available`, `majority`, `linearizable`, `snapshot`. |
| `readPreference` | Required. One of: `primary`, `primaryPreferred`, `secondary`, `secondaryPreferred`, `nearest`. |
| `topologyShowShardLabels` | Optional. If present, must be a boolean (show shard names on topology nodes). |
| `latencies` | Required object. Must contain **`intraRegionMs`** and **`interRegionMs`**, each an object mapping **string keys** (Docker network names such as `amer-net`, `amer-emea-net`) to numeric millisecond values. Validation only requires those two nested objects to exist; key names are not enumerated in code (see shipped examples under `server/config/templates/`). Values are flattened to `server/data/netem-latencies.json` for `netem-multi-network.sh`. |
| `sharded` | Required boolean; determines which topology branch is required below. |

Additional properties may appear in hand-edited or exported JSON (for example `userLocation` in saved files). Only the fields handled in `persistTemplateConfiguration` are applied to settings and zones; unhandled keys are not written from a template apply.

### Unsharded topology (`sharded: false`)

| Field | Validation |
| --- | --- |
| `replicaSet` | Required object. |
| `replicaSet.name` | Required non-empty string (replica set name). |
| `replicaSet.nodes` | Required array with **at least one** node. |

### Sharded topology (`sharded: true`)

| Field | Validation |
| --- | --- |
| `shards` | Required array with **at least one** shard. |
| `shards[].name` | Required non-empty string per shard; shard names must be unique within the template. |
| `shards[].nodes` | Required array with **at least one** node per shard. |

### Node object (within `replicaSet.nodes` or `shards[].nodes`)

| Field | Validation |
| --- | --- |
| `name` | Required non-empty string (must match generated Docker service / member name). |
| `type` | Required: exactly `voting` or `readOnly` (analytics-style non-voting). |
| `priority` | Required numeric (finite). |
| `dataCenter` | Required string; must match one of the four `dataCenters[].id` values. |

### Zones (`sharded: true` only)

| Field | Validation |
| --- | --- |
| `zones` | Optional. If present, must be an **array**. Omitted or empty means no zone definitions in the template. |
| `zones[].name` | Required non-empty string per zone. |
| `zones[].countries` | Required **array** per zone (country codes; element-level validation is enforced again when saving zones at runtime). |
| `zones[].shards` | Required **array** per zone. Each entry must be a non-empty string that matches one of the `shards[].name` values in the same template. |

## Refactor Regression Harness

The `tests/` suite includes route-level and service-level parity checks; several can run without a live Docker stack:

- `npm run test:api-sse-baseline`
- `npm run test:deployment-profile`
- `npm run test:consolidated-sharding`
- `npm run test:template-failure-parity`
- `npm run test:templates`

## Key Files

- `docker-compose.yml` - shared networks and `NetemHelper` only; MongoDB/`ApplicationServer` services are generated
- `docker-compose.generated.yml` - generated at apply time (gitignored); merged with the base file for `docker compose`
- `scripts/init-rs.js` - legacy static bootstrap (template-driven flows use generated `init-rs-template-generated.js`)
- `server/index.js` - API routes and SSE endpoints; serves HTTPS when `web/certificates/privkey.pem` and `fullchain.pem` exist (see **HTTPS (TLS)**)
- `web/certificates/` - optional TLS key and full chain for HTTPS (`privkey.pem`, `fullchain.pem`)
- `server/lib/compose.js` - Docker, network, replica set, and sharding orchestration
- `server/lib/applicationServer.js` - workload process control and SSE stream
- `server/lib/applicationServerLocation.js` - persisted application-server settings store
- `scripts/workload.js` - workload script inside `ApplicationServer`
- `web/index.html` - UI structure, modals, menus
- `web/app.js` - frontend state, topology rendering, event handlers
- `web/styles.css` - UI styling
- `web/help/*.md` - help topics shown in the in-app Help modal

## Useful Commands

```bash
docker compose -p failovermonitor -f docker-compose.yml -f docker-compose.generated.yml ps
docker compose -p failovermonitor -f docker-compose.yml -f docker-compose.generated.yml exec -T <node_name> mongosh --quiet --file /scripts/summary.js
```

Use the replica node name from your applied template in place of `<node_name>`.

## Troubleshooting

- Docker daemon permission errors: ensure Docker is running and your shell can access the daemon socket.
- Port `3000` already in use: stop the conflicting process, then restart `npm start`.
- Browser shows a certificate warning: expected for self-signed certs; trust the cert for local dev or use a hostname that matches the certificate.
- Replica init reports already initialized: expected; initialization is idempotent.
- If location changes seem slow, inspect `POST /api/application-server/location` response for `relocationSequence` to see which step is taking time.
