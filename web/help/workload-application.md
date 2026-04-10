# Workload Application

The workload is a **synthetic application** that runs inside an **Application Server** container. It issues repeated reads and writes against MongoDB so you can see elections, latency, partitions, and routing changes in real time on the dashboard.

## Why it exists

- Keeps the charts and “last read” summary meaningful while you operate the cluster.
- Makes failover, network isolation, and sharding transitions visible within seconds.
- Lets you compare **Node Monitor** and **Geographic** views under the same traffic.

## Main controls

In **read-only** mode, **Start** / **Stop Workload** and the three workload selectors may be hidden or disabled until an operator unlocks the UI (see **Other Controls** → **Read-only and admin**). You can still watch charts and status.

| Control | What it does |
| --- | --- |
| **Start Workload** | Starts the workload process on the **Application Server** instance selected by **Application Server Location**. |
| **Stop Workload** | Stops that process; no new synthetic operations until you start again. |
| **User's Location** | Sets the simulated end-user country (ISO code). Used for location-aware read behavior together with the map. |
| **Application Server Location** | Selects **which** Application Server container runs the workload and sends console output. This selects **stream source**, not physical container migration. |
| **Read Preference** | MongoDB read preference for the workload client (`primary`, `secondary`, `nearest`, etc.). Changes apply while the workload is running. |

**Write concern**, **read concern**, and **replica set election timeout** are configured in **Settings** (header), not in the workload strip.

## Charts (Node Monitor Layout)

| Chart | How to read it |
| --- | --- |
| **Time since last write** | Seconds since the last successful write. A climbing value often means writes are blocked or the primary is unavailable. |
| **Time since last read** | Seconds since the last successful read. Climbs when reads fail or stall. |
| **Write latency** | Recent write round-trip times; spikes during failovers or heavy contention. |
| **Read latency** | Recent read round-trip times; spikes during routing changes, lag, or network issues. |

In **Geographic Layout**, only the **latency** charts are offered (time-since charts are hidden), and the default visibility may differ—use the **Latency charts** toggles.

## Last read value and console

- **Last read value** shows a concise view of recent read results. Before sharding, labeling reflects direct replica-set reads; after sharding, it reflects routing via **mongos** as summarized in the UI.
- **Console Output** streams workload log lines from the active Application Server. Expand it when you need raw timestamps and messages.

## What to watch during events

- **Primary loss / election:** write latency often spikes first; time-since-write may climb until a new primary accepts writes.
- **Network partition:** read and write latency may spike; one or both time-since charts may climb.
- **Recovery:** latencies settle and time-since values drop as operations succeed again.
