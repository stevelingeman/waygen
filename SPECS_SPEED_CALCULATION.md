# Speed Calculation & Flight Duration Warnings

## Overview

This specification defines the automatic calculation of maximum mission speed based on waypoint geometry and minimum photo interval constraints, along with flight duration warnings to prevent battery exhaustion.

## Problem Statement

Drone cameras require a minimum interval between photos to write data to memory. For example, the DJI Mini 5 Pro requires ~5 seconds for 50MP photos. If waypoints are too close together and the drone travels too fast, it will arrive at the next waypoint before the camera is ready to take another photo, resulting in missed captures.

**Core Constraint**: The drone must not arrive at the next waypoint before the camera is ready to take another photo.

**Formula**: `transit_time ≥ photo_interval`

Therefore: `max_speed ≤ distance / photo_interval`

## Design Decisions

### 1. Speed Calculation Strategy

**Option Selected**: Conservative Minimum Distance Approach

- Calculate global speed based on the shortest waypoint segment
- Formula: `max_speed = min(all_segment_distances) / photo_interval`
- **Rationale**: Guarantees no photo timing failures; simple and predictable
- **Trade-off**: May be conservative if one segment is much shorter than others
- **Mitigation**: Advanced users can manually edit waypoints or override in DJI Fly app

### 2. Speed Enforcement

**Hard enforcement during generation** with manual override capability:
- Speed is auto-calculated and displayed as read-only
- No pre-generation validation
- Users can manually edit waypoints or adjust in DJI Fly app post-export

### 3. Photo Interval

**Locked to drone presets**:
- Default: 5.5 seconds (conservative, includes 0.5s safety buffer)
- Based on maximum resolution capture (photogrammetry standard)
- Photo interval is locked to selected drone model
- Recalculated only when path regenerates

### 4. Drone Database

**Centralized preset system** (`src/utils/dronePresets.js`):
- Stores: HFOV, photo interval, max flight time
- Easily extensible for future drone models
- Supports "Custom" option for unlisted drones

### 5. Flight Duration Warnings

**Soft warnings only** (no blocking):
- Compare estimated mission time against known max flight time
- Yellow warning at 85% threshold (configurable)
- Red warning at 100% threshold
- One-time popup per session
- Persistent tooltip on hover

## Technical Specification

### Constants

```javascript
FLIGHT_WARNING_THRESHOLD = 0.85 // Yellow warning at 85% of max flight time
TAKEOFF_LANDING_OVERHEAD = 120 // seconds (2 minutes)
DEFAULT_PHOTO_INTERVAL = 5.5 // seconds
```

### Speed Calculation Algorithm

```javascript
/**
 * Calculate maximum safe speed based on waypoint geometry
 * @param {Array} waypoints - Array of waypoint objects with lng, lat
 * @param {number} photoInterval - Minimum seconds between photos
 * @returns {number} Maximum speed in m/s
 */
function calculateMaxSpeed(waypoints, photoInterval) {
  if (waypoints.length < 2) return 0;
  
  const distances = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const distance = calculateDistance(waypoints[i], waypoints[i + 1]);
    distances.push(distance);
  }
  
  const minDistance = Math.min(...distances);
  const maxSpeed = minDistance / photoInterval;
  
  return maxSpeed;
}
```

### Mission Time Calculation

```javascript
/**
 * Calculate estimated mission time
 * @param {number} totalDistance - Total path distance in meters
 * @param {number} speed - Mission speed in m/s
 * @returns {number} Estimated mission time in seconds
 */
function calculateMissionTime(totalDistance, speed) {
  const transitTime = totalDistance / speed;
  const missionTime = transitTime + TAKEOFF_LANDING_OVERHEAD;
  
  return missionTime;
}
```

### Flight Warning Logic

```javascript
/**
 * Determine flight warning level
 * @param {number} missionTimeSeconds - Estimated mission time
 * @param {number} maxFlightTimeMinutes - Drone max flight time
 * @returns {string} 'safe' | 'warning' | 'critical'
 */
function getFlightWarningLevel(missionTimeSeconds, maxFlightTimeMinutes) {
  if (!maxFlightTimeMinutes) return 'safe'; // Custom drone
  
  const maxFlightTimeSeconds = maxFlightTimeMinutes * 60;
  const warningThreshold = maxFlightTimeSeconds * FLIGHT_WARNING_THRESHOLD;
  
  if (missionTimeSeconds >= maxFlightTimeSeconds) {
    return 'critical'; // Red
  } else if (missionTimeSeconds >= warningThreshold) {
    return 'warning'; // Yellow
  }
  
  return 'safe'; // Green/default
}
```

