import MapboxDraw from '@mapbox/mapbox-gl-draw';

const DragRectangleMode = { ...MapboxDraw.modes.draw_polygon };

DragRectangleMode.onSetup = function (opts) {
    const polygon = this.newFeature({
        type: 'Feature',
        properties: {
            isRectangle: true
        },
        geometry: {
            type: 'Polygon',
            coordinates: [[]]
        }
    });

    this.addFeature(polygon);
    this.clearSelectedFeatures();
    this.updateUIClasses({ mouse: 'add' });
    this.activateUIButton('polygon');
    this.setActionableState({
        trash: true
    });

    return {
        polygon,
        currentVertexPosition: 0
    };
};

DragRectangleMode.onMouseDown = function (state, e) {
    state.startPoint = [e.lngLat.lng, e.lngLat.lat];

    // Update the polygon with the start point
    this.updateFeature(state, e);
};

DragRectangleMode.onDrag = function (state, e) {
    if (state.startPoint) {
        this.updateFeature(state, e);
    }
};

DragRectangleMode.onMouseUp = function (state, e) {
    if (state.startPoint) {
        this.updateFeature(state, e);
        this.map.fire('draw.create', {
            features: [state.polygon.toGeoJSON()]
        });
        this.changeMode('simple_select', { featureIds: [state.polygon.id] });
    }
};

DragRectangleMode.updateFeature = function (state, e) {
    const start = state.startPoint;
    const end = [e.lngLat.lng, e.lngLat.lat];

    const minX = Math.min(start[0], end[0]);
    const maxX = Math.max(start[0], end[0]);
    const minY = Math.min(start[1], end[1]);
    const maxY = Math.max(start[1], end[1]);

    const coordinates = [
        [minX, maxY], // Top Left
        [maxX, maxY], // Top Right
        [maxX, minY], // Bottom Right
        [minX, minY], // Bottom Left
        [minX, maxY]  // Close Loop
    ];

    state.polygon.incomingCoords(coordinates);
};

DragRectangleMode.toDisplayFeatures = function (state, geojson, display) {
    const isActivePolygon = geojson.properties.id === state.polygon.id;
    geojson.properties.active = isActivePolygon ? 'true' : 'false';
    if (!isActivePolygon) return display(geojson);

    // Don't render points, just the polygon
    if (geojson.geometry.coordinates.length === 0) return;
    display(geojson);
};

export default DragRectangleMode;
