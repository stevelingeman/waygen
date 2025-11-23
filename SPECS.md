# Feature: Manual Waypoint Addition (Append Mode)
**Status:** Ready for Dev

## 1. Logic: Append Only
*   **Action:** When the user clicks the map with the "Add Waypoint" tool active:
*   **Result:** Create a new waypoint and `.push()` it to the **end** of the `waypoints` array.
*   **Sequence:** If there are 10 points, the new point is ALWAYS #11, regardless of what is currently selected.

## 2. Interaction
*   **Tool:** "Add Waypoint" icon in toolbar.
*   **Cursor:** Crosshair.
*   **Selection Behavior:** The new point should become the selected point (to highlight the tail of the path).

## 3. Data defaults
*   **Altitude/Speed:** Inherit from global defaults.