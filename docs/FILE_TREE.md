# PROJECT FILE STRUCTURE
.
├── README.md
├── SIDEBAR_INTEGRATION_GUIDE.md
├── SPECS.md
├── SPECS_KMZ_ENHANCEMENTS.md
├── SPECS_SPEED_CALCULATION.md
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── public/
│   └── vite.svg
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── COMPONENTS.md
│   ├── DEPENDENCIES.md
│   └── FILE_TREE.md
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── store/
    │   └── useMissionStore.js
    ├── components/
    │   ├── Map/
    │   │   ├── MapContainer.jsx
    │   │   └── DrawToolbar.jsx
    │   ├── Sidebar/
    │   │   ├── SidebarMain.jsx
    │   │   └── EditSelectedPanel.jsx
    │   ├── Dialogs/
    │   │   ├── DownloadDialog.jsx
    │   │   └── FlightWarningDialog.jsx
    │   └── Common/
    │       └── SearchBar.jsx
    ├── logic/
    │   ├── pathGenerator.js
    │   └── DragRectangleMode.js
    └── utils/
        ├── djiExporter.js
        ├── dronePresets.js
        ├── geospatial.js
        ├── kmlImporter.js
        └── units.js