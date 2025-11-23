# Feature: Waypoint Drag & Drop
**Mode:** Single Point Edit
**Status:** Ready for Dev

## 1. UX Requirements
*   **Interaction:** Click-and-hold on a waypoint -> Drag -> Release.
*   **Cursor:** Change to `move` (grab hand) when hovering over a waypoint.
*   **Selection:** If multiple points are selected, **IGNORE** the selection for the move operation. Only the specific point under the mouse cursor moves.

## 2. Technical Implementation (Event Loop)
We must use **Native Mapbox Events** on the Waypoint Layer (not Mapbox Draw).

### Step A: The Setup
*   Define a mutable reference (or local state) to track: `draggedPointID`.
*   Ensure the Waypoint Layer has `interactive: true`.

### Step B: The Event Chain
1.  **`mousedown` (on 'waypoint-layer'):**
    *   Stop event propagation.
    *   Disable `map.dragPan` (lock the camera).
    *   Set `canvas.style.cursor = 'grabbing'`.
    *   Capture the `feature.id` (or index) of the point.
2.  **`mousemove` (on 'map'):**
    *   *Condition:* Only if `draggedPointID` is set.
    *   *Action:* Update the specific feature's coordinates in the **GeoJSON Source** directly (`source.setData(...)`).
    *   *Constraint:* Do **NOT** update the global Store (`useMissionStore`) on every pixel move. It causes React re-render lag.
3.  **`mouseup` (on 'map'):**
    *   *Action:* Commit the final coordinates to `useMissionStore` (Update the "Source of Truth").
    *   Enable `map.dragPan`.
    *   Reset cursor to `grab` or default.
    *   Clear `draggedPointID`.