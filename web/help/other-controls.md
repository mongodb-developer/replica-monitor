# Other Controls and Buttons

This page describes the main controls outside the replica **context menus** (right-click on a node or the canvas). For node and canvas actions, see **Replica Topology Context Menus**.

## Header (Node Monitor Layout)

In **Node Monitor Layout**, the upper-right actions are:

| Control | Purpose |
| --- | --- |
| **Configurations** | Opens the configuration template list. Pick a template, read its description, then confirm to **apply** it. Applying rebuilds the Docker stack from that template and runs initialization (and sharding steps when the template is sharded). Long applies show a **deployment progress** dialog with step-by-step status. |
| **Settings** | Opens **Settings**: MongoDB write/read concern, replica set **election timeout**, optional **Edit Zones** (only when the cluster is sharded), and **Show shard names on replica topology nodes**. Application **server location** and **read preference** are changed from the workload panel, not here. |
| **Help** | Opens this help window (topics on the left, content on the right). |
| **Admin** | Appears only in **read-only** mode (see **Read-only and admin** below). Unlocks full controls for **this browser** after you enter the admin password. |

There is no **Reset** or **Refresh** button in the header. Status updates continuously via live connections; to fully reset the Docker stack and re-initialize the replica set (for example from automation), the server exposes `POST /api/replicaset/reset`—ask your administrator if you need that workflow.

## Read-only and admin (operator) mode

By default the dashboard opens in **read-only** mode so many people can watch status without changing the cluster or workload. In read-only mode, destructive and configuration actions are hidden or disabled.

**What is limited in read-only (typical):**

| Area | Read-only behavior |
| --- | --- |
| **Header** | **Configurations** and **Settings** are hidden. **Admin** is shown next to **Help**. |
| **Workload** | **Start Workload** / **Stop Workload** are hidden. **User's Location**, **Application Server Location**, and **Read Preference** are shown but **disabled** (you still see current values). |
| **Geographic Layout** | **Start** / **Stop Workload** are hidden; header action buttons (including **Help** and **Admin**) are hidden—switch to **Node Monitor Layout** to use them. |
| **Replica topology** | Right-click **context menus** on nodes and canvas do not open. |

**Switching to admin (operator) for this browser**

1. Use **Node Monitor Layout** (required so **Admin** is visible).
2. Click **Admin**, enter the password your administrator gave you, and confirm (**Unlock**).
3. The UI switches to **full control**: the same controls as before read-only restrictions, and **Admin** is hidden while you hold the session.

Only **one** browser session at a time can hold operator control. If someone else is already the operator and you enter the correct password, you are asked whether to **take over**; if you confirm, your session becomes the operator and the previous session returns to read-only automatically (no need to reload the page).

To stop being the operator without closing the tab, your deployment may expose a release action; ask your administrator.

## Geographic Layout and hidden controls

When you switch to **Geographic Layout**, the header buttons **Configurations**, **Settings**, **Help**, and **Admin** are hidden so the map and workload stay primary. Switch back to **Node Monitor Layout** to open configurations, change election timeout or concerns, read help, or use **Admin**.

The title row (app name, connection badge, and status text) stays visible.

## Layout toggle

| Control | Purpose |
| --- | --- |
| **Node Monitor Layout** | Topology canvas, replica and shard tables, full workload charts and toggles. |
| **Geographic Layout** | World map (data centers, zone highlights, role pulses), simplified workload strip, and **Data Center Nodes** table. Time-since charts and the console output block are not shown in this layout. |

## Workload section

| Control | Purpose |
| --- | --- |
| **Start Workload** / **Stop Workload** | Starts or stops the synthetic read/write process in the selected **Application Server** container. |
| **User's Location** | Sets the simulated client country (used with location-aware behavior and the map). |
| **Application Server Location** | Chooses which Application Server instance runs the workload and streams the console (does not move containers between data centers). |
| **Read Preference** | Driver read preference for the workload (hot-updated while running). |
| **Last read value** | Summary of recent read activity; labeling reflects unsharded vs sharded routing (for example mongos after sharding). |
| **Visible charts** / **Latency charts** | Checkboxes to show or hide metric charts. Node Monitor and Geographic layouts remember **separate** visibility settings. |
| **Console Output** | **Expand** / **Collapse** toggles the workload log area. |

## Optional sections

- **Replica Members** and **Shard Data** can be collapsed to save space; **Shard Data** only applies when the cluster is sharded.

Use these controls to focus the dashboard during demos or troubleshooting.
