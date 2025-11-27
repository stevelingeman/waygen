# Rectangle Functionality Specifications

## Overview
This document outlines the specifications and implementation details for the custom Rectangle Drawing and Editing modes in the Waygen application. These modes are built on top of `mapbox-gl-draw` but enforce strict axis-aligned rectangular constraints.

## Data Model
- **Feature Type**: GeoJSON `Polygon`.
- **Coordinates**: A single closed ring of 5 coordinates (4 corners + closing point).
- **Properties**:
    -   `isRectangle`: `true` (Boolean or String). Used to identify the feature as a rectangle.
    -   **Note**: The application also uses a geometric check (is it a 4-sided polygon?) to robustly identify rectangles even if this property is lost.

## Modes

### 1. DragRectangleMode
**File**: `src/logic/DragRectangleMode.js`

#### Purpose
Allows the user to create a new rectangle by clicking and dragging on the map.

#### Behavior
1.  **Start**: User clicks on the map. This point is recorded as the `startPoint`.
2.  **Drag**: As the user drags, a rectangle is dynamically drawn defined by the bounding box of the `startPoint` and the current mouse position.
3.  **Stop**: User releases the mouse. The final polygon is added to the map, and the mode switches to `simple_select`.

#### Key Implementation Details
-   **Winding**: The polygon coordinates are generated in a consistent order (Top-Left -> Top-Right -> Bottom-Right -> Bottom-Left -> Close) to ensure predictability.
-   **Properties**: Sets `isRectangle: true` on creation.

### 2. DirectSelectRectangleMode
**File**: `src/logic/DirectSelectRectangleMode.js`

#### Purpose
Allows the user to edit an existing rectangle while maintaining its rectangular shape. It overrides the default `direct_select` behavior which allows arbitrary vertex movement.

#### Behavior
1.  **Selection**: When a rectangle is selected, it enters this mode.
2.  **Handles**:
    -   **Corner Handles**: Standard white vertices at the 4 corners.
    -   **Midpoint Handles**: **SUPPRESSED**. The default "add point" handles are explicitly removed to prevent users from turning the rectangle into a complex polygon.
3.  **Resizing**:
    -   Dragging a **Corner Handle** scales the rectangle.
    -   The **Opposite Corner** remains fixed (the anchor).
    -   The rectangle is re-calculated based on the new bounding box of the Fixed Corner and the Dragged Corner.

#### Key Implementation Details
-   **`isRectangle(feature)`**: A helper function that determines if the custom logic should apply. It checks for the `isRectangle` property OR if the geometry is a 5-point polygon (Quad).
-   **`onDrag` Override**: Intercepts vertex dragging. It calculates the new bounding box and uses `feature.incomingCoords()` to update the geometry, enforcing the rectangle constraint.
-   **Midpoint Suppression**:
    -   In `toDisplayFeatures`, we wrap the `display` callback passed to the parent `DirectMode.toDisplayFeatures`.
    -   We filter out any features with `properties.meta === 'midpoint'`.
    -   This prevents the "add point" handles from ever being rendered.

## Future Maintenance
-   **Adding Midpoints**: If side-resizing is desired in the future, custom handles (Points with custom properties) must be added in `toDisplayFeatures`. Do **NOT** rely on the default `mapbox-gl-draw` midpoints, as they add vertices to the polygon geometry, which breaks the rectangle constraint.
-   **Rotation**: Currently, this implementation only supports axis-aligned rectangles (North-South/East-West). Supporting rotation would require a significantly more complex data model (e.g., storing center, width, height, and bearing) and coordinate calculation logic.
