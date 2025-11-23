import React, { useState } from 'react';
import { useMissionStore } from '../../store/useMissionStore';
import { generatePhotogrammetryPath } from '../../logic/pathGenerator';
import { downloadKMZ } from '../../utils/djiExporter';
import { parseImport } from '../../utils/kmlImporter';
import { Trash2, Undo, Redo, Download, Play, Upload, ChevronDown, ChevronUp, Settings, Camera, Map as MapIcon, Layers } from 'lucide-react';
import * as turf from '@turf/turf';

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
    undo, redo, updateSettings, resetMission, fitMapToWaypoints
  } = useMissionStore();

  const handleReset = () => {
    if (confirm("Are you sure you want to reset the mission? This will clear all waypoints and shapes.")) {
      resetMission();
    }
  };

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
            altitude: f.properties.altitude !== undefined ? f.properties.altitude : settings.altitude,
            speed: f.properties.speed !== undefined ? f.properties.speed : settings.speed,
            gimbalPitch: f.properties.gimbalPitch !== undefined ? f.properties.gimbalPitch : settings.gimbalPitch,
            heading: f.properties.heading !== undefined ? f.properties.heading : 0
          });
        }
      });

      if (newPoints.length > 0) {
        setWaypoints(newPoints);
        alert(`Imported ${newPoints.length} waypoints!`);

        // Auto-zoom to fit all waypoints with a small delay
        setTimeout(() => {
          fitMapToWaypoints();
        }, 100);
      } else {
        alert("No waypoints found in file.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to parse file. Ensure it is a valid KML/KMZ.");
    }
  };

  // Mission statistics calculations
  const calculateMissionDistance = (waypoints) => {
    if (waypoints.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
      const from = turf.point([waypoints[i].lng, waypoints[i].lat]);
      const to = turf.point([waypoints[i + 1].lng, waypoints[i + 1].lat]);
      totalDistance += turf.distance(from, to, { units: 'meters' });
    }

    return totalDistance;
  };

  const calculateMissionTime = (waypoints, speed) => {
    if (speed === 0) return 0;
    const distance = calculateMissionDistance(waypoints);
    return Math.round(distance / speed);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters, units) => {
    if (units === 'metric') {
      if (meters >= 1000) {
        return `${(meters / 1000).toFixed(2)} km`;
      }
      return `${Math.round(meters)} m`;
    } else {
      const feet = meters * 3.28084;
      if (feet >= 5280) {
        return `${(feet / 5280).toFixed(2)} mi`;
      }
      return `${Math.round(feet)} ft`;
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

  return (
    <div className="bg-white h-full border-l w-80 flex flex-col shadow-xl z-10 flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center bg-gray-50">
        <h1 className="font-bold text-xl text-gray-800">Waygen</h1>
        <div className="flex gap-1">
          <button onClick={handleReset} className="p-2 hover:bg-red-100 hover:text-red-600 rounded-full shadow-sm border transition-all" title="Reset Mission"><Trash2 size={16} /></button>
          <div className="w-px h-6 bg-gray-300 mx-1 self-center"></div>
          <button onClick={undo} className="p-2 hover:bg-white rounded-full shadow-sm border transition-all"><Undo size={16} /></button>
          <button onClick={redo} className="p-2 hover:bg-white rounded-full shadow-sm border transition-all"><Redo size={16} /></button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">

        {/* Import */}
        <div className="p-3">
          <label className="flex items-center justify-center gap-2 w-full p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer font-medium text-sm">
            <Upload size={16} /> Import KML/KMZ
            <input type="file" onChange={handleFileUpload} className="hidden" accept=".kml,.kmz" />
          </label>
        </div>

        <Section title="Basics" icon={Settings} defaultOpen={true}>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Units</label>
              <select
                value={settings.units}
                onChange={e => updateSettings({ units: e.target.value })}
                className="w-full border rounded p-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="metric">Metric (m)</option>
                <option value="imperial">Imperial (ft)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1 block">Altitude ({settings.units === 'metric' ? 'm' : 'ft'})</label>
              <input
                type="number"
                value={settings.altitude}
                onChange={e => updateSettings({ altitude: Number(e.target.value) })}
                className="w-full border rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Global Speed (m/s)</label>
            <input
              type="number"
              value={settings.speed}
              onChange={e => updateSettings({ speed: Number(e.target.value) })}
              className="w-full border rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="mt-4 border-t pt-3">
            <label className="text-xs font-bold text-gray-500 mb-1 block">Drone Model (FOV)</label>
            <select
              value={settings.selectedDrone}
              onChange={e => {
                const val = e.target.value;
                let fov = 82.1;
                if (val === 'dji_mini_5_pro') fov = 84;
                if (val === 'dji_mavic_4_pro') fov = 72;
                if (val === 'custom') fov = settings.customFOV;

                updateSettings({ selectedDrone: val, customFOV: fov });
              }}
              className="w-full border rounded p-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="dji_mini_4_pro">DJI Mini 4 Pro (82.1°)</option>
              <option value="dji_mini_5_pro">DJI Mini 5 Pro (84°)</option>
              <option value="dji_mavic_4_pro">DJI Mavic 4 Pro (72°)</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {settings.selectedDrone === 'custom' && (
            <div className="mt-2">
              <label className="text-xs font-bold text-gray-500 mb-1 block">Custom HFOV (°)</label>
              <input
                type="number"
                value={settings.customFOV}
                onChange={e => updateSettings({ customFOV: Number(e.target.value) })}
                className="w-full border rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          )}
        </Section>

        <Section title="Coverage" icon={MapIcon} defaultOpen={true}>
          <div className="mb-3">
            <label className="text-xs font-bold text-gray-500 mb-1 block">Path Type</label>
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => updateSettings({ pathType: 'grid' })}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${settings.pathType === 'grid' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Grid
              </button>
              <button
                onClick={() => updateSettings({ pathType: 'orbit', spacing: 10 })}
                className={`flex-1 py-1 text-xs font-bold rounded-md transition-all ${settings.pathType === 'orbit' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Orbit
              </button>
            </div>
          </div>



          {settings.pathType === 'grid' ? (
            <>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Side Overlap {settings.sideOverlap}%</label>
                <input type="range" min="0" max="90" value={settings.sideOverlap} onChange={e => updateSettings({ sideOverlap: Number(e.target.value) })} className="w-full accent-blue-600" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Front Overlap {settings.frontOverlap}%</label>
                <input type="range" min="0" max="90" value={settings.frontOverlap} onChange={e => updateSettings({ frontOverlap: Number(e.target.value) })} className="w-full accent-blue-600" />
              </div>

              <div className="flex items-center justify-between mt-2">
                <label className="text-sm text-gray-700">Auto Path Angle</label>
                <input
                  type="checkbox"
                  checked={settings.autoDirection}
                  onChange={e => updateSettings({ autoDirection: e.target.checked })}
                  className="accent-blue-600 w-4 h-4"
                />
              </div>

              <div className={`mt-2 transition-opacity ${settings.autoDirection ? 'opacity-50' : 'opacity-100'}`}>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Path Angle {settings.angle}°</label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={settings.angle}
                  onChange={e => updateSettings({ angle: Number(e.target.value) })}
                  disabled={settings.autoDirection}
                  className={`w-full ${settings.autoDirection ? 'accent-gray-400 cursor-not-allowed' : 'accent-blue-600'}`}
                />
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">Spacing (m)</label>
                <input
                  type="number"
                  min="1"
                  value={settings.spacing}
                  onChange={e => updateSettings({ spacing: Number(e.target.value) })}
                  className="w-full border rounded p-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Distance between waypoints along the perimeter.</p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <label className="text-sm text-gray-700">Reverse Path</label>
            <input
              type="checkbox"
              checked={settings.reversePath}
              onChange={e => updateSettings({ reversePath: e.target.checked })}
              className="accent-blue-600 w-4 h-4"
            />
          </div>
        </Section>

        <Section title="Camera" icon={Camera} defaultOpen={true}>
          <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Gimbal Pitch {settings.gimbalPitch}°</label>
            <input type="range" min="-90" max="0" value={settings.gimbalPitch} onChange={e => updateSettings({ gimbalPitch: Number(e.target.value) })} className="w-full accent-blue-600" />
          </div>
          <div className="mt-2">
            <label className="text-xs font-bold text-gray-500 mb-1 block">Action per Waypoint</label>
            <select
              value={settings.waypointAction}
              onChange={e => updateSettings({ waypointAction: e.target.value })}
              className="w-full border rounded p-1.5 text-sm bg-gray-50 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="none">No Action</option>
              <option value="photo">Take Photo</option>
              <option value="record">Start/Stop Recording</option>
            </select>
          </div>
        </Section>



        <Section title="Advanced" icon={Layers} defaultOpen={true}>
          <div className="flex items-center justify-between">
            <label className="text-sm text-gray-700">Show Footprints</label>
            <input
              type="checkbox"
              checked={settings.showFootprints}
              onChange={e => updateSettings({ showFootprints: e.target.checked })}
              className="accent-blue-600 w-4 h-4"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <label className="text-sm text-gray-700">Straighten Legs</label>
            <input
              type="checkbox"
              checked={settings.straightenLegs}
              onChange={e => updateSettings({ straightenLegs: e.target.checked })}
              className="accent-blue-600 w-4 h-4"
            />
          </div>
          <div className="flex items-center justify-between mt-3">
            <label className="text-sm text-gray-700">Generate Every Point</label>
            <input
              type="checkbox"
              checked={settings.generateEveryPoint}
              onChange={e => updateSettings({ generateEveryPoint: e.target.checked })}
              className="accent-blue-600 w-4 h-4"
            />
          </div>
        </Section>

      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50">
        <button onClick={handleGenerate} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded-lg shadow-md mb-3 flex items-center justify-center gap-2 transition-all transform active:scale-95">
          <Play size={18} /> Generate Path
        </button>

        <div className="flex gap-2">
          <div className="flex-1 bg-white border rounded p-2 text-center">
            <div className="text-xs text-gray-400 font-bold uppercase">Waypoints</div>
            <div className="font-bold text-gray-700">{waypoints.length}</div>
          </div>
          <div className="flex-1 bg-white border rounded p-2 text-center">
            <div className="text-xs text-gray-400 font-bold uppercase">Distance</div>
            <div className="font-bold text-gray-700">
              {waypoints.length >= 2
                ? formatDistance(calculateMissionDistance(waypoints), settings.units)
                : settings.units === 'metric' ? '0 m' : '0 ft'
              }
            </div>
          </div>
          <div className="flex-1 bg-white border rounded p-2 text-center">
            <div className="text-xs text-gray-400 font-bold uppercase">Time</div>
            <div className="font-bold text-gray-700">
              {waypoints.length >= 2
                ? formatTime(calculateMissionTime(waypoints, settings.speed))
                : '0:00'
              }
            </div>
          </div>
        </div>

        <button onClick={() => downloadKMZ(waypoints, settings)} disabled={waypoints.length === 0} className="w-full mt-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold p-3 rounded-lg shadow-md flex items-center justify-center gap-2 transition-all">
          <Download size={18} /> Download KMZ
        </button>
      </div>
    </div>
  );
}
