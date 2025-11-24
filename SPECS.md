# SPEC: Fix WPML Waypoint Speed Export

## Context
The `djiExporter.js` utility currently hardcodes the flight speed to 10m/s in the generated `waylines.wpml` file. It must instead use the specific speed assigned to each waypoint to respect the calculated safe limits and user overrides.

## Requirements

1.  **Update `djiExporter.js`**:
    - Locate the logic generating the `<wpml:waypointSpeed>` tag.
    - Bind this tag to the `speed` property of the waypoint object currently being iterated.
    - **Source of Truth**: `waypoint.speed` (Priority 1) -> `settings.speed` (Priority 2).

2.  **Verification**:
    - The output XML must read something like `<wpml:waypointSpeed>4.5</wpml:waypointSpeed>` (or whatever the calculated value is).
    - It must **not** stay at `10`.

## Constraints
- Do not alter the speed calculation logic itself (Store/Geospatial), only the *export* of that value.
- Ensure the value is formatted correctly (likely a float/integer string).