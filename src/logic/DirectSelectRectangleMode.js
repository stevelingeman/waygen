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
        // coordPath format for Polygon is "ringIndex.pointIndex"
        if (coordPath) {
            const parts = coordPath.split('.');
            const ringIndex = parseInt(parts[0], 10);
            const pointIndex = parseInt(parts[1], 10);

            // Only handle outer ring (index 0) and valid points
            if (ringIndex === 0 && !isNaN(pointIndex)) {
                const coordinates = feature.coordinates[0];
                // We expect 5 points (0-4), where 4 is same as 0
                if (coordinates.length === 5) {
                    const lng = e.lngLat.lng;
                    const lat = e.lngLat.lat;

                    // Calculate opposite index
                    // 0 <-> 2, 1 <-> 3
                    const oppositeIndex = (pointIndex + 2) % 4;
                    const oppositePoint = coordinates[oppositeIndex];

                    // New BBox
                    const minX = Math.min(lng, oppositePoint[0]);
                    const maxX = Math.max(lng, oppositePoint[0]);
                    const minY = Math.min(lat, oppositePoint[1]);
                    const maxY = Math.max(lat, oppositePoint[1]);

                    // Reconstruct rectangle
                    // 0: TL (minX, maxY)
                    // 1: TR (maxX, maxY)
                    // 2: BR (maxX, minY)
                    // 3: BL (minX, minY)
                    // But we need to respect the original rotation/order?
                    // DragRectangleMode creates: TL, TR, BR, BL, TL
                    // So:
                    // 0: [minX, maxY]
                    // 1: [maxX, maxY]
                    // 2: [maxX, minY]
                    // 3: [minX, minY]

                    // However, if the user dragged it such that it flipped, the indices might swap geometrically.
                    // But we just want to update the coordinates at the specific indices to match the new bbox corners.

                    // We need to know which corner 'pointIndex' corresponds to in the new bbox.
                    // Actually, we can just update the adjacent points.

                    // Let's stick to the "update adjacent" logic which is robust to flipping.
                    // Current dragged point: [lng, lat]
                    // Opposite point: [oppX, oppY]

                    // Adjacent 1: (pointIndex + 1) % 4
                    // Adjacent 2: (pointIndex + 3) % 4

                    // One adjacent shares X with dragged, Y with opposite.
                    // The other shares Y with dragged, X with opposite.

                    // We need to check the original structure.
                    // If 0 (TL) is dragged to (newX, newY). Opposite 2 (BR) is (oppX, oppY).
                    // 1 (TR) should be (oppX, newY).
                    // 3 (BL) should be (newX, oppY).

                    // Let's verify this pattern for all 4.
                    // If 1 (TR) is dragged to (newX, newY). Opposite 3 (BL) is (oppX, oppY).
                    // 2 (BR) should be (newX, oppY).
                    // 0 (TL) should be (oppX, newY).

                    // It seems:
                    // Adjacent 1 (next): shares ?
                    // Adjacent 2 (prev): shares ?

                    // Let's just enforce the BBox logic based on the assumption that 0=TL, 1=TR, 2=BR, 3=BL.
                    // But if the user flips it, 0 might become BR physically.
                    // Does that matter? As long as it stays a rectangle.

                    const newCoords = [
                        [minX, maxY], // 0
                        [maxX, maxY], // 1
                        [maxX, minY], // 2
                        [minX, minY], // 3
                        [minX, maxY]  // 4 (Close)
                    ];

                    // We need to be careful. If we just force 0 to be TL, but the user dragged 0 to be BR, 
                    // then the whole shape flips. That's actually fine and expected for a rectangle resize.

                    feature.incomingCoords([newCoords]);
                    return;
                }
            }
        }

        // Fallback
        DirectMode.onDrag.call(this, state, e);
    }
};

export default DirectSelectRectangleMode;
