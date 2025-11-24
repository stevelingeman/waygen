# Remaining Integration Code for SidebarMain.jsx

## Instructions
The following code changes need to be applied to `SidebarMain.jsx`. To avoid file corruption, these should be applied manually or very carefully.

## 1. Add required store properties and dialog state (after line 35)

```javascript
const {
  waypoints, selectedIds, settings,
  setWaypoints, updateSelectedWaypoints, deleteSelectedWaypoints,
  undo, redo, updateSettings, resetMission, fitMapToWaypoints,
  currentMissionFilename, setMissionFilename  // ADD THESE TWO
} = useMissionStore();

// ADD DIALOG STATE
const [showDownloadDialog, setShowDownloadDialog] = useState(false);
```

## 2. Add helper function for default filename (after handleGenerate, ~line 47)

```javascript
const getDefaultFilename = () => {
  if (currentMissionFilename) {
    return currentMissionFilename;
  }
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:]/g, '')
    .replace(/\..+/, '')
    .replace('T', '_')
    .substring(0, 15); // YYYYMMDD_HHMMSS
  return `waygen_${timestamp}`;
};
```

## 3. Add download handlers (after getDefaultFilename)

```javascript
const handleDownloadClick = () => {
  setShowDownloadDialog(true);
};

const handleDownloadConfirm = ({ filename, missionEndAction }) => {
  // Update mission end action in settings
  updateSettings({ missionEndAction });
  
  // Download with custom filename
  downloadKMZ(waypoints, settings, filename);
};
```

## 4. Update handleFileUpload to extract filename (modify ~lines 69-76)

Find this block:
```javascript
if (newPoints.length > 0) {
  setWaypoints(newPoints);
  alert(`Imported ${newPoints.length} waypoints!`);
  
  // Auto-zoom to fit all waypoints with a small delay
  setTimeout(() => {
    fitMapToWaypoints();
  }, 100);
}
```

Replace with:
```javascript
if (newPoints.length > 0) {
  setWaypoints(newPoints);
  
  // Extract and store filename (without extension)
  const filename = file.name.replace(/\.(kmz|kml)$/i, '');
  setMissionFilename(filename);
  
  alert(`Imported ${newPoints.length} waypoints!`);
  
  // Auto-zoom to fit all waypoints with a small delay
  setTimeout(() => {
    fitMapToWaypoints();
  }, 100);
}
```

## 5. Update header to show filename (modify ~line 220)

Find:
```javascript
<h1 className="font-bold text-xl text-gray-800">Waygen</h1>
```

Replace with:
```javascript
<div>
  <h1 className="font-bold text-xl text-gray-800">Waygen</h1>
  {currentMissionFilename && (
    <div 
      className="text-sm text-gray-500 truncate max-w-[200px]" 
      title={currentMissionFilename}
    >
      {currentMissionFilename}
    </div>
  )}
</div>
```

## 6. Update Download button (modify ~line 485)

Find:
```javascript
<button onClick={() => downloadKMZ(waypoints, settings)} disabled={waypoints.length === 0} className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all">
  <Download size={18} /> Download KMZ
</button>
```

Replace with:
```javascript
<button onClick={handleDownloadClick} disabled={waypoints.length === 0} className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all">
  <Download size={18} /> Download KMZ
</button>
```

## 7. Add DownloadDialog component (before final closing tags, ~line 489)

Add before the final `</div>`:
```javascript
      <DownloadDialog
        isOpen={showDownloadDialog}
        onClose={() => setShowDownloadDialog(false)}
        onDownload={handleDownloadConfirm}
        defaultFilename={getDefaultFilename()}
        defaultMissionEndAction={settings.missionEndAction}
      />
    </div>
  );
}
```
