# Waygen Architecture Documentation

This document provides a detailed overview of the Waygen codebase architecture, component relationships, and implementation details.

---

## 🏛️ System Architecture

Waygen follows a **React-based component architecture** with unidirectional data flow managed by Zustand. The application consists of three main layers:

```
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ MapContainer │  │ SidebarMain  │  │  SearchBar   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   State Layer (Zustand)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              useMissionStore.js                      │   │
│  │  • waypoints[]    • selectedIds[]                   │   │
│  │  • settings{}     • past[]  • future[]              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│              Logic & Utility Layer                           │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ pathGenerator.js│  │djiExporter.js│  │geospatial.js │   │
│  └─────────────────┘  └──────────────┘  └──────────────┘   │
│  ┌─────────────────┐  ┌──────────────┐                      │
│  │ kmlImporter.js  │  │DragRectangle │                      │
│  └─────────────────┘  └──────────────┘                      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│             External Libraries & Services                    │
│  • Mapbox GL JS  • Turf.js  • MapboxDraw  • JSZip          │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Component Breakdown

### Core Components

#### **App.jsx** - Application Root
**Responsibility**: Top-level layout and component orchestration

**Key Features:**
- Loading state management
- Layout structure (Map + Sidebar)
- Polygon state coordination

**Props Flow:**
```
App
├─→ SearchBar (no props)
├─→ MapContainer (onPolygonDrawn callback)
└─→ SidebarMain (currentPolygon)
```

---

#### **MapContainer.jsx** - Map Engine
**Responsibility**: Mapbox integration, rendering, and user interactions

**Key Features:**
- Mapbox GL JS initialization
- MapboxDraw integration (rectangle, polygon, circle modes)
- Custom draw modes (DragRectangleMode)
- Waypoint rendering with custom markers
- Camera footprint visualization
- Drag-and-drop waypoint repositioning
- Click-to-add waypoint functionality
- Selection handling

**State Subscriptions:**
```javascript
const waypoints = useMissionStore(state => state.waypoints);
const settings = useMissionStore(state => state.settings);
const selectedIds = useMissionStore(state => state.selectedIds);
const resetTrigger = useMissionStore(state => state.resetTrigger);
```

**Map Layers:**
1. **Base Layer**: Satellite imagery (`mapbox://styles/mapbox/satellite-v9`)
2. **Drawing Layer**: User-drawn boundaries (MapboxDraw)
3. **Waypoint Layer**: Flight path points with custom markers
4. **Footprint Layer**: Camera coverage visualization
5. **Selected Waypoint Layer**: Highlighted selection state

**Event Handlers:**
- `onClick`: Add waypoint (when in add mode)
- `onMouseDown`: Start waypoint drag
- `onMouseMove`: Update waypoint position during drag
- `onMouseUp`: Commit waypoint position change
- `onMouseEnter/Leave`: Cursor styling

---

#### **SidebarMain.jsx** - Mission Control Panel
**Responsibility**: User interface for mission configuration

**Sections:**

1. **Action Buttons** (Top Bar)
   - Undo/Redo
   - Download KMZ
   - Upload KML/KMZ
   - Delete Selected
   - Reset Mission

2. **Basics Section**
   - Altitude slider (1-120m)
   - Speed slider (1-15 m/s)
   - Gimbal Pitch slider (-90° to 0°)
   - Drone Model dropdown

3. **Grid Settings Section**
   - Path Type: Grid / Orbit radio buttons
   - Side Overlap slider (0-90%)
   - Front Overlap slider (0-90%)
   - Grid Angle slider (0-360°)
   - Auto Direction toggle
   - Generate Every Point toggle
   - Reverse Path toggle
   - Straighten Legs toggle

4. **Camera Section**
   - Waypoint Action: None / Take Photo / Hover
   - Show Footprints toggle

5. **Advanced Section**
   - Selected Drone label
   - Units display

6. **Generate Button**
   - Triggers path generation

**State Management:**
```javascript
const { settings, updateSettings } = useMissionStore();
const { waypoints, selectedIds } = useMissionStore();
const { resetMission, undo, redo } = useMissionStore();
```

---

#### **SearchBar.jsx** - Geocoding Interface
**Responsibility**: Location search and navigation

**Implementation:**
- Uses `@mapbox/mapbox-gl-geocoder`
- Positioned absolutely over map
- Integrated with Mapbox map instance
- Autocomplete search results
- Flyto animation on selection

---

#### **DrawToolbar.jsx** - Drawing Tool Selector
**Responsibility**: UI for selecting drawing modes

**Tools:**
- **Pointer**: Selection mode (`simple_select`)
- **Square**: Rectangle drawing (`draw_rectangle`)
- **Polygon**: Freeform polygon (`draw_polygon`)
- **Circle**: Circle drawing (`drag_circle`)
- **Trash**: Delete selected shapes

**Active State Management:**
```javascript
const [activeMode, setActiveMode] = useState(null);
const [hasSelection, setHasSelection] = useState(false);
```

---

## 🧠 State Management

### Zustand Store Structure

**File**: `src/store/useMissionStore.js`

```javascript
{
  // Primary State
  waypoints: [
    {
      id: "uuid",
      lat: 0.0,
      lng: 0.0,
      altitude: 60,
      speed: 10,
      gimbalPitch: -90,
      heading: 0
    }
  ],
  selectedIds: ["uuid1", "uuid2"],
  
  // History
  past: [/* previous waypoint states */],
  future: [/* redoable states */],
  
  // Global Settings
  settings: {
    altitude: 60,
    speed: 10,
    gimbalPitch: -90,
    customFOV: 82.1,
    showFootprints: false,
    sideOverlap: 70,
    frontOverlap: 80,
    pathType: 'grid',
    angle: 0,
    autoDirection: false,
    generateEveryPoint: false,
    reversePath: false,
    waypointAction: 'none',
    photoInterval: 2,
    selectedDrone: 'dji_mini_5_pro',
    straightenLegs: false,
    units: 'metric'
  },
  
  // Reset Trigger
  resetTrigger: 0
}
```

### Store Actions

#### Waypoint Management
- `setWaypoints(waypoints)` - Replace all waypoints
- `addWaypoint(waypoint)` - Append single waypoint
- `updateWaypoint(id, updates)` - Modify single waypoint
- `updateSelectedWaypoints(updates)` - Bulk edit selected waypoints
- `deleteSelectedWaypoints()` - Remove selected waypoints

#### Selection
- `selectWaypoint(id, multi)` - Select/deselect waypoint
- `setSelectedIds(ids)` - Set selection array
- `clearSelection()` - Deselect all

#### History
- `undo()` - Revert to previous state
- `redo()` - Restore next state
- Uses array-based stack: `past` and `future`

#### Settings
- `updateSettings(newSettings)` - Merge settings updates

#### Reset
- `resetMission()` - Clear all waypoints and history

---

## ⚙️ Logic Modules

### pathGenerator.js

**Exports:**
- `generatePhotogrammetryPath(polygon, settings)` - Grid pattern
- `generateOrbitPath(polygon, settings)` - Circular pattern

#### Grid Path Algorithm

1. **Boundary Preparation**
   - Convert polygon to Turf feature
   - Calculate bounding box
   - Determine envelope dimensions

2. **Direction Calculation**
   - Use `settings.angle` if manual
   - Auto-calculate from longest boundary axis if `autoDirection: true`
   - Rotate coordinate system by angle

3. **FOV and Overlap Calculation**
   ```javascript
   const hfov = getDroneFOV(settings.selectedDrone, settings.customFOV);
   const imageWidth = 2 * altitude * Math.tan((hfov * Math.PI / 180) / 2);
   const groundHeight = imageWidth * (3 / 4); // 4:3 aspect
   
   const lineSpacing = imageWidth * (1 - sideOverlap / 100);
   const pointSpacing = groundHeight * (1 - frontOverlap / 100);
   ```

4. **Flight Line Generation**
   - Create parallel lines across bounding box
   - Spacing based on `lineSpacing`
   - Clip lines to polygon boundary

5. **Waypoint Generation**
   - Iterate along each flight line
   - Insert waypoints at `pointSpacing` intervals
   - Alternate line direction (serpentine pattern)

6. **Post-Processing**
   - Apply `reversePath` if enabled
   - Apply `straightenLegs` (remove interior points)
   - Calculate headings between waypoints
   - Assign altitude, speed, gimbal pitch

#### Orbit Path Algorithm

1. Find polygon centroid
2. Calculate radius (distance to furthest vertex)
3. Generate circle waypoints at 10° increments
4. Assign headings pointing toward center
5. Set gimbal pitch to maintain center view

---

### djiExporter.js

**Export Function**: `downloadKMZ(waypoints, settings, filename)`

**Process:**

1. **Create KML Structure**
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <kml xmlns="http://www.opengis.net/kml/2.2">
     <Document>
       <Folder>
         <Placemark>
           <Point>
             <coordinates>lng,lat,altitude</coordinates>
           </Point>
           <ExtendedData>
             <Data name="speed">...</Data>
             <Data name="gimbalPitch">...</Data>
             <Data name="waypointAction">...</Data>
           </ExtendedData>
         </Placemark>
       </Folder>
     </Document>
   </kml>
   ```

2. **Convert to KMZ**
   - Use JSZip to create archive
   - Add `doc.kml` as primary file
   - Compress to ZIP format with `.kmz` extension

3. **Trigger Download**
   - Use `file-saver` library
   - Blob URL generation
   - Automatic cleanup

---

### kmlImporter.js

**Import Function**: `parseImport(file)`

**Process:**

1. **File Reading**
   - Support `.kml` (XML) and `.kmz` (ZIP)
   - Extract XML from KMZ archive

2. **Parsing**
   - Use `@tmcw/togeojson` to convert KML → GeoJSON
   - Extract placemark coordinates
   - Parse extended data attributes

3. **Validation**
   - Check for required fields (lat, lng, altitude)
   - Set defaults for missing properties
   - Generate unique IDs

4. **Return Format**
   ```javascript
   {
     type: 'waypoints',
     data: [
       { id, lat, lng, altitude, speed, gimbalPitch, heading }
     ]
   }
   ```

---

### geospatial.js

**Functions:**

#### `calculateFootprint(center, altitude, heading, hfov)`
Computes camera ground coverage polygon.

**Algorithm:**
1. Calculate ground dimensions from altitude and HFOV
2. Generate rectangle corners
3. Rotate based on heading
4. Convert to GeoJSON polygon

#### `calculateHeading(fromLngLat, toLngLat)`
Calculates bearing between two points (delegates to Turf.js).

#### `getDroneFOV(droneModel, customFOV)`
Returns FOV for drone model.

**Database:**
```javascript
{
  'dji_mini_5_pro': 84.0,
  'dji_mini_4_pro': 82.1,
  'dji_mavic_4_pro': 72.0,
  'custom': customFOV
}
```

---

## 🎨 Custom Draw Modes

### DragRectangleMode.js

**Purpose**: MapboxDraw mode for click-drag-release rectangle drawing

**Implementation:**
- Extends `MapboxDraw.modes.simple_select`
- Listens for `mousedown`, `mousemove`, `mouseup`
- Dynamically updates rectangle bounds during drag
- Converts to GeoJSON polygon on release

**Integration:**
```javascript
const draw = new MapboxDraw({
  modes: {
    ...MapboxDraw.modes,
    draw_rectangle: DragRectangleMode
  }
});
```

---

## 🎯 Data Flow Examples

### Example 1: Generate Grid Path

```
User clicks "Generate Path"
  ↓
SidebarMain.handleGenerate()
  ↓
pathGenerator.generatePhotogrammetryPath(polygon, settings)
  ↓
Returns waypoint array
  ↓
useMissionStore.setWaypoints(waypoints)
  ↓
MapContainer re-renders waypoints
  ↓
Map displays new flight path
```

### Example 2: Drag Waypoint

```
User mousedown on waypoint marker
  ↓
MapContainer.onPointMouseDown(e)
  ↓
Set isDragging = true, capture waypoint ID
  ↓
User moves mouse
  ↓
MapContainer.onPointDragMove(e)
  ↓
Update map source directly (fast rendering)
  ↓
User releases mouse
  ↓
MapContainer.onPointDragUp(e)
  ↓
useMissionStore.updateWaypoint(id, { lat, lng })
  ↓
Store updates, triggers re-render with new position
```

### Example 3: Export KMZ

```
User clicks "Download KMZ"
  ↓
SidebarMain calls downloadKMZ()
  ↓
djiExporter.js generates KML XML
  ↓
JSZip creates KMZ archive
  ↓
file-saver triggers browser download
  ↓
User saves mission.kmz
```

---

## 🔄 Rendering Pipeline

### Waypoint Rendering

**MapContainer.jsx** uses Mapbox GL JS's data-driven styling:

```javascript
map.addSource('waypoints', {
  type: 'geojson',
  data: {
    type: 'FeatureCollection',
    features: waypoints.map(wp => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] },
      properties: { id: wp.id, index: wp.index }
    }))
  }
});

map.addLayer({
  id: 'waypoint-markers',
  type: 'symbol',
  source: 'waypoints',
  layout: { 'icon-image': 'waypoint-marker' }
});
```

### Footprint Rendering

**Conditional rendering** based on `settings.showFootprints`:

```javascript
if (settings.showFootprints) {
  const footprints = waypoints.map(wp => 
    calculateFootprint(
      [wp.lng, wp.lat],
      wp.altitude,
      wp.heading,
      getDroneFOV(settings.selectedDrone, settings.customFOV)
    )
  );
  
  map.getSource('footprints').setData({
    type: 'FeatureCollection',
    features: footprints
  });
}
```

**Color Rotation** (4-color palette):
```javascript
'fill-color': [
  'case',
  ['==', ['%', ['get', 'index'], 4], 0], '#FF5733',
  ['==', ['%', ['get', 'index'], 4], 1], '#33FF57',
  ['==', ['%', ['get', 'index'], 4], 2], '#3357FF',
  '#F333FF'
]
```

---

## 🛡️ Error Handling

### Import Validation
```javascript
try {
  const result = await parseImport(file);
  if (result.type === 'waypoints') {
    useMissionStore.setWaypoints(result.data);
  }
} catch (error) {
  alert('Invalid file format');
}
```

### Path Generation Validation
```javascript
if (!currentPolygon) {
  alert('Please draw a boundary first');
  return;
}

if (waypoints.length === 0) {
  alert('No waypoints generated. Adjust settings.');
}
```

---

## 🚀 Performance Optimizations

1. **Selective Re-rendering**
   - Zustand allows subscribing to specific state slices
   - Components only re-render when their subscribed data changes

2. **Map Source Updates**
   - Direct source manipulation during drag (`setData()`)
   - Store update only on drag end (reduces state updates)

3. **Footprint Toggle**
   - Footprints disabled by default
   - Rendering 100+ polygons can impact performance

4. **Memoization Opportunities** (future)
   - Path generation results could be cached
   - FOV calculations could be memoized

---

## 📝 Code Style & Conventions

### File Naming
- **Components**: PascalCase with `.jsx` extension
- **Utilities**: camelCase with `.js` extension
- **Store**: `use[Name]Store.js` pattern

### Component Structure
```javascript
import statements
↓
Component definition
↓
Helper functions (if needed)
↓
Export statement
```

### State Access Pattern
```javascript
// ✅ Good: Subscribe to specific properties
const waypoints = useMissionStore(state => state.waypoints);

// ❌ Avoid: Subscribe to entire store
const store = useMissionStore();
```

---

## 🧪 Testing Considerations

### Manual Testing Checklist
- [ ] Draw all boundary types (rectangle, polygon, circle)
- [ ] Generate grid path with various overlap settings
- [ ] Generate orbit path
- [ ] Drag waypoints and verify position updates
- [ ] Select multiple waypoints and bulk edit
- [ ] Undo/redo operations
- [ ] Export KMZ and verify file structure
- [ ] Import KML/KMZ and verify waypoint restoration
- [ ] Toggle footprint visualization
- [ ] Test with different drone models

### Unit Testing Opportunities
- `pathGenerator.js` - Grid spacing calculations
- `geospatial.js` - Footprint geometry
- `djiExporter.js` - KML format validation
- `kmlImporter.js` - Parser error handling

---

## 🔮 Future Enhancements

### Architecture Improvements
1. **Component Decomposition**
   - Split `MapContainer.jsx` (769 lines) into smaller components
   - Extract drawing logic to custom hooks

2. **Type Safety**
   - Migrate to TypeScript
   - Define interfaces for waypoint, settings, drone models

3. **State Persistence**
   - LocalStorage middleware for Zustand
   - Auto-save drafts

4. **Testing Infrastructure**
   - Jest + React Testing Library
   - Cypress for E2E tests

### Feature Extensions
1. **Multi-Mission Management**
   - Save/load multiple missions
   - Mission templates

2. **Advanced Path Patterns**
   - Double grid (cross-hatch)
   - Perimeter only
   - Spiral pattern

3. **Real-time Validation**
   - Battery life estimation
   - Flight time calculation
   - No-fly zone warnings

---

**Last Updated**: 2025-11-23
