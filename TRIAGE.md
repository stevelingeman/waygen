# Triage: Polygon Disappears on Map Click

## Issue Description
After importing a session or drawing a polygon, if the user selects a waypoint (entering edit mode) and then clicks on the map to deselect/leave edit mode, the polygon disappears from the map. The waypoints remain visible.

## Steps to Reproduce
1.  Import a session (KMZ) or draw a polygon.
2.  Select a waypoint (click on a teardrop icon).
3.  Click anywhere on the map background (not on a waypoint or the polygon).
4.  **Result**: The polygon disappears.
5.  **Expected**: The polygon should remain visible; only the waypoint selection should be cleared.

## Initial Analysis
-   **Component**: `MapContainer.jsx`
-   **Suspect**: The `click` event listener on the map.
-   **Theory**: The click handler likely calls `onPolygonDrawn(null)` or triggers a state change that clears the `currentPolygon` in `App.jsx`, which then propagates back down to `MapContainer` via the `polygon` prop, causing the `useEffect` to clear the draw instance.

## Investigation Plan
1.  Examine the `map.current.on('click', ...)` handler in `MapContainer.jsx`.
2.  Check for any `draw.selectionchange` or `draw.delete` events that might be firing unexpectedly.
3.  Verify how `onPolygonDrawn` is called during map clicks.