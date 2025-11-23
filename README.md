# Waygen - Waypoint Generation Tool

**Waygen** is a professional drone mission planning application for photogrammetry and aerial survey missions. It provides an intuitive map-based interface for designing flight paths, configuring camera settings, and exporting mission files compatible with DJI drones.

![License](https://img.shields.io/badge/license-Private-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)

## 🌐 Live Demo

**[Launch Waygen →](https://waygen.pages.dev/)**

---

## 🎯 Overview

Waygen simplifies the process of creating precise waypoint missions for drone photogrammetry. Users can draw boundary polygons, configure flight parameters, and automatically generate optimized flight paths with proper image overlap for successful 3D reconstruction and orthomosaic generation.

### Key Capabilities

- **Interactive Map Interface**: Draw survey boundaries using rectangle, polygon, or circle tools
- **Automated Path Generation**: Generate grid or orbit flight patterns with configurable spacing
- **Camera Footprint Visualization**: Preview image coverage areas with drone-specific FOV calculations
- **Professional Photogrammetry Settings**: Separate front and side overlap controls for optimal image acquisition
- **Mission Export**: Export missions as KMZ files compatible with DJI drones
- **Mission Import**: Import existing KML/KMZ files for editing

---

## ✨ Features

### Path Generation
- **Grid Pattern**: Automated lawnmower pattern with configurable flight line angle
- **Orbit Pattern**: Circular path around a point of interest
- **Auto Direction**: Automatically align grid direction to longest boundary axis
- **Path Optimization**: Straighten flight legs, reverse path direction, and optimize waypoint density

### Camera & Imaging
- **Drone Presets**: Built-in FOV profiles for DJI Mini 4 Pro, Mini 5 Pro, and Mavic 4 Pro
- **Custom FOV**: Support for custom camera specifications
- **Overlap Control**: 
  - Side Overlap (0-90%, default 70%) - Controls spacing between flight lines
  - Front Overlap (0-90%, default 80%) - Controls spacing between photos along flight path
- **Waypoint Actions**: Configure shutter trigger, hovering, or continuous flight

### Waypoint Management
- **Manual Waypoint Addition**: Click-to-add individual waypoints
- **Drag & Drop**: Reposition waypoints by dragging on the map
- **Bulk Editing**: Select multiple waypoints and edit properties simultaneously
- **Undo/Redo**: Full history stack for mission editing

### Visualization
- **Camera Footprint Overlay**: Display image coverage rectangles with rotation based on flight direction
- **Color-Coded Footprints**: Visual differentiation using 4-color rotation
- **Selection Highlighting**: Clearly identify selected waypoints
- **Boundary Shapes**: Visual outline of survey area

---

## 🛠️ Technology Stack

### Core Technologies
- **React 18.2** - UI framework
- **Vite 5.0** - Build tool and development server
- **Zustand 4.4** - State management
- **Mapbox GL JS 2.15** - Interactive mapping
- **Turf.js 6.5** - Geospatial calculations

### Mapbox Extensions
- **@mapbox/mapbox-gl-draw** - Drawing tools
- **@mapbox/mapbox-gl-geocoder** - Location search
- **mapbox-gl-draw-circle** - Custom circle drawing mode

### UI & Utilities
- **Lucide React** - Icon library
- **Tailwind CSS** - Styling framework
- **file-saver** - Client-side file downloads
- **jszip** - KMZ file compression
- **@tmcw/togeojson** - KML/KMZ parsing

---

## 📁 Project Structure

```
waygen/
├── src/
│   ├── components/
│   │   ├── Common/
│   │   │   └── SearchBar.jsx          # Geocoding search interface
│   │   ├── Map/
│   │   │   ├── MapContainer.jsx       # Main map component with Mapbox integration
│   │   │   └── DrawToolbar.jsx        # Drawing tools UI (Pointer, Square, Polygon, Circle)
│   │   └── Sidebar/
│   │       └── SidebarMain.jsx        # Mission settings panel
│   ├── logic/
│   │   ├── pathGenerator.js           # Grid and orbit path generation algorithms
│   │   └── DragRectangleMode.js       # Custom Mapbox Draw mode for rectangles
│   ├── store/
│   │   └── useMissionStore.js         # Zustand state management
│   ├── utils/
│   │   ├── djiExporter.js             # KMZ file generation for DJI drones
│   │   ├── kmlImporter.js             # KML/KMZ parsing and validation
│   │   └── geospatial.js              # Camera footprint and heading calculations
│   ├── App.jsx                         # Root component
│   ├── main.jsx                        # Application entry point
│   └── index.css                       # Global styles
├── index.html                          # HTML template
├── package.json                        # Dependencies and scripts
├── vite.config.js                      # Vite configuration
├── tailwind.config.js                  # Tailwind CSS configuration
├── SPECS.md                            # Feature specifications
├── TRIAGE.md                           # Bug tracking and fixes
└── README.md                           # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 16.x or higher
- **npm** 7.x or higher
- **Mapbox Access Token** (required for map functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd waygen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Mapbox Token**
   
   Create or edit the Mapbox token in your source code:
   - Open `src/components/Map/MapContainer.jsx`
   - Set your token: `mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';`

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   
   Navigate to `http://localhost:5173` (or the port shown in the terminal)

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

---

## 📖 Usage Guide

### Creating a Mission

1. **Search for Location**
   - Use the search bar to find your survey area
   - Or manually navigate the map to your location

2. **Draw Survey Boundary**
   - Select a drawing tool from the toolbar (Rectangle, Polygon, or Circle)
   - Draw the boundary on the map
   - Use the Pointer tool to modify or delete shapes

3. **Configure Mission Settings**
   
   **Basics Section:**
   - Altitude (m)
   - Flight Speed (m/s)
   - Gimbal Pitch (degrees)
   - Selected Drone Model
   
   **Grid Settings:**
   - Path Type: Grid or Orbit
   - Side Overlap % (70% default)
   - Front Overlap % (80% default)
   - Grid Angle (0-360°)
   - Auto Direction toggle
   
   **Camera Settings:**
   - Waypoint Action: None, Take Photo, or Hover
   - Show Footprints toggle

4. **Generate Waypoints**
   - Click the **"Generate Path"** button
   - Waypoints will appear along the flight path
   - Camera footprints display if enabled

5. **Edit Waypoints (Optional)**
   - Click waypoints to select them
   - Drag waypoints to reposition
   - Use bulk edit to change altitude/speed for multiple points
   - Delete unwanted waypoints with the trash icon

6. **Export Mission**
   - Click the **"Download KMZ"** button
   - Save the file to your computer
   - Upload to your DJI drone via DJI Pilot app

### Importing Existing Missions

1. Click the **Upload** icon in the sidebar
2. Select a `.kml` or `.kmz` file
3. Waypoints will load into the editor
4. Make any necessary adjustments
5. Re-export the mission

### Keyboard Shortcuts

- **Ctrl+Z / Cmd+Z**: Undo
- **Ctrl+Shift+Z / Cmd+Shift+Z**: Redo
- **Delete**: Remove selected waypoints or shapes

---

## 🧮 Photogrammetry Math

### Camera Footprint Calculation

For each waypoint, the ground coverage area is calculated using:

1. **Ground Width**:
   ```
   Width = 2 × Altitude × tan(HFOV / 2)
   ```

2. **Ground Height** (4:3 aspect ratio):
   ```
   Height = Width × (3 / 4)
   ```

3. **Footprint Rectangle**:
   - Centered at waypoint coordinates
   - Rotated to match flight heading (gimbal yaw)
   - Rendered as semi-transparent overlay

### Waypoint Spacing

**Side Overlap** (between flight lines):
```
Line Spacing = Image Width × (1 - Side Overlap%)
```

**Front Overlap** (along flight path):
```
Waypoint Interval = Image Height × (1 - Front Overlap%)
```

### Drone Database

| Model | Horizontal FOV | Aspect Ratio |
|-------|---------------|--------------|
| DJI Mini 5 Pro | 84.0° | 4:3 |
| DJI Mini 4 Pro | 82.1° | 4:3 |
| DJI Mavic 4 Pro | 72.0° | 4:3 |
| Custom | User-defined | 4:3 |

---

## 🏗️ Architecture

### State Management

Waygen uses **Zustand** for centralized state management with the following store structure:

```javascript
{
  waypoints: [],           // Array of waypoint objects
  selectedIds: [],         // Selected waypoint IDs
  past: [],                // Undo stack
  future: [],              // Redo stack
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
    // ... additional settings
  }
}
```

### Key Components

**MapContainer.jsx**
- Initializes Mapbox map
- Manages MapboxDraw integration
- Handles waypoint rendering and interaction
- Implements drag-and-drop functionality
- Displays camera footprint overlays

**SidebarMain.jsx**
- Mission settings UI
- Path generation controls
- Import/Export functionality
- Waypoint bulk editing

**pathGenerator.js**
- Grid pattern algorithm
- Orbit pattern algorithm
- Overlap spacing calculations
- Boundary clipping

**djiExporter.js**
- Converts waypoints to DJI KMZ format
- Generates mission metadata
- Creates downloadable KMZ archive

---

## 🐛 Known Issues & Roadmap

See [TRIAGE.md](./TRIAGE.md) for current bugs and fixes in progress.

See [SPECS.md](./SPECS.md) for detailed feature specifications and pending implementations.

### Planned Features
- [ ] Split drone selection to "Basics" section
- [ ] Remove time-based photo interval (replaced by front overlap)
- [ ] Move "Show Footprints" to "Advanced" section
- [ ] Add hover effect for individual footprint highlighting
- [ ] Support for additional drone models
- [ ] Alternative path patterns (double grid, perimeter)

---

## 🤝 Contributing

This is a private project. For questions or suggestions, please contact the project maintainer.

---

## 📄 License

Private - All rights reserved.

---

## 🔗 Resources

- [Mapbox GL JS Documentation](https://docs.mapbox.com/mapbox-gl-js/)
- [Turf.js Documentation](https://turfjs.org/)
- [DJI Pilot KMZ Format](https://developer.dji.com/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://zustand-demo.pmnd.rs/)

---

## 💡 Tips

### Optimal Overlap Settings
- **General Mapping**: 70% side, 75% front
- **Dense Reconstruction**: 70% side, 80% front
- **3D Modeling**: 75% side, 85% front

### Grid Angle Recommendations
- Use **Auto Direction** for irregular boundaries
- Set to **0°** for north-south flight lines
- Set to **90°** for east-west flight lines
- Match terrain features for better image alignment

### Performance Tips
- Disable "Show Footprints" when editing large missions (100+ waypoints)
- Use "Generate Every Point" sparingly (increases waypoint count significantly)
- Keep boundaries simple for faster path generation

---

**Built with ❤️ for drone pilots and photogrammetry professionals**
