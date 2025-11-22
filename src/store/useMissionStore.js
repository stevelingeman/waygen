import { create } from 'zustand';

export const useMissionStore = create((set, get) => ({
  waypoints: [],
  selectedIds: [],

  // History Stack
  past: [],
  future: [],

  // Global Settings
  settings: {
    altitude: 60,
    speed: 10, // m/s
    units: 'metric', // metric, imperial
    overlap: 80,
    angle: 0,
    gimbalPitch: -90,
    autoDirection: false,
    straightenLegs: true,
    generateEveryPoint: false,
    waypointAction: 'none', // none, photo, record
    photoInterval: 2, // seconds
    reversePath: false
  },

  setWaypoints: (newWaypoints) => {
    const { waypoints, past } = get();
    set({
      waypoints: newWaypoints,
      past: [...past, waypoints],
      future: []
    });
  },

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings }
    }));
  },

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

  // Reset Logic
  resetTrigger: 0,
  resetMission: () => set((state) => ({
    waypoints: [],
    selectedIds: [],
    past: [],
    future: [],
    resetTrigger: state.resetTrigger + 1
  }))
}));