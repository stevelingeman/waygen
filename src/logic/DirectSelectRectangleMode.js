import { DirectMode } from 'mapbox-gl-draw-circle';

const DirectSelectRectangleMode = {
    ...DirectMode,

    onDrag: function (state, e) {
        const { featureId, coordPath } = state;
        const feature = this.getFeature(featureId);

        // If not a rectangle, use Circle DirectMode behavior
        if (!feature.properties.isRectangle) {
            return DirectMode.onDrag.call(this, state, e);
        }

        // If dragging a point (coordPath is like "0.0", "0.1", etc.)
        if (coordPath) {
            const parts = coordPath.split('.');
            const ringIndex = parseInt(parts[0], 10);
            const pointIndex = parseInt(parts[1], 10);

            // Only handle outer ring (index 0) and valid points
            if (ringIndex === 0 && !isNaN(pointIndex)) {
                const coordinates = feature.coordinates[0];

                // Ensure it's a rectangle (5 points = 4 corners + close)
                if (coordinates.length !== 5) {
                    return DirectMode.onDrag.call(this, state, e);
                }

                const lng = e.lngLat.lng;
                const lat = e.lngLat.lat;

                // Calculate opposite index (0<->2, 1<->3)
                const oppositeIndex = (pointIndex + 2) % 4;
                const oppositePoint = coordinates[oppositeIndex];

                // New BBox
                const minX = Math.min(lng, oppositePoint[0]);
                const maxX = Math.max(lng, oppositePoint[0]);
                const minY = Math.min(lat, oppositePoint[1]);
                const maxY = Math.max(lat, oppositePoint[1]);

                // Reconstruct rectangle (always TL, TR, BR, BL order)
                const newCoords = [
                    [minX, maxY], // TL
                    [maxX, maxY], // TR
                    [maxX, minY], // BR
                    [minX, minY], // BL
                    [minX, maxY]  // Close
                ];

                feature.incomingCoords([newCoords]);
                return;
            }
        }

        // Fallback
        DirectMode.onDrag.call(this, state, e);
    },

    toDisplayFeatures: function (state, geojson, display) {
        const feature = this.getFeature(state.featureId);
        if (feature.properties.isRectangle) {
            // Hide midpoints for rectangles to prevent adding vertices
            if (geojson.properties.meta === 'midpoint') return;
        }
        // Use parent display logic
        DirectMode.toDisplayFeatures.call(this, state, geojson, display);
    }
};

export default DirectSelectRectangleMode;
