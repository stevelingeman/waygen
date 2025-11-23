# Feature: Camera Footprint Visualization
**Status:** [NEW]

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