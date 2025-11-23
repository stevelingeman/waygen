# Waygen Component Reference

This guide provides detailed documentation for each component in the Waygen application, including props, state, and key functionality.

---

## 🗺️ Map Components

### MapContainer

**File**: `src/components/Map/MapContainer.jsx`

**Purpose**: Core map component integrating Mapbox GL JS with mission planning functionality.

**Props:**
```typescript
{
  onPolygonDrawn: (polygon: GeoJSON.Feature | null) => void
}
```

**Key State:**
```javascript
const [isDragging, setIsDragging] = useState(false);
const [draggedWaypointId, setDraggedWaypointId] = useState(null);
const [currentMode, setCurrentMode] = useState(null);
const [hasSelection, setHasSelection] = useState(false);
const mapRef = useRef(null);
const mapInstanceRef = useRef(null);
const drawRef = useRef(null);
```

**Store Subscriptions:**
```javascript
const waypoints = useMissionStore(state => state.waypoints);
const settings = useMissionStore(state => state.settings);
const selectedIds = useMissionStore(state => state.selectedIds);
const resetTrigger = useMissionStore(state => state.resetTrigger);
```

**Mapbox Layers:**

1. **waypoints** (Source)
   - Type: GeoJSON
   - Data: Point features for each waypoint

2. **waypoint-markers** (Layer)
   - Type: Symbol
   - Icon: Custom red arrow marker
   - Size: Scales based on zoom

3. **waypoint-labels** (Layer)
   - Type: Symbol
   - Text: Sequential waypoint numbers (1, 2, 3...)

4. **selected-waypoints** (Layer)
   - Type: Circle
   - Color: Bright yellow
   - Size: Larger than unselected waypoints

5. **footprints** (Source + Layer)
   - Type: GeoJSON Polygon
   - Fill: 4-color rotation with 30% opacity
   - Stroke: 2px border
   - Conditional: Only visible when `settings.showFootprints === true`

**Event Handlers:**

| Event | Handler | Description |
|-------|---------|-------------|
| `map.onClick` | Map click handler | Add waypoint when in "add" mode |
| `map.onMouseDown` (waypoint layer) | `onPointMouseDown` | Start waypoint drag |
| `map.onMouseMove` | `onPointDragMove` | Update waypoint position during drag |
| `map.onMouseUp` | `onPointDragUp` | Commit waypoint position change |
| `map.onMouseEnter` (waypoint layer) | `onPointMouseEnter` | Change cursor to pointer |
| `map.onMouseLeave` (waypoint layer) | `onPointMouseLeave` | Reset cursor |
| `draw.onModeChange` | `updateMode` | Update current mode state |
| `draw.onCreate` | Shape creation handler | Update polygon state |
| `draw.onUpdate` | Shape update handler | Update polygon state |
| `draw.onDelete` | Shape deletion handler | Clear polygon state |
| `draw.onSelectionChange` | Selection handler | Update selection state |

**Key Functions:**

#### `updateRadiusFromFeature(feature)`
Extracts circle radius from MapboxDraw circle feature and updates store settings.

```javascript
const updateRadiusFromFeature = (feature) => {
  if (feature.properties?.isCircle) {
    const center = feature.properties.center;
    const radiusInKm = feature.properties.radiusInKm;
    updateSettings({ circleRadius: radiusInKm * 1000 });
  }
};
```

#### `onPointMouseDown(e)`
Initiates waypoint drag operation.

```javascript
const onPointMouseDown = (e) => {
  e.preventDefault();
  const feature = e.features[0];
  const id = feature.properties.id;
  
  setIsDragging(true);
  setDraggedWaypointId(id);
  map.getCanvas().style.cursor = 'grabbing';
};
```

#### `onPointDragMove(e)`
Updates waypoint position in real-time during drag.

```javascript
const onPointDragMove = (e) => {
  if (!isDragging || !draggedWaypointId) return;
  
  const { lng, lat } = e.lngLat;
  
  // Update map source directly (fast rendering)
  const source = map.getSource('waypoints');
  const data = source._data;
  const feature = data.features.find(f => f.properties.id === draggedWaypointId);
  
  if (feature) {
    feature.geometry.coordinates = [lng, lat];
    source.setData(data);
  }
};
```

#### `onPointDragUp(e)`
Commits waypoint position change to store.

```javascript
const onPointDragUp = (e) => {
  if (!isDragging || !draggedWaypointId) return;
  
  const { lng, lat } = e.lngLat;
  
  // Update store (persistent)
  updateWaypoint(draggedWaypointId, { lat, lng });
  
  setIsDragging(false);
  setDraggedWaypointId(null);
  map.getCanvas().style.cursor = '';
};
```

**Usage:**
```jsx
import MapContainer from './components/Map/MapContainer';

function App() {
  const [polygon, setPolygon] = useState(null);
  
  return <MapContainer onPolygonDrawn={setPolygon} />;
}
```

---

### DrawToolbar

**File**: `src/components/Map/DrawToolbar.jsx`

**Purpose**: Toolbar for selecting drawing and selection modes.

**Props:**
```typescript
{
  draw: MapboxDraw;    // MapboxDraw instance
  mapRef: React.RefObject<mapboxgl.Map>;
}
```

**State:**
```javascript
const [activeMode, setActiveMode] = useState(null);
const [hasSelection, setHasSelection] = useState(false);
```

**Toolbar Buttons:**

| Icon | Mode | Action |
|------|------|--------|
| Mouse Pointer | `simple_select` | Select/modify shapes |
| Square | `draw_rectangle` | Draw rectangles |
| Pentagon | `draw_polygon` | Draw polygons |
| Circle | `drag_circle` | Draw circles |
| Trash | N/A | Delete selected shapes |

**Event Listeners:**
```javascript
draw.on('draw.selectionchange', (e) => {
  setHasSelection(e.features.length > 0);
});

draw.on('draw.modechange', (e) => {
  setActiveMode(e.mode);
});
```

**Button States:**
- Active mode button: Blue background
- Inactive buttons: Gray background
- Trash button: Only enabled when shapes are selected

**Usage:**
```jsx
import DrawToolbar from './components/Map/DrawToolbar';

function MapContainer() {
  const mapRef = useRef();
  const drawRef = useRef();
  
  return (
    <>
      <DrawToolbar draw={drawRef.current} mapRef={mapRef} />
      <div ref={mapRef} />
    </>
  );
}
```

---

## 📊 Sidebar Components

### SidebarMain

**File**: `src/components/Sidebar/SidebarMain.jsx`

**Purpose**: Main control panel for mission settings and path generation.

**Props:**
```typescript
{
  currentPolygon: GeoJSON.Feature | null;
}
```

**Store Subscriptions:**
```javascript
const waypoints = useMissionStore(state => state.waypoints);
const selectedIds = useMissionStore(state => state.selectedIds);
const settings = useMissionStore(state => state.settings);
const past = useMissionStore(state => state.past);
const future = useMissionStore(state => state.future);

const {
  updateSettings,
  updateSelectedWaypoints,
  deleteSelectedWaypoints,
  resetMission,
  undo,
  redo
} = useMissionStore();
```

**Sections:**

#### **Action Bar**
Top toolbar with quick actions.

**Buttons:**
- **Undo** - Revert last change (disabled if `past.length === 0`)
- **Redo** - Restore next change (disabled if `future.length === 0`)
- **Download KMZ** - Export mission (disabled if `waypoints.length === 0`)
- **Upload KML/KMZ** - Import mission
- **Delete Selected** - Remove selected waypoints (disabled if `selectedIds.length === 0`)
- **Reset Mission** - Clear all waypoints (with confirmation)

#### **Basics Section**
Core flight parameters.

**Controls:**
```jsx
<Section title="Basics" icon={Settings} defaultOpen={true}>
  {/* Altitude Slider: 1-120m */}
  <input
    type="range"
    min="1"
    max="120"
    value={settings.altitude}
    onChange={(e) => updateSettings({ altitude: Number(e.target.value) })}
  />
  
  {/* Speed Slider: 1-15 m/s */}
  <input
    type="range"
    min="1"
    max="15"
    value={settings.speed}
    onChange={(e) => updateSettings({ speed: Number(e.target.value) })}
  />
  
  {/* Gimbal Pitch Slider: -90 to 0° */}
  <input
    type="range"
    min="-90"
    max="0"
    value={settings.gimbalPitch}
    onChange={(e) => updateSettings({ gimbalPitch: Number(e.target.value) })}
  />
  
  {/* Drone Model Dropdown */}
  <select
    value={settings.selectedDrone}
    onChange={(e) => updateSettings({ selectedDrone: e.target.value })}
  >
    <option value="dji_mini_5_pro">DJI Mini 5 Pro</option>
    <option value="dji_mini_4_pro">DJI Mini 4 Pro</option>
    <option value="dji_mavic_4_pro">DJI Mavic 4 Pro</option>
    <option value="custom">Custom</option>
  </select>
  
  {/* Custom FOV Input (if Custom selected) */}
  {settings.selectedDrone === 'custom' && (
    <input
      type="number"
      value={settings.customFOV}
      onChange={(e) => updateSettings({ customFOV: Number(e.target.value) })}
    />
  )}
</Section>
```

#### **Grid Settings Section**
Path generation configuration.

**Controls:**
- Path Type: Radio buttons (Grid / Orbit)
- Side Overlap: Slider (0-90%)
- Front Overlap: Slider (0-90%)
- Grid Angle: Slider (0-360°)
- Auto Direction: Checkbox
- Generate Every Point: Checkbox
- Reverse Path: Checkbox
- Straighten Legs: Checkbox

#### **Camera Section**
Photo capture settings.

**Controls:**
- Waypoint Action: Dropdown (None / Take Photo / Hover)
- Show Footprints: Checkbox

#### **Advanced Section**
Additional information and settings.

**Displays:**
- Selected Drone Model (read-only)
- Units (read-only)

#### **Generate Button**
Large button at bottom to trigger path generation.

**Validation:**
```javascript
const handleGenerate = () => {
  if (!currentPolygon) {
    alert('Please draw a boundary first');
    return;
  }
  
  const path = settings.pathType === 'grid'
    ? generatePhotogrammetryPath(currentPolygon, settings)
    : generateOrbitPath(currentPolygon, settings);
    
  setWaypoints(path);
};
```

**Key Functions:**

#### `handleReset()`
Clears mission with user confirmation.

```javascript
const handleReset = () => {
  if (confirm('Reset mission? This will clear all waypoints.')) {
    resetMission();
  }
};
```

#### `handleGenerate()`
Generates flight path from boundary polygon.

```javascript
const handleGenerate = () => {
  if (!currentPolygon) {
    alert('Please draw a boundary first');
    return;
  }
  
  const waypoints = settings.pathType === 'grid'
    ? generatePhotogrammetryPath(currentPolygon, settings)
    : generateOrbitPath(currentPolygon, settings);
    
  setWaypoints(waypoints);
};
```

#### `handleFileUpload(e)`
Processes KML/KMZ file upload.

```javascript
const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  try {
    const result = await parseImport(file);
    
    if (result.type === 'waypoints') {
      setWaypoints(result.data);
    }
  } catch (error) {
    alert('Failed to import file: ' + error.message);
  }
};
```

**Usage:**
```jsx
import SidebarMain from './components/Sidebar/SidebarMain';

function App() {
  const [polygon, setPolygon] = useState(null);
  
  return <SidebarMain currentPolygon={polygon} />;
}
```

---

## 🔍 Common Components

### SearchBar

**File**: `src/components/Common/SearchBar.jsx`

**Purpose**: Geocoding search interface using Mapbox Geocoder.

**Props**: None (uses map context)

**Key Features:**
- Autocomplete search
- Global location search
- Flyto animation on selection
- Positioned absolutely over map

**Implementation:**
```jsx
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { useEffect, useRef } from 'react';

function SearchBar() {
  const geocoderRef = useRef();
  
  useEffect(() => {
    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      placeholder: 'Search for a location'
    });
    
    geocoder.addTo(geocoderRef.current);
  }, []);
  
  return (
    <div
      ref={geocoderRef}
      className="absolute top-4 left-4 z-10"
    />
  );
}
```

**Usage:**
```jsx
import SearchBar from './components/Common/SearchBar';

function App() {
  return (
    <div className="relative">
      <SearchBar />
      <MapContainer />
    </div>
  );
}
```

---

## 🎛️ Reusable Components

### Section

**File**: `src/components/Sidebar/SidebarMain.jsx` (Internal component)

**Purpose**: Collapsible section container for sidebar panels.

**Props:**
```typescript
{
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
  defaultOpen?: boolean;
}
```

**State:**
```javascript
const [isOpen, setIsOpen] = useState(defaultOpen ?? false);
```

**Structure:**
```jsx
<Section title="Grid Settings" icon={MapIcon} defaultOpen={true}>
  {/* Section content */}
</Section>
```

**Renders:**
```
┌─────────────────────────────────────┐
│ 📍 Grid Settings            [▼]    │ ← Click to toggle
├─────────────────────────────────────┤
│                                     │
│  Section content here...            │ ← Visible when open
│                                     │
└─────────────────────────────────────┘
```

---

## 🎨 Component Styling

### TailwindCSS Classes

Common patterns used throughout components:

**Buttons:**
```jsx
// Primary Button
className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"

// Secondary Button
className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"

// Danger Button
className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"

// Icon Button
className="p-2 rounded hover:bg-gray-100"

// Active State
className={`p-2 rounded ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
```

**Inputs:**
```jsx
// Range Slider
className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"

// Text Input
className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"

// Select Dropdown
className="w-full px-3 py-2 border border-gray-300 rounded bg-white"
```

**Layout:**
```jsx
// Sidebar Container
className="w-80 bg-white border-l border-gray-300 overflow-y-auto"

// Section Container
className="border-b border-gray-200 p-4"

// Flex Row
className="flex items-center justify-between gap-2"
```

---

## 🔗 Component Communication

### Parent → Child (Props)

```
App
├─→ MapContainer (onPolygonDrawn)
├─→ SidebarMain (currentPolygon)
└─→ SearchBar (no props)
```

### Child → Parent (Callbacks)

```javascript
// MapContainer notifies App of polygon changes
<MapContainer
  onPolygonDrawn={(polygon) => setCurrentPolygon(polygon)}
/>
```

### Global State (Zustand)

All components can access global state:

```javascript
// Read state
const waypoints = useMissionStore(state => state.waypoints);

// Update state
const { updateSettings } = useMissionStore();
updateSettings({ altitude: 70 });
```

---

## 🧩 Component Hierarchy

```
App
├── SearchBar
├── MapContainer
│   ├── Mapbox Map Instance
│   ├── MapboxDraw Instance
│   ├── DrawToolbar
│   ├── Waypoint Markers (Layer)
│   ├── Camera Footprints (Layer)
│   └── Selected Waypoints (Layer)
└── SidebarMain
    ├── Action Bar
    │   ├── Undo Button
    │   ├── Redo Button
    │   ├── Download Button
    │   ├── Upload Button
    │   ├── Delete Button
    │   └── Reset Button
    ├── Section: Basics
    │   ├── Altitude Slider
    │   ├── Speed Slider
    │   ├── Gimbal Pitch Slider
    │   └── Drone Dropdown
    ├── Section: Grid Settings
    │   ├── Path Type Radio
    │   ├── Overlap Sliders
    │   ├── Angle Slider
    │   └── Toggles
    ├── Section: Camera
    │   ├── Action Dropdown
    │   └── Show Footprints Toggle
    ├── Section: Advanced
    │   └── Info Display
    └── Generate Button
```

---

## 📝 Usage Patterns

### Accessing Store in Components

```javascript
// Subscribe to specific state slice
const waypoints = useMissionStore(state => state.waypoints);
const altitude = useMissionStore(state => state.settings.altitude);

// Access actions
const { updateSettings, addWaypoint } = useMissionStore();
```

### Updating Settings

```javascript
// Single setting
updateSettings({ altitude: 70 });

// Multiple settings
updateSettings({
  altitude: 70,
  speed: 12,
  sideOverlap: 75
});
```

### Bulk Editing Waypoints

```javascript
// Update all selected waypoints
const { updateSelectedWaypoints } = useMissionStore();

updateSelectedWaypoints({
  altitude: 80,
  gimbalPitch: -45
});
```

---

**Last Updated**: 2025-11-23
