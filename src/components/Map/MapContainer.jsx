import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder'; // Import Search
import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css'; // Import Search CSS
import { useMissionStore } from '../../store/useMissionStore';

// Add your token in .env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Safe styles that avoid Mapbox GL JS "dasharray" crashes
const simpleStyles = [
  // ACTIVE (being drawn)
  {
    "id": "gl-draw-line",
    "type": "line",
    "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "#3b82f6", "line-width": 2 }
  },
  {
    "id": "gl-draw-polygon-fill",
    "type": "fill",
    "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    "paint": { "fill-color": "#3b82f6", "fill-outline-color": "#3b82f6", "fill-opacity": 0.2 }
  },
  {
    "id": "gl-draw-polygon-stroke-active",
    "type": "line",
    "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "#3b82f6", "line-width": 2 }
  },
  {
    "id": "gl-draw-point-point-stroke-active",
    "type": "circle",
    "filter": ["all", ["==", "$type", "Point"], ["!=", "mode", "static"]],
    "paint": { "circle-radius": 6, "circle-color": "#fff" }
  },
  {
    "id": "gl-draw-point",
    "type": "circle",
    "filter": ["all", ["==", "$type", "Point"], ["!=", "mode", "static"]],
    "paint": { "circle-radius": 4, "circle-color": "#3b82f6" }
  },
  // STATIC (finished shapes)
  {
    "id": "gl-draw-polygon-fill-static",
    "type": "fill",
    "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
    "paint": { "fill-color": "#000", "fill-outline-color": "#000", "fill-opacity": 0.1 }
  },
  {
    "id": "gl-draw-polygon-stroke-static",
    "type": "line",
    "filter": ["all", ["==", "$type", "Polygon"], ["==", "mode", "static"]],
    "layout": { "line-cap": "round", "line-join": "round" },
    "paint": { "line-color": "#000", "line-width": 2 }
  }
];

export default function MapContainer({ onPolygonDrawn }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const { waypoints, selectedIds, selectWaypoint, setSelectedIds } = useMissionStore();
  
  // State for the visual selection box (CSS positioning)
  const [selectionBox, setSelectionBox] = useState(null);
  const startPointRef = useRef(null); 

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98, 39], 
      zoom: 4,
      boxZoom: false 
    });

    // 1. Initialize Search Bar (Geocoder)
    const geocoder = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        mapboxgl: mapboxgl,
        marker: false, // Do not add a blue marker on search result
        collapsed: true // Expand when clicked
    });
    map.current.addControl(geocoder, 'top-right');

    // 2. Initialize Draw Tools
    draw.current = new MapboxDraw({
      userProperties: true,
      displayControlsDefault: false,
      styles: simpleStyles,
      modes: {
        ...MapboxDraw.modes,
        draw_circle: CircleMode,
        drag_circle: DragCircleMode,
        direct_select: DirectMode,
        simple_select: SimpleSelectMode
      }
    });
    map.current.addControl(draw.current);

    // 3. CRITICAL: Assign global variable HERE, after initialization
    window.mapboxDraw = draw.current;

    map.current.on('draw.create', (e) => onPolygonDrawn(e.features[0]));
    map.current.on('draw.update', (e) => onPolygonDrawn(e.features[0]));
    map.current.on('draw.delete', () => onPolygonDrawn(null));
    
    // --- Selection Logic ---

    map.current.on('click', (e) => {
      if (e.originalEvent._isDrag) return;

      const features = map.current.queryRenderedFeatures(e.point, { layers: ['waypoints-layer'] });
      
      if (features.length) {
        const id = features[0].properties.id;
        selectWaypoint(id, e.originalEvent.shiftKey);
      } else {
        // Only clear if clicking on empty map (not drawing shapes)
        const drawFeatures = map.current.queryRenderedFeatures(e.point, { 
            layers: ['gl-draw-polygon-fill-static.cold', 'gl-draw-polygon-fill.hot'] 
        });
        if (drawFeatures.length === 0) {
            setSelectedIds([]);
        }
      }
    });

    // --- Rubber Band Logic ---

    const onMouseMove = (e) => {
        if (!startPointRef.current) return;
        const start = startPointRef.current;
        const current = e.point;
        const minX = Math.min(start.x, current.x);
        const maxX = Math.max(start.x, current.x);
        const minY = Math.min(start.y, current.y);
        const maxY = Math.max(start.y, current.y);

        setSelectionBox({
            left: minX, top: minY, width: maxX - minX, height: maxY - minY
        });
    };

    const onMouseUp = (e) => {
        if (!startPointRef.current) return;
        const start = startPointRef.current;
        const end = e.point;

        if (Math.abs(start.x - end.x) < 5 && Math.abs(start.y - end.y) < 5) {
            startPointRef.current = null;
            setSelectionBox(null);
            map.current.dragPan.enable();
            map.current.off('mousemove', onMouseMove);
            map.current.off('mouseup', onMouseUp);
            return;
        }

        const bbox = [start, end];
        const features = map.current.queryRenderedFeatures(bbox, { layers: ['waypoints-layer'] });
        const ids = features.map(f => f.properties.id);
        
        if (ids.length > 0) {
            setSelectedIds(ids); 
        }

        startPointRef.current = null;
        setSelectionBox(null);
        map.current.dragPan.enable();
        
        e.originalEvent._isDrag = true; 
        setTimeout(() => { if(e.originalEvent) delete e.originalEvent._isDrag }, 100);

        map.current.off('mousemove', onMouseMove);
        map.current.off('mouseup', onMouseUp);
    };

    map.current.on('mousedown', (e) => {
      if (e.originalEvent.shiftKey) {
        e.preventDefault();
        map.current.dragPan.disable();
        startPointRef.current = e.point;
        map.current.on('mousemove', onMouseMove);
        map.current.on('mouseup', onMouseUp);
      }
    });

  }, []);

  // Update Waypoints Layer
  useEffect(() => {
    if (!map.current || !map.current.getSource('route')) return;
    
    const geojson = {
      type: 'FeatureCollection',
      features: waypoints.map(wp => ({
        type: 'Feature',
        properties: { id: wp.id, selected: selectedIds.includes(wp.id) },
        geometry: { type: 'Point', coordinates: [wp.lng, wp.lat] }
      }))
    };

    const lineGeo = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: waypoints.map(wp => [wp.lng, wp.lat])
      }
    };

    map.current.getSource('route').setData(lineGeo);
    map.current.getSource('waypoints').setData(geojson);
  }, [waypoints, selectedIds]);

  // Initial Layer Setup
  useEffect(() => {
      if(!map.current) return;
      map.current.on('load', () => {
          if (!map.current.getSource('route')) {
              map.current.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
              map.current.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                paint: { 'line-color': '#3b82f6', 'line-width': 2 }
              });
          }

          if (!map.current.getSource('waypoints')) {
              map.current.addSource('waypoints', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
              map.current.addLayer({
                id: 'waypoints-layer',
                type: 'circle',
                source: 'waypoints',
                paint: {
                  'circle-radius': 6,
                  'circle-color': ['case', ['boolean', ['get', 'selected'], false], '#facc15', '#3b82f6'],
                  'circle-stroke-width': 2,
                  'circle-stroke-color': '#ffffff'
                }
              });
          }
      });
  }, []);

  return (
    <div className="relative w-full h-full">
        <div ref={mapContainer} className="w-full h-full" />
        {selectionBox && (
            <div
                style={{
                    position: 'absolute',
                    left: selectionBox.left,
                    top: selectionBox.top,
                    width: selectionBox.width,
                    height: selectionBox.height,
                    border: '2px solid #3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    pointerEvents: 'none',
                    zIndex: 20
                }}
            />
        )}
    </div>
  );
}
