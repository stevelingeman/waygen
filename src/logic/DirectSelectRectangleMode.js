import { DirectMode } from 'mapbox-gl-draw-circle';

const DirectSelectRectangleMode = {
    ...DirectMode,

    isRectangle: function (feature) {
        // 1. Check explicit property
        if (feature && feature.properties && (feature.properties.isRectangle === true || feature.properties.isRectangle === 'true')) {
            return true;
        }

        // 2. Geometric Check: Is it an axis-aligned rectangle?
        if (feature && feature.geometry && feature.geometry.type === 'Polygon' && feature.geometry.coordinates.length > 0) {
            const coords = feature.geometry.coordinates[0];
            // Must have 5 points (4 corners + close)
            if (coords.length !== 5) return false;

            // Check axis alignment (allow small epsilon for floating point)
            const xs = coords.slice(0, 4).map(p => p[0]);
            const ys = coords.slice(0, 4).map(p => p[1]);

            const uniqueXs = new Set(xs.map(x => x.toFixed(5))).size;
            const uniqueYs = new Set(ys.map(y => y.toFixed(5))).size;

            // If it's a rectangle, we should have exactly 2 unique X's and 2 unique Y's
            return uniqueXs <= 2 && uniqueYs <= 2;
        }
        return false;
    },

    onDrag: function (state, e) {
        const { featureId, coordPath } = state;
        const feature = this.getFeature(featureId);

        // Use helper to check if it's a rectangle
        if (!this.isRectangle(feature)) {
            return DirectMode.onDrag.call(this, state, e);
        }

        // If dragging a VERTEX (coordPath exists like "0.0", "0.1", etc.)
        if (coordPath) {
            const parts = coordPath.split('.');
            const ringIndex = parseInt(parts[0], 10);
            const pointIndex = parseInt(parts[1], 10);

            // Only handle outer ring (index 0) and valid corner points (0-3)
            if (ringIndex === 0 && pointIndex >= 0 && pointIndex <= 3) {
                const coordinates = feature.coordinates[0];

                // Ensure it's a rectangle (5 points = 4 corners + close)
                if (!coordinates || coordinates.length !== 5) {
                    return DirectMode.onDrag.call(this, state, e);
                }

                const lng = e.lngLat.lng;
                const lat = e.lngLat.lat;

                // Calculate opposite corner (0<->2, 1<->3)
                const oppositeIndex = (pointIndex + 2) % 4;
                const oppositePoint = coordinates[oppositeIndex];

                if (!oppositePoint) {
                    return DirectMode.onDrag.call(this, state, e);
                }

                // Calculate new bounding box
                const minX = Math.min(lng, oppositePoint[0]);
                const maxX = Math.max(lng, oppositePoint[0]);
                const minY = Math.min(lat, oppositePoint[1]);
                const maxY = Math.max(lat, oppositePoint[1]);

                // Reconstruct rectangle
                const newCoords = [
                    [minX, maxY], // TL
                    [maxX, maxY], // TR
                    [maxX, minY], // BR
                    [minX, minY], // BL
                    [minX, maxY]  // Close
                ];

                // Use incomingCoords for internal update during drag
                feature.incomingCoords([newCoords]);
                return;
            }
        }

        // For anything else (body dragging, etc), use default behavior
        DirectMode.onDrag.call(this, state, e);
    },

    toDisplayFeatures: function (state, geojson, display) {
        const feature = this.getFeature(state.featureId);

        if (this.isRectangle(feature)) {
            // Hide midpoints for rectangles to prevent adding vertices
            if (geojson.properties.meta === 'midpoint') return;
        }
        // Use parent display logic to show vertices
        DirectMode.toDisplayFeatures.call(this, state, geojson, display);
    }
};

export default DirectSelectRectangleMode;
