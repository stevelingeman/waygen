import React, { useState } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { generatePhotogrammetryPath } from '../../logic/pathGenerator';
import { downloadKMZ } from '../../utils/djiExporter';
import { parseImport } from '../../utils/kmlImporter';
import { Trash2, Undo, Redo, Download, Play, Upload, ChevronDown, ChevronUp, Settings, Camera, Map as MapIcon, Layers } from 'lucide-react';

const Section = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <Icon size={18} className="text-blue-600" />
          {title}
        </div>
        {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>
      {isOpen && <div className="p-3 pt-0 space-y-4 animate-in slide-in-from-top-2 duration-200">
        {children}
      </div>}
    </div>
  );
};

export default function SidebarMain({ currentPolygon }) {
  const {
    waypoints, selectedIds, settings,
    setWaypoints, updateSelectedWaypoints, deleteSelectedWaypoints,
    undo, redo, updateSettings
  } = useMissionStore();

  const handleGenerate = () => {
    if (!currentPolygon) return alert("Draw a shape first!");
    const path = generatePhotogrammetryPath(currentPolygon, settings);
    setWaypoints(path);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const geojson = await parseImport(file);
      const newPoints = [];
      geojson.features.forEach(f => {
        if (f.geometry.type === "Point") {
          newPoints.push({
            id: crypto.randomUUID(),
            lng: f.geometry.coordinates[0],
            lat: f.geometry.coordinates[1],
            altitude: settings.altitude,
            speed: settings.speed,
            gimbalPitch: settings.gimbalPitch,
            heading: 0
          });
        }
      });

      if (newPoints.length > 0) {
        setWaypoints(newPoints);
        alert(`Imported ${newPoints.length} waypoints!`);
      } else {
        alert("No waypoints found in file.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse file. Ensure it is a valid KML/KMZ.");
    }
  };

  // Bulk Edit Mode
  if (selectedIds.length > 0) {
    const selectedWaypoints = waypoints.filter(wp => selectedIds.includes(wp.id));
    const firstWp = selectedWaypoints[0];

    // Check if all have same values
    const sameAltitude = selectedWaypoints.every(wp => wp.altitude === firstWp.altitude);
    const sameSpeed = selectedWaypoints.every(wp => wp.speed === firstWp.speed);
    const sameGimbal = selectedWaypoints.every(wp => wp.gimbalPitch === firstWp.gimbalPitch);
    const sameHeading = selectedWaypoints.every(wp => wp.heading === firstWp.heading);
    // Lat/Lng will always be different for multiple points, so we only show if 1 is selected
    const singleSelection = selectedIds.length === 1;

    return (
      <div className="p-4 bg-gray-50 h-full border-l w-80 flex flex-col shadow-xl z-10 overflow-y-auto">
        <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Settings size={20} /> Edit Selected ({selectedIds.length})
        </h2>

        {singleSelection && (
          <>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-xs font-bold text-gray-500">Lat</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full text-xs"
                  value={firstWp.lat}
                  onChange={(e) => updateSelectedWaypoints({ lat: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500">Lng</label>
                <input
                  type="number"
                  className="border p-2 rounded w-full text-xs"
                  value={firstWp.lng}
                  onChange={(e) => updateSelectedWaypoints({ lng: Number(e.target.value) })}
                />
              </div>
            </div>
          </>
        )}

        <label className="text-xs font-bold text-gray-500">Altitude (m)</label>
        <input
          type="number"
          className="border p-2 rounded w-full mb-4"
          placeholder={sameAltitude ? "" : "Mixed"}
          value={sameAltitude ? firstWp.altitude : ""}
          onChange={(e) => updateSelectedWaypoints({ altitude: Number(e.target.value) })}
        />

        <label className="text-xs font-bold text-gray-500">Speed (m/s)</label>
        <input
          type="number"
          className="border p-2 rounded w-full mb-4"
          placeholder={sameSpeed ? "" : "Mixed"}
          value={sameSpeed ? firstWp.speed : ""}
          onChange={(e) => updateSelectedWaypoints({ speed: Number(e.target.value) })}
        />

        <label className="text-xs font-bold text-gray-500">Gimbal Pitch (°)</label>
        <input
          type="number"
          className="border p-2 rounded w-full mb-4"
          placeholder={sameGimbal ? "" : "Mixed"}
          value={sameGimbal ? firstWp.gimbalPitch : ""}
          onChange={(e) => updateSelectedWaypoints({ gimbalPitch: Number(e.target.value) })}
        />

        <label className="text-xs font-bold text-gray-500">Heading (°)</label>
        <input
          type="number"
          className="border p-2 rounded w-full mb-4"
          placeholder={sameHeading ? "" : "Mixed"}
          value={sameHeading ? firstWp.heading : ""}
          onChange={(e) => updateSelectedWaypoints({ heading: Number(e.target.value) })}
        />

        <div className="mt-auto flex gap-2 pt-4">
          <button onClick={deleteSelectedWaypoints} className="flex-1 bg-red-500 hover:bg-red-600 text-white p-2 rounded flex items-center justify-center gap-2 transition-colors">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
    );
  }
}
