# Shard Zones

**Zones** tie **geographic** labels (countries) to **shards** so you can model data placement and see it reflected on the map and in shard tables.

## Why use zones

- Show which countries are associated with which shards in the **Geographic** view.
- Drive MongoDB **zone/tag** configuration through the cluster router so ranges align with your demo scenario.
- Make sharded behavior easier to explain alongside the global map.

## Before you start

- The cluster must already be **sharded**. Until then, **Edit Zones** stays hidden in **Settings**.
- Zone names must follow the validation rules shown in the editor (letters and numbers only).

## How to configure zones

1. Open **Settings** (from **Node Monitor Layout**).
2. Click **Edit Zones**.
3. Add or edit zones. For each zone you typically assign:
   - One or more **countries**
   - One or more **shards**
4. Save zones.

The application sends the appropriate administrative commands through **mongos** (the router runs on the Application Server in this deployment). After a successful save, balancer/tag configuration is updated to match your definitions.

## After saving

- Zone definitions are stored by the application and used when rendering the map legend and shard-related tables.
- If something fails validation, the editor highlights the problem on the relevant zone before the save completes.

## Tips

- Prefer clear, stable zone names for demos.
- Avoid accidental overlap of countries across zones unless you intend to model that scenario.
- After large zone changes, briefly confirm reads/writes and map highlights still match expectations.
