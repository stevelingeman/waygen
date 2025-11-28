# Insert Waypoint Specification

## Overview
This feature allows users to easily subdivide a flight segment by inserting a new waypoint exactly between two existing, adjacent waypoints. This is particularly useful for refining flight paths or adding specific actions mid-leg without manually creating and positioning a new point.

## Functional Requirements

### 1. Trigger Conditions
The "Insert Waypoint" functionality shall be available **only** when the following conditions are strictly met:
*   **Selection Count**: Exactly two (2) waypoints are currently selected.
*   **Adjacency**: The selected waypoints must be sequential in the mission path (e.g., Waypoint $N$ and Waypoint $N+1$).
    *   *Note*: Selection order does not matter; selecting $N+1$ then $N$ is valid.

### 2. User Interface
*   **Location**: The `EditSelectedPanel` (the sidebar panel visible when items are selected).
*   **Component**: A new button labeled "Insert Waypoint" (or an appropriate icon with tooltip).
*   **Visibility/State**:
    *   If conditions are met: Button is **Visible** and **Enabled**.
    *   If conditions are NOT met (e.g., 1 point, 3+ points, or 2 non-adjacent points): Button is **Hidden** or **Disabled**.

### 3. Insertion Logic
When the action is triggered:
1.  **Position Calculation**: Calculate the geographic midpoint (average Latitude and Longitude) between the two selected waypoints.
2.  **Attribute Inheritance**: The new waypoint must inherit **all** attributes from the **first** waypoint of the pair (the one with the lower index/order in the path).
    *   **Attributes to Inherit**:
        *   Altitude
        *   Speed
        *   Gimbal Pitch
        *   Heading
        *   Turn Mode (`straightenLegs`)
        *   Action (e.g., 'photo', 'none')
    *   **Attributes NOT Inherited**:
        *   `id` (Must be a new unique identifier)
        *   `lat` / `lng` (Derived from midpoint)
3.  **List Placement**: The new waypoint is inserted into the mission list at index $N+1$ (immediately after the first waypoint of the pair).

### 4. Post-Action State
*   **Selection**: (Recommended) The selection should update to selecting **only** the newly created waypoint to allow for immediate fine-tuning.
*   **History**: The action should be reversible (Undo/Redo compatible if applicable).

## Edge Cases
*   **Wrap-around**: If the mission is a closed loop, the "last" and "first" waypoints might be visually connected but are not index-adjacent in the array. This feature typically targets index-adjacency. Logic should strictly follow array indices unless explicitly designed for loop closure insertion (which is out of scope for this specific spec unless requested).
*   **Duplicate Coordinates**: If two adjacent waypoints share the exact same coordinates, the midpoint is identical. The insertion should still proceed (useful for adding actions at the same location).
