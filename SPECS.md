# Feature: Camera Footprint Visualization
**Status:** [IMPLEMENTED]

## 1. Drone Database (Hardcoded Specs)
The dropdown must contain these exact models. Default to **DJI Mini 5 Pro**.

| Model Name | Horizontal FOV | Aspect Ratio |
| :--- | :--- | :--- |
| **DJI Mini 5 Pro** | **84.0°** | 4:3 |
| **DJI Mini 4 Pro** | **82.1°** | 4:3 |
| **DJI Mavic 4 Pro** | **72.0°** | 4:3 |
| **Custom** | *User Input* | 4:3 |

## 2. Store State
*   `selectedDroneModel`: String (Default: 'DJI Mini 5 Pro')
*   `customFOV`: Number (Default: 84)
*   **Logic:** If `selectedDroneModel` is NOT 'Custom', look up the FOV from the database. If 'Custom', use `customFOV`.

## 3. Footprint Math (The Logic)
For each waypoint, calculate the 4 corners of the image projection on the ground.
*   **Inputs:** Altitude ($h$), Horizontal FOV ($HFOV$), Aspect Ratio (4:3), Heading/Yaw ($yaw$).
*   **Step 1:** Calculate Dimensions.
    *   $Width = 2 * h * \tan(HFOV / 2)$
    *   $Height = Width * (3 / 4)$ (since 4:3 aspect ratio)
*   **Step 2:** Calculate Corners.
    *   Generate a rectangle centered on the waypoint (Lat/Lng).
    *   **Crucial:** Rotate the rectangle to match the waypoint's **Gimbal Yaw** (Heading).

## 4. Visualization Layer
*   **Type:** Mapbox `fill` layer.
*   **Opacity:** 0.3 (Semi-transparent).
*   **Color Palette:** Rotate through 4 distinct colors based on waypoint index (`index % 4`).
    1.  `#FF5733` (Red-Orange)
    2.  `#33FF57` (Green)
    3.  `#3357FF` (Blue)
    4.  `#F333FF` (Magenta)
*   **Toggle:** Add "Show Footprints" checkbox. Default to **OFF** (performance).

## 5. Overlap Settings (Split Control)
**Status:** [PENDING IMPLEMENTATION]

The single "Overlap" slider must be split into two distinct controls to allow for professional photogrammetry workflows (e.g., 70% Side / 80% Front).

### 5.1 UI Changes
*   **Remove:** Single "Overlap" slider.
*   **Add:** Two new sliders in the "Grid Settings" section:
    1.  **Side Overlap (Horizontal):**
        *   **Range:** 0% to 90%
        *   **Default:** 70%
# Feature: Camera Footprint Visualization
**Status:** [IMPLEMENTED]

## 1. Drone Database (Hardcoded Specs)
The dropdown must contain these exact models. Default to **DJI Mini 5 Pro**.

| Model Name | Horizontal FOV | Aspect Ratio |
| :--- | :--- | :--- |
| **DJI Mini 5 Pro** | **84.0°** | 4:3 |
| **DJI Mini 4 Pro** | **82.1°** | 4:3 |
| **DJI Mavic 4 Pro** | **72.0°** | 4:3 |
| **Custom** | *User Input* | 4:3 |

## 2. Store State
*   `selectedDroneModel`: String (Default: 'DJI Mini 5 Pro')
*   `customFOV`: Number (Default: 84)
*   **Logic:** If `selectedDroneModel` is NOT 'Custom', look up the FOV from the database. If 'Custom', use `customFOV`.

## 3. Footprint Math (The Logic)
For each waypoint, calculate the 4 corners of the image projection on the ground.
*   **Inputs:** Altitude ($h$), Horizontal FOV ($HFOV$), Aspect Ratio (4:3), Heading/Yaw ($yaw$).
*   **Step 1:** Calculate Dimensions.
    *   $Width = 2 * h * \tan(HFOV / 2)$
    *   $Height = Width * (3 / 4)$ (since 4:3 aspect ratio)
*   **Step 2:** Calculate Corners.
    *   Generate a rectangle centered on the waypoint (Lat/Lng).
    *   **Crucial:** Rotate the rectangle to match the waypoint's **Gimbal Yaw** (Heading).

## 4. Visualization Layer
*   **Type:** Mapbox `fill` layer.
*   **Opacity:** 0.3 (Semi-transparent).
*   **Color Palette:** Rotate through 4 distinct colors based on waypoint index (`index % 4`).
    1.  `#FF5733` (Red-Orange)
    2.  `#33FF57` (Green)
    3.  `#3357FF` (Blue)
    4.  `#F333FF` (Magenta)
*   **Toggle:** Add "Show Footprints" checkbox. Default to **OFF** (performance).

## 5. Overlap Settings (Split Control)
**Status:** [IMPLEMENTED]

The single "Overlap" slider must be split into two distinct controls to allow for professional photogrammetry workflows (e.g., 70% Side / 80% Front).

### 5.1 UI Changes
*   **Remove:** Single "Overlap" slider.
*   **Add:** Two new sliders in the "Grid Settings" section:
    1.  **Side Overlap (Horizontal):**
        *   **Range:** 0% to 90%
        *   **Default:** 70%
        *   **Label:** "Side Overlap %"
    2.  **Front Overlap (Vertical):**
        *   **Range:** 0% to 90%
        *   **Default:** 80%
        *   **Label:** "Front Overlap %"

### 5.2 Logic Updates
*   **Goal:** Use separate variables for line spacing and waypoint spacing.
*   **Side Overlap** (Horizontal):
    *   Replace `overlap` with `sideOverlap` in the **Line Spacing** calculation.
    *   *Existing Formula:* `lineSpacingMeters = imageWidth * (1 - (sideOverlap / 100))`
*   **Front Overlap** (Vertical):
    *   Replace `overlap` with `frontOverlap` in the **Point Spacing** calculation.
    *   *Existing Formula:* `frontSpacingMeters = groundHeight * (1 - (frontOverlap / 100))`

### 5.3 Store State
*   **Update** `useMissionStore`:
    *   Remove `overlap` (or migrate it).
    *   Add `sideOverlap` (Number, default 70).
    *   Add `frontOverlap` (Number, default 80).

## 6. Sidebar UI Refinements
**Status:** [PENDING IMPLEMENTATION]

The sidebar menu requires restructuring to improve usability and logical grouping.

### 6.1 "Basics" Section
*   **Move:** "Drone Model (FOV)" dropdown from "Camera" to "Basics".
    *   *Reason:* Drone selection is a fundamental setting that affects path generation geometry.

### 6.2 "Camera" Section
*   **Remove:** "Photo Interval (s)" input.
    *   *Reason:* When "Take Photo" is selected, the interval is determined spatially by the **Front Overlap** setting (distance between waypoints), not by time.
    *   *Action:* Remove the conditional input that appears when `waypointAction === 'photo'`.

### 6.3 "Advanced" Section
*   **Move:** "Show Footprints" checkbox from "Camera" to "Advanced".
    *   *Reason:* This is a visualization aid, not a core camera setting.