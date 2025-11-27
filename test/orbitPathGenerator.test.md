# Orbit Path Generator Test Cases

This document outlines test cases for the `generateOrbitPath` function in `src/logic/pathGenerator.js`, focusing on the new `startAngle`, `direction`, and `numberOfOrbits` parameters.

## Test Setup

- **Center Point**: `[-74.0060, 40.7128]` (New York City)
- **Radius**: `100` meters (This will determine the circumference)
- **Spacing**: `10` meters (distance between waypoints along the perimeter)
- **Altitude**: `50` meters
- **Speed**: `5` m/s
- **Gimbal Pitch**: `-90` degrees
- **Waypoint Action**: `'none'`
- **Straighten Legs**: `false`

## Test Cases

### Test Case 1: Default Orbit (startAngle=0, direction='counter-clockwise', numberOfOrbits=1.0)

- **Input Settings**:
    - `startAngle: 0`
    - `direction: 'counter-clockwise'`
    - `numberOfOrbits: 1.0`
- **Expected Behavior**:
    - Generates a full circle (one orbit) starting from East (0 degrees relative to spec), rotating counter-clockwise.
    - The first waypoint should be at `[center.lng + radius, center.lat]` (approximately, considering projection and turf.destination).
    - The last waypoint should be very close to the first, completing the loop.
    - Headings of waypoints should point towards the center.
    - Number of waypoints should be approximately `(2 * PI * radius) / spacing`.

### Test Case 2: Start Angle = 90 (North), Counter-Clockwise, One Orbit

- **Input Settings**:
    - `startAngle: 90`
    - `direction: 'counter-clockwise'`
    - `numberOfOrbits: 1.0`
- **Expected Behavior**:
    - Generates a full circle starting from North, rotating counter-clockwise.
    - First waypoint should be at `[center.lng, center.lat + radius]` (approximately).
    - Last waypoint very close to first.
    - Headings towards center.

### Test Case 3: Start Angle = 180 (West), Clockwise, One Orbit

- **Input Settings**:
    - `startAngle: 180`
    - `direction: 'clockwise'`
    - `numberOfOrbits: 1.0`
- **Expected Behavior**:
    - Generates a full circle starting from West, rotating clockwise.
    - First waypoint should be at `[center.lng - radius, center.lat]` (approximately).
    - Last waypoint very close to first.
    - Headings towards center.

### Test Case 4: Half Orbit (numberOfOrbits=0.5)

- **Input Settings**:
    - `startAngle: 0`
    - `direction: 'counter-clockwise'`
    - `numberOfOrbits: 0.5`
- **Expected Behavior**:
    - Generates half a circle (180 degrees sweep) starting from East, rotating counter-clockwise.
    - Number of waypoints approximately half of a full orbit.
    - Path should extend from East to West via North.
    - Last waypoint should be approximately at `[center.lng - radius, center.lat]`.

### Test Case 5: Multiple Orbits (numberOfOrbits=2.5), Clockwise

- **Input Settings**:
    - `startAngle: 90`
    - `direction: 'clockwise'`
    - `numberOfOrbits: 2.5`
- **Expected Behavior**:
    - Generates two and a half circles starting from North, rotating clockwise.
    - Total sweep of `2.5 * 360 = 900` degrees.
    - Number of waypoints approximately `2.5` times a full orbit.
    - Path should end at a position 180 degrees clockwise from the start (relative to the center).

### Test Case 6: Minimum Number of Orbits (numberOfOrbits=0.1)

- **Input Settings**:
    - `startAngle: 0`
    - `direction: 'counter-clockwise'`
    - `numberOfOrbits: 0.05` (should be clamped to 0.1)
- **Expected Behavior**:
    - Generates a small arc (36 degrees sweep) starting from East, rotating counter-clockwise.
    - Number of waypoints should correspond to 0.1 of a full orbit.
    - The `actualNumberOfOrbits` in the code should be `0.1`.

## Verification Steps (Manual)

1.  **Generate Path**: Use the Waygen UI to create a polygon (e.g., a small rectangle) and configure the orbit settings according to each test case. Click "Generate Path".
2.  **Inspect Map**: Visually verify the starting point, direction of rotation, and the extent of the orbit (e.g., full circle, half circle, multiple circles).
3.  **Inspect Waypoint Data**: If possible, inspect the generated waypoint data (e.g., through developer console) to verify:
    - The coordinates of the first and last waypoints match expectations.
    - The total number of waypoints is approximately correct.
    - The `heading` values generally point towards the center of the orbit.
