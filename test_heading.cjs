
const { create } = require('zustand');
const turf = require('@turf/turf');

// Mock dependencies
const bearing = turf.bearing;

// Simplified store implementation for testing
const useMissionStore = create((set, get) => ({
    waypoints: [],
    settings: {
        speed: 10,
        altitude: 60,
        gimbalPitch: -90
    },

    addWaypoint: (waypoint) => set((state) => {
        // Inherit speed and heading from last waypoint if available
        let speed = state.settings.speed;
        let heading = 0;

        if (state.waypoints.length > 0) {
            const lastWp = state.waypoints[state.waypoints.length - 1];
            speed = Math.round((lastWp.speed || state.settings.speed) * 10) / 10;
            heading = lastWp.heading || 0;
        }

        const newWp = {
            id: 'new-id',
            ...waypoint,
            altitude: state.settings.altitude,
            speed: speed,
            gimbalPitch: state.settings.gimbalPitch,
            heading: heading
        };

        const updatedWaypoints = [...state.waypoints];
        if (updatedWaypoints.length > 0) {
            const lastIndex = updatedWaypoints.length - 1;
            const lastWp = updatedWaypoints[lastIndex];
            // Calculate bearing from last waypoint to new waypoint
            const newHeading = Math.round(bearing(
                [lastWp.lng, lastWp.lat],
                [newWp.lng, newWp.lat]
            ));
            updatedWaypoints[lastIndex] = { ...lastWp, heading: newHeading };
            newWp.heading = newHeading;
        }

        return {
            waypoints: [...updatedWaypoints, newWp]
        };
    }),

    updateWaypoint: (id, updates) => set((state) => ({
        waypoints: state.waypoints.map(wp => wp.id === id ? { ...wp, ...updates } : wp)
    }))
}));

// Test
// Test
console.log("Adding WP1...");
useMissionStore.getState().addWaypoint({ lng: 0, lat: 0 });
// WP1 Heading is 0 by default

console.log("Adding WP2 at (1,1)...");
useMissionStore.getState().addWaypoint({ lng: 1, lat: 1 }); // Bearing 45
const waypoints = useMissionStore.getState().waypoints;

console.log("WP1 Heading (updated):", waypoints[0].heading);
console.log("WP2 Heading:", waypoints[1].heading);

// WP2 should inherit the NEW heading of WP1 (which is the bearing to WP2)
// Expected: 45 (Rounded)
// Actual (Current Bug): 0

if (waypoints[1].heading === 45) {
    console.log("SUCCESS: Inherited Bearing (45)");
} else {
    console.log("FAILURE: Expected 45, got " + waypoints[1].heading);
}

if (Number.isInteger(waypoints[1].heading)) {
    console.log("SUCCESS: Heading is Integer");
} else {
    console.log("FAILURE: Heading is NOT Integer");
}
