# Waygen API Reference

This document provides detailed API documentation for the key modules and functions in the Waygen codebase.

---

## 📦 Store API

### useMissionStore

**Location**: `src/store/useMissionStore.js`

Zustand store for managing mission state, waypoints, and settings.

#### State Properties

##### `waypoints: Array<Waypoint>`
Array of waypoint objects representing the flight path.

**Waypoint Object Structure:**
```typescript
{
  id: string;           // Unique identifier (UUID)
  lat: number;          // Latitude in decimal degrees
  lng: number;          // Longitude in decimal degrees
  altitude: number;     // Altitude in meters
  speed: number;        // Flight speed in m/s
  gimbalPitch: number;  // Gimbal pitch in degrees (-90 to 0)
  heading: number;      // Flight heading in degrees (0-360)
}
```

##### `selectedIds: Array<string>`
Array of selected waypoint IDs.

##### `past: Array<Array<Waypoint>>`
Undo stack containing previous waypoint states.

##### `future: Array<Array<Waypoint>>`
Redo stack containing future waypoint states.

##### `settings: Object`
Global mission settings.

**Settings Object Structure:**
```typescript
{
  altitude: number;           // Default waypoint altitude (meters)
  speed: number;              // Default flight speed (m/s)
  gimbalPitch: number;        // Default gimbal pitch (degrees)
  customFOV: number;          // Custom camera FOV (degrees)
  showFootprints: boolean;    // Display footprint overlay
  sideOverlap: number;        // Side overlap percentage (0-90)
  frontOverlap: number;       // Front overlap percentage (0-90)
  pathType: 'grid' | 'orbit'; // Path generation type
  angle: number;              // Grid angle (0-360 degrees)
  autoDirection: boolean;     // Auto-calculate grid direction
  generateEveryPoint: boolean;// Insert waypoints at every intersection
  reversePath: boolean;       // Reverse waypoint order
  waypointAction: 'none' | 'photo' | 'hover'; // Action at waypoint
  photoInterval: number;      // Photo interval in seconds
  selectedDrone: string;      // Drone model identifier
  straightenLegs: boolean;    // Remove interior waypoints on flight lines
  units: 'metric' | 'imperial'; // Display units
}
```

##### `resetTrigger: number`
Counter incremented on mission reset for triggering map cleanup.

---

#### Actions

##### `setWaypoints(waypoints: Array<Waypoint>): void`
Replace all waypoints and update history.

**Parameters:**
- `waypoints` - New waypoint array

**Side Effects:**
- Pushes current waypoints to `past` stack
- Clears `future` stack

**Example:**
```javascript
const { setWaypoints } = useMissionStore();
setWaypoints([
  { id: '1', lat: 40.7128, lng: -74.0060, altitude: 60, speed: 10, gimbalPitch: -90, heading: 0 }
]);
```

---

##### `addWaypoint(waypoint: Partial<Waypoint>): void`
Append a single waypoint to the end of the list.

**Parameters:**
- `waypoint` - Partial waypoint object (lat, lng required)

**Auto-filled Properties:**
- `id` - Generated UUID
- `altitude` - From `settings.altitude`
- `speed` - From `settings.speed`
- `gimbalPitch` - From `settings.gimbalPitch`
- `heading` - Calculated from previous waypoint bearing

**Example:**
```javascript
const { addWaypoint } = useMissionStore();
addWaypoint({ lat: 40.7128, lng: -74.0060 });
```

---

##### `updateWaypoint(id: string, updates: Partial<Waypoint>): void`
Update a single waypoint by ID.

**Parameters:**
- `id` - Waypoint ID to update
- `updates` - Partial waypoint object with properties to change

**Example:**
```javascript
const { updateWaypoint } = useMissionStore();
updateWaypoint('waypoint-123', { altitude: 80, speed: 12 });
```

---

##### `updateSelectedWaypoints(updates: Partial<Waypoint>): void`
Bulk update all selected waypoints.

**Parameters:**
- `updates` - Partial waypoint object applied to all selected waypoints

**Example:**
```javascript
const { updateSelectedWaypoints } = useMissionStore();
updateSelectedWaypoints({ altitude: 70, gimbalPitch: -45 });
```

---

##### `deleteSelectedWaypoints(): void`
Remove all selected waypoints from the mission.

**Example:**
```javascript
const { deleteSelectedWaypoints } = useMissionStore();
deleteSelectedWaypoints();
```

---

##### `selectWaypoint(id: string, multi: boolean): void`
Select or deselect a waypoint.

**Parameters:**
- `id` - Waypoint ID
- `multi` - If true, toggle selection (multi-select); if false, select only this waypoint

**Example:**
```javascript
const { selectWaypoint } = useMissionStore();

// Single selection
selectWaypoint('waypoint-123', false);

// Multi-selection
selectWaypoint('waypoint-456', true);
```

---

##### `setSelectedIds(ids: Array<string>): void`
Directly set the selected waypoint IDs.

**Parameters:**
- `ids` - Array of waypoint IDs to select

---

##### `clearSelection(): void`
Deselect all waypoints.

---

##### `updateSettings(newSettings: Partial<Settings>): void`
Merge new settings into the existing settings object.

**Parameters:**
- `newSettings` - Partial settings object to merge

**Example:**
```javascript
const { updateSettings } = useMissionStore();
updateSettings({ altitude: 80, sideOverlap: 75, frontOverlap: 85 });
```

---

##### `undo(): void`
Revert to the previous waypoint state.

**Constraints:**
- No-op if `past` is empty

---

##### `redo(): void`
Restore the next waypoint state.

**Constraints:**
- No-op if `future` is empty

---

##### `resetMission(): void`
Clear all waypoints, selection, and history.

**Side Effects:**
- Increments `resetTrigger`
- Clears `waypoints`, `selectedIds`, `past`, `future`

---

## 🛰️ Path Generation API

### pathGenerator.js

**Location**: `src/logic/pathGenerator.js`

#### `generatePhotogrammetryPath(polygonFeature, settings): Array<Waypoint>`

Generate a grid-based photogrammetry flight path.

**Parameters:**
- `polygonFeature` (GeoJSON Feature) - Boundary polygon
- `settings` (Object) - Mission settings from store

**Returns:**
- Array of waypoint objects

**Algorithm:**
1. Calculate drone FOV and ground image dimensions
2. Compute line spacing from side overlap
3. Compute waypoint spacing from front overlap
4. Generate parallel flight lines across boundary
5. Insert waypoints along each line
6. Apply post-processing (reverse, straighten, etc.)

**Example:**
```javascript
import { generatePhotogrammetryPath } from './logic/pathGenerator';

const polygon = {
  type: 'Feature',
  geometry: {
    type: 'Polygon',
    coordinates: [[[-74.006, 40.7128], [-74.005, 40.7128], ...]]
  }
};

const waypoints = generatePhotogrammetryPath(polygon, {
  altitude: 60,
  speed: 10,
  gimbalPitch: -90,
  sideOverlap: 70,
  frontOverlap: 80,
  angle: 0,
  selectedDrone: 'dji_mini_5_pro',
  // ... other settings
});
```

**Key Settings Used:**
- `altitude` - Flight altitude
- `sideOverlap` - Spacing between flight lines
- `frontOverlap` - Spacing between waypoints
- `angle` - Grid rotation angle
- `autoDirection` - Auto-calculate angle from boundary
- `reversePath` - Reverse waypoint order
- `straightenLegs` - Remove interior waypoints
- `selectedDrone` - Drone model for FOV
- `customFOV` - Custom FOV if drone is 'custom'

---

#### `generateOrbitPath(polygonFeature, settings): Array<Waypoint>`

Generate a circular orbit path around a point.

**Parameters:**
- `polygonFeature` (GeoJSON Feature) - Boundary (centroid used as orbit center)
- `settings` (Object) - Mission settings from store

**Returns:**
- Array of waypoint objects orbiting the center

**Algorithm:**
1. Calculate polygon centroid
2. Calculate radius (distance to furthest vertex)
3. Generate 36 waypoints at 10° increments
4. Set headings pointing toward center
5. Set gimbal pitch to maintain center view

**Example:**
```javascript
import { generateOrbitPath } from './logic/pathGenerator';

const polygon = { /* GeoJSON polygon */ };
const waypoints = generateOrbitPath(polygon, settings);
```

---

## 📤 Export API

### djiExporter.js

**Location**: `src/utils/djiExporter.js`

#### `downloadKMZ(waypoints, settings, filename): void`

Export waypoints as a DJI-compatible KMZ file.

**Parameters:**
- `waypoints` (Array<Waypoint>) - Waypoints to export
- `settings` (Object) - Mission settings (used for metadata)
- `filename` (string, optional) - Output filename (default: 'mission.kmz')

**Side Effects:**
- Triggers browser download

**KML Structure:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Mission Name</name>
    <Folder>
      <Placemark>
        <name>WP1</name>
        <Point>
          <coordinates>lng,lat,altitude</coordinates>
        </Point>
        <ExtendedData>
          <Data name="speed"><value>10</value></Data>
          <Data name="gimbalPitch"><value>-90</value></Data>
          <Data name="heading"><value>0</value></Data>
          <Data name="waypointAction"><value>photo</value></Data>
        </ExtendedData>
      </Placemark>
      <!-- More waypoints -->
    </Folder>
  </Document>
</kml>
```

**Example:**
```javascript
import { downloadKMZ } from './utils/djiExporter';

const waypoints = useMissionStore.getState().waypoints;
const settings = useMissionStore.getState().settings;

downloadKMZ(waypoints, settings, 'my-mission.kmz');
```

---

## 📥 Import API

### kmlImporter.js

**Location**: `src/utils/kmlImporter.js`

#### `parseImport(file): Promise<ImportResult>`

Parse a KML or KMZ file and extract waypoints.

**Parameters:**
- `file` (File) - File object from input element

**Returns:**
- Promise resolving to `ImportResult` object

**ImportResult Structure:**
```typescript
{
  type: 'waypoints';
  data: Array<Waypoint>;
}
```

**Supported Formats:**
- `.kml` (XML)
- `.kmz` (Zipped KML)

**Example:**
```javascript
import { parseImport } from './utils/kmlImporter';

const fileInput = document.getElementById('file-input');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  
  try {
    const result = await parseImport(file);
    
    if (result.type === 'waypoints') {
      useMissionStore.getState().setWaypoints(result.data);
    }
  } catch (error) {
    console.error('Import failed:', error);
  }
});
```

---

## 🌍 Geospatial API

### geospatial.js

**Location**: `src/utils/geospatial.js`

#### `calculateFootprint(center, altitude, heading, hfov): GeoJSON.Feature`

Calculate camera ground coverage footprint.

**Parameters:**
- `center` ([lng, lat]) - Waypoint coordinates
- `altitude` (number) - Flight altitude in meters
- `heading` (number) - Flight heading in degrees
- `hfov` (number) - Horizontal field of view in degrees

**Returns:**
- GeoJSON Feature with Polygon geometry

**Example:**
```javascript
import { calculateFootprint } from './utils/geospatial';

const footprint = calculateFootprint(
  [-74.006, 40.7128],  // NYC coordinates
  60,                   // 60m altitude
  45,                   // 45° heading
  84.0                  // 84° FOV
);

// footprint.geometry.coordinates contains polygon vertices
```

**Calculation:**
```
Width = 2 × altitude × tan(HFOV / 2)
Height = Width × (3 / 4)  // 4:3 aspect ratio
```

---

#### `calculateHeading(fromLngLat, toLngLat): number`

Calculate bearing between two points.

**Parameters:**
- `fromLngLat` ([lng, lat]) - Start point
- `toLngLat` ([lng, lat]) - End point

**Returns:**
- Bearing in degrees (0-360)

**Example:**
```javascript
import { calculateHeading } from './utils/geospatial';

const heading = calculateHeading(
  [-74.006, 40.7128],  // Start
  [-74.005, 40.7130]   // End
);

console.log(heading); // e.g., 45.2
```

---

#### `getDroneFOV(droneModel, customFOV): number`

Get horizontal FOV for a drone model.

**Parameters:**
- `droneModel` (string) - Drone model identifier
- `customFOV` (number) - Custom FOV value (used if model is 'custom')

**Returns:**
- FOV in degrees

**Supported Models:**
- `'dji_mini_5_pro'` → 84.0°
- `'dji_mini_4_pro'` → 82.1°
- `'dji_mavic_4_pro'` → 72.0°
- `'custom'` → `customFOV`

**Example:**
```javascript
import { getDroneFOV } from './utils/geospatial';

const fov = getDroneFOV('dji_mini_5_pro', 84);
console.log(fov); // 84.0

const customFov = getDroneFOV('custom', 90);
console.log(customFov); // 90
```

---

## 🎨 Custom Draw Modes

### DragRectangleMode

**Location**: `src/logic/DragRectangleMode.js`

Custom MapboxDraw mode for click-drag-release rectangle drawing.

**Usage:**
```javascript
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import DragRectangleMode from './logic/DragRectangleMode';

const draw = new MapboxDraw({
  modes: {
    ...MapboxDraw.modes,
    draw_rectangle: DragRectangleMode
  }
});

// Activate mode
draw.changeMode('draw_rectangle');
```

**Events:**
- `draw.create` - Fired when rectangle is completed
- `draw.modechange` - Fired when mode changes

---

## 🗺️ Map Integration

### Mapbox GL JS

**Initialization Example:**
```javascript
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'YOUR_ACCESS_TOKEN';

const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/satellite-v9',
  center: [-74.006, 40.7128],
  zoom: 12
});
```

### MapboxDraw Integration

```javascript
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import DragCircleMode from 'mapbox-gl-draw-circle';
import DragRectangleMode from './logic/DragRectangleMode';

const draw = new MapboxDraw({
  displayControlsDefault: false,
  modes: {
    ...MapboxDraw.modes,
    drag_circle: DragCircleMode,
    draw_rectangle: DragRectangleMode
  },
  styles: customDrawStyles
});

map.addControl(draw);
```

---

## 🔧 Utility Functions

### Common Patterns

#### Accessing Store Outside Components

```javascript
import { useMissionStore } from './store/useMissionStore';

// In a utility function or event handler
const waypoints = useMissionStore.getState().waypoints;
const updateSettings = useMissionStore.getState().updateSettings;

updateSettings({ altitude: 70 });
```

#### Subscribing to Specific State

```javascript
import { useMissionStore } from './store/useMissionStore';

function MyComponent() {
  // Only re-renders when waypoints change
  const waypoints = useMissionStore(state => state.waypoints);
  
  // Only re-renders when altitude changes
  const altitude = useMissionStore(state => state.settings.altitude);
  
  return <div>{waypoints.length} waypoints at {altitude}m</div>;
}
```

---

## 📝 Type Definitions

### Waypoint
```typescript
interface Waypoint {
  id: string;
  lat: number;
  lng: number;
  altitude: number;
  speed: number;
  gimbalPitch: number;
  heading: number;
}
```

### Settings
```typescript
interface Settings {
  altitude: number;
  speed: number;
  gimbalPitch: number;
  customFOV: number;
  showFootprints: boolean;
  sideOverlap: number;
  frontOverlap: number;
  pathType: 'grid' | 'orbit';
  angle: number;
  autoDirection: boolean;
  generateEveryPoint: boolean;
  reversePath: boolean;
  waypointAction: 'none' | 'photo' | 'hover';
  photoInterval: number;
  selectedDrone: 'dji_mini_5_pro' | 'dji_mini_4_pro' | 'dji_mavic_4_pro' | 'custom';
  straightenLegs: boolean;
  units: 'metric' | 'imperial';
}
```

### GeoJSON Types
```typescript
type LngLat = [number, number]; // [longitude, latitude]

interface GeoJSONPoint {
  type: 'Point';
  coordinates: LngLat;
}

interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: LngLat[][];
}

interface GeoJSONFeature {
  type: 'Feature';
  geometry: GeoJSONPoint | GeoJSONPolygon;
  properties?: Record<string, any>;
}
```

---

**Last Updated**: 2025-11-23