## Drone Presets Data Structure

```javascript
{
  'mini-4-pro': {
    name: 'DJI Mini 4 Pro',
    hfov: 82.1,              // degrees
    photoInterval: 5.5,      // seconds (max resolution)
    maxFlightTime: 31        // minutes (realistic mission time)
  },
  'mini-5-pro': {
    name: 'DJI Mini 5 Pro',
    hfov: 82.1,
    photoInterval: 5.5,
    maxFlightTime: 40
  },
  'mavic-4-pro': {
    name: 'DJI Mavic 4 Pro',
    hfov: 84,
    photoInterval: 5.5,      // Placeholder, pending research
    maxFlightTime: 40
  },
  'custom': {
    name: 'Custom',
    hfov: null,              // User must provide
    photoInterval: 5.5,      // Default conservative value
    maxFlightTime: null      // No flight warnings
  }
}
```

## User Experience Flow

1. **Camera Settings Selection**
   - User selects drone model from dropdown
   - Photo interval auto-populates (read-only)
   - HFOV auto-populates

2. **Path Generation**
   - User configures path settings (Grid/Perimeter, overlap, altitude)
   - Clicks "Generate Path"
   - System generates waypoints using existing logic

3. **Speed Auto-Calculation**
   - System calculates all segment distances
   - Finds minimum segment distance
   - Calculates: `max_speed = min_distance / photo_interval`

4. **Mission Stats Display**
   - Shows calculated max speed (read-only)
   - Displays minimum segment distance for context
   - Shows estimated mission time with color coding
   - Yellow/Red indicator if approaching/exceeding flight limits

5. **Flight Warning (if applicable)**
   - First time warning level changes to yellow/red per session
   - Popup dialog with acknowledgement
   - Tooltip available on hover for context

6. **Export**
   - User proceeds with download
   - KMZ exported with calculated speed
   - User can adjust in DJI Fly app if needed

## UI Components

### Mission Stats Section (Enhanced)

```
┌─ Mission Stats ──────────────────────┐
│ 📍 Waypoints: 48                     │
│ 📏 Distance: 520m                    │
│ ⚡ Max Speed: 1.9 m/s                 │
│    ℹ️ Based on 10m minimum segment   │
│ ⏱️  Est. Time: 06:42 ✅               │
└──────────────────────────────────────┘
```

**Warning States**:
- ✅ Green: Normal (< 85% of max flight time)
- ⚠️ Yellow: Warning (85-99% of max flight time)
- 🔴 Red: Critical (≥ 100% of max flight time)

### Flight Duration Warning Dialog

**Trigger**: First time warning level changes to yellow or red per session

```
┌─ Flight Duration Warning ────────────────┐
│                                          │
│  ⚠️ Mission time (28:30) is approaching  │
│     the DJI Mini 5 Pro maximum flight    │
│     duration (~40 minutes).              │
│                                          │
│  Consider:                               │
│  • Reducing waypoint coverage            │
│  • Increasing spacing/overlap settings   │
│  • Splitting into multiple missions      │
│                                          │
│             [ OK, Got It ]               │
└──────────────────────────────────────────┘
```

**Red variant**: Change "approaching" to "exceeds"

## Edge Cases & Considerations

### Very Short Segments
- If minimum segment < 3m, max speed could be < 0.5 m/s
- System will calculate and display accurately
- User responsible for assessing practicality
- Can manually edit waypoints to increase spacing

### Perimeter Paths
- May have one very short corner segment
- This will limit entire mission speed
- Acceptable trade-off; user can manually edit if needed

### Custom Drone
- No flight time warnings (maxFlightTime = null)
- Photo interval defaults to 5.5s
- User must manually input HFOV

### No Waypoints
- Max speed displays as 0 m/s
- Mission time displays as "02:00" (just overhead)

## Future Enhancements

- Per-drone photo interval research and refinement
- Additional drone models as DJI releases compatible products
- Optional manual override for photo interval (with unlock mechanism)
- Per-segment speed calculation (advanced mode)
- RTH (Return to Home) time estimation

## References

- DJI Mini 5 Pro: ~5 seconds between 50MP photos
- Conservative buffer: +0.5 seconds → 5.5s default
- Flight time based on manufacturer specifications at ~90% battery usage
