import { create } from 'zustand';
import { bearing } from '@turf/turf';
import mapboxgl from 'mapbox-gl';

export const useMissionStore = create((set, get) => ({
  waypoints: [],
  selectedIds: [],

  // Map Reference
  mapRef: null,

  // Mission metadata
  currentMissionFilename: null,

  // History Stack
  past: [],
  future: [],

  // Global Settings
  settings: {
    altitude: 60,
    speed: 10,
    gimbalPitch: -90,
    customFOV: 82.1,
    showFootprints: false,
    footprintColor: '#22c55e',
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
    units: 'metric',
    orbitRadius: 50,
    missionEndAction: 'goHome', // 'goHome' | 'autoLand'
  },

  // Actions
  setWaypoints: (waypoints) => set((state) => ({
    waypoints,
    past: [...state.past, state.waypoints],
    future: []
  })),

  addWaypoint: (waypoint) => set((state) => {
    const newWp = {
      id: crypto.randomUUID(),
      ...waypoint,
      altitude: state.settings.altitude,
      speed: state.settings.speed,
      gimbalPitch: state.settings.gimbalPitch,
      heading: 0
    };

    const updatedWaypoints = [...state.waypoints];
    if (updatedWaypoints.length > 0) {
      const lastIndex = updatedWaypoints.length - 1;
      const lastWp = updatedWaypoints[lastIndex];
      // Calculate bearing from last waypoint to new waypoint
      const newHeading = bearing(
        [lastWp.lng, lastWp.lat],
        [newWp.lng, newWp.lat]
      );
      updatedWaypoints[lastIndex] = { ...lastWp, heading: newHeading };
    }

    return {
      waypoints: [...updatedWaypoints, newWp],
      past: [...state.past, state.waypoints],
      future: []
    };
  }),

  updateSettings: (newSettings) => set((state) => ({
    settings: { ...state.settings, ...newSettings }
  })),

  // Selection Logic
  selectWaypoint: (id, multi) => set((state) => ({
    selectedIds: multi
      ? (state.selectedIds.includes(id) ? state.selectedIds.filter(i => i !== id) : [...state.selectedIds, id])
      : [id]
  })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  clearSelection: () => set({ selectedIds: [] }),

  // Bulk Edit Logic
  updateSelectedWaypoints: (updates) => {
    const { waypoints, selectedIds, past } = get();
    const newWaypoints = waypoints.map(wp =>
      selectedIds.includes(wp.id) ? { ...wp, ...updates } : wp
    );
    set({
      waypoints: newWaypoints,
      past: [...past, waypoints],
      future: []
    });
  },

  updateWaypoint: (id, updates) => {
    const { waypoints, past } = get();
    const newWaypoints = waypoints.map(wp =>
      wp.id === id ? { ...wp, ...updates } : wp
    );
    set({
      waypoints: newWaypoints,
      past: [...past, waypoints],
      future: []
    });
  },

  deleteSelectedWaypoints: () => {
    const { waypoints, selectedIds, past } = get();
    const newWaypoints = waypoints.filter(wp => !selectedIds.includes(wp.id));
    set({
      waypoints: newWaypoints,
      selectedIds: [],
      past: [...past, waypoints],
      future: []
    });
  },

  // Undo/Redo
  undo: () => {
    const { past, future, waypoints } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    set({
      waypoints: previous,
      past: newPast,
      future: [waypoints, ...future]
    });
  },

  redo: () => {
    const { past, future, waypoints } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      waypoints: next,
      past: [...past, waypoints],
      future: newFuture
    });
  },

  // Map Reference Actions
  setMapRef: (mapRef) => set({ mapRef }),

  fitMapToWaypoints: () => {
    const { mapRef, waypoints } = get();
    if (!mapRef || !waypoints || waypoints.length === 0) return;

    // Calculate bounds for all waypoints
    const bounds = new mapboxgl.LngLatBounds();
    waypoints.forEach(wp => {
      bounds.extend([wp.lng, wp.lat]);
    });

    // Fit map to bounds with padding
    mapRef.fitBounds(bounds, {
      padding: { top: 100, bottom: 100, left: 200, right: 350 }, // Shifted right - more left padding, less right padding
      maxZoom: 16,
      duration: 3000 // 3-second smooth animation
    });
  },

  // Mission Filename Actions
  setMissionFilename: (filename) => set({ currentMissionFilename: filename }),
  clearMissionFilename: () => set({ currentMissionFilename: null }),

  // Reset Logic
  resetTrigger: 0,
  resetMission: () => set((state) => ({
    waypoints: [],
    selectedIds: [],
    past: [],
    future: [],
    currentMissionFilename: null,
    resetTrigger: state.resetTrigger + 1
  }))
}));