import React, { useState } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { generatePhotogrammetryPath } from '../../logic/pathGenerator';
import { downloadKMZ } from '../../utils/djiExporter';
import { Trash2, Undo, Redo, Download, Play } from 'lucide-react';
import { parseImport } from '../../utils/kmlImporter';

export default function SidebarMain({ currentPolygon }) {
  
  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const geojson = await parseImport(file);
    // Convert GeoJSON points to your waypoint format and setWaypoints(newPoints)
  } catch (err) {
    alert("Failed to parse file");
  }};
 
  
  const { 
    waypoints, selectedIds, 
    setWaypoints, updateSelectedWaypoints, deleteSelectedWaypoints,
    undo, redo 
  } = useMissionStore();

  const [settings, setSettings] = useState({
    altitude: 60,
    overlap: 80,
    angle: 0,
    gimbalPitch: -90
  });

  const handleGenerate = () => {
    if (!currentPolygon) return alert("Draw a shape first!");
    const path = generatePhotogrammetryPath(
      currentPolygon, 
      settings.altitude, 
      settings.overlap, 
      settings.angle, 
      settings.gimbalPitch
    );
    setWaypoints(path);
  };

  // Bulk Edit Mode
  if (selectedIds.length > 0) {
    return (
      <div className="p-4 bg-gray-50 h-full border-l w-80 flex flex-col">
        <h2 className="font-bold text-lg mb-4">Edit Selected ({selectedIds.length})</h2>
        
        <label className="text-xs font-bold text-gray-500">Altitude (m)</label>
        <input 
          type="number" 
          className="border p-2 rounded w-full mb-4"
          placeholder="Mixed"
          onChange={(e) => updateSelectedWaypoints({ altitude: Number(e.target.value) })}
        />

        <label className="text-xs font-bold text-gray-500">Speed (m/s)</label>
        <input 
          type="number" 
          className="border p-2 rounded w-full mb-4"
          placeholder="Mixed"
          onChange={(e) => updateSelectedWaypoints({ speed: Number(e.target.value) })}
        />

        <div className="mt-auto flex gap-2">
             <button onClick={deleteSelectedWaypoints} className="flex-1 bg-red-500 text-white p-2 rounded flex items-center justify-center gap-2">
                <Trash2 size={16} /> Delete
             </button>
        </div>
      </div>
    );
  }

  // Default Settings Mode
  return (
    <input type="file" onChange={handleFileUpload} className="text-xs mb-4" />
    <div className="p-4 bg-white h-full border-l w-80 flex flex-col overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
         <h1 className="font-bold text-xl">WaypointMap</h1>
         <div className="flex gap-1">
            <button onClick={undo} className="p-1 hover:bg-gray-100 rounded"><Undo size={18}/></button>
            <button onClick={redo} className="p-1 hover:bg-gray-100 rounded"><Redo size={18}/></button>
         </div>
      </div>

      <div className="space-y-4 mb-8">
        <div>
            <label className="text-xs font-bold text-gray-500">Altitude (AGL) {settings.altitude}m</label>
            <input type="range" min="10" max="120" value={settings.altitude} onChange={e => setSettings({...settings, altitude: Number(e.target.value)})} className="w-full" />
        </div>
        <div>
            <label className="text-xs font-bold text-gray-500">Overlap {settings.overlap}%</label>
            <input type="range" min="20" max="90" value={settings.overlap} onChange={e => setSettings({...settings, overlap: Number(e.target.value)})} className="w-full" />
        </div>
        <div>
            <label className="text-xs font-bold text-gray-500">Path Angle {settings.angle}°</label>
            <input type="range" min="0" max="360" value={settings.angle} onChange={e => setSettings({...settings, angle: Number(e.target.value)})} className="w-full" />
        </div>
        <div>
            <label className="text-xs font-bold text-gray-500">Gimbal Pitch {settings.gimbalPitch}°</label>
            <input type="number" value={settings.gimbalPitch} onChange={e => setSettings({...settings, gimbalPitch: Number(e.target.value)})} className="border p-1 rounded w-full" />
        </div>
      </div>

      <button onClick={handleGenerate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded mb-2 flex items-center justify-center gap-2">
        <Play size={18} /> Generate Path
      </button>

      <div className="mt-auto pt-4 border-t">
         <div className="text-xs text-gray-500 mb-2 text-center">{waypoints.length} Waypoints • ~{Math.round(waypoints.length * 2)}s Flight</div>
         <button onClick={() => downloadKMZ(waypoints)} disabled={waypoints.length === 0} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold p-3 rounded flex items-center justify-center gap-2">
            <Download size={18} /> Download KMZ
         </button>
      </div>
    </div>
  );
}