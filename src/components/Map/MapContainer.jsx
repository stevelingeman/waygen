import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { useMissionStore } from '../../store/useMissionStore';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Custom Teardrop Icon (Blue)
const TEARDROP_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 0 L35 20 A 15 15 0 0 1 5 20 Z" fill="#3b82f6" stroke="white" stroke-width="2"/>
  <circle cx="20" cy="20" r="8" fill="white"/>
</svg>
`);

// Custom Teardrop Icon (Red for Selected)
const TEARDROP_SELECTED_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 0 L35 20 A 15 15 0 0 1 5 20 Z" fill="#ef4444" stroke="white" stroke-width="2"/>
  <circle cx="20" cy="20" r="8" fill="white"/>
</svg>
`);

const simpleStyles = [
  // ... (Keep your existing simpleStyles array here to prevent crashes) ...
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
  const { waypoints, selectedIds, selectWaypoint, setSelectedIds, resetTrigger } = useMissionStore();

  // Handle Reset
  useEffect(() => {
    if (resetTrigger > 0 && draw.current) {
      draw.current.deleteAll();
      onPolygonDrawn(null);
    }
  }, [resetTrigger, onPolygonDrawn]);

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

    const geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      mapboxgl: mapboxgl,
      marker: false,
      collapsed: true
    });
    map.current.addControl(geocoder, 'top-right');

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
    window.mapboxDraw = draw.current;

    map.current.on('draw.create', (e) => onPolygonDrawn(e.features[0]));
    map.current.on('draw.update', (e) => onPolygonDrawn(e.features[0]));
    map.current.on('draw.delete', () => onPolygonDrawn(null));

    map.current.on('click', (e) => {
      if (e.originalEvent._isDrag) return;
      const features = map.current.queryRenderedFeatures(e.point, { layers: ['waypoints-symbol'] });

      if (features.length) {
        const id = features[0].properties.id;
        selectWaypoint(id, e.originalEvent.shiftKey);
      } else {
        const drawFeatures = map.current.queryRenderedFeatures(e.point, {
          layers: ['gl-draw-polygon-fill-static.cold', 'gl-draw-polygon-fill.hot']
        });
        if (drawFeatures.length === 0) setSelectedIds([]);
      }
    });

    const onMouseMove = (e) => {
      if (!startPointRef.current) return;
      const start = startPointRef.current;
      const current = e.point;
      const minX = Math.min(start.x, current.x);
      const maxX = Math.max(start.x, current.x);
      const minY = Math.min(start.y, current.y);
      const maxY = Math.max(start.y, current.y);
      setSelectionBox({ left: minX, top: minY, width: maxX - minX, height: maxY - minY });
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
      const features = map.current.queryRenderedFeatures(bbox, { layers: ['waypoints-symbol'] });
      const ids = features.map(f => f.properties.id);
      if (ids.length > 0) setSelectedIds(ids);

      startPointRef.current = null;
      setSelectionBox(null);
      map.current.dragPan.enable();
      e.originalEvent._isDrag = true;
      setTimeout(() => { if (e.originalEvent) delete e.originalEvent._isDrag }, 100);
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

  // --- Render Waypoints ---
  useEffect(() => {
    if (!map.current || !map.current.getSource('waypoints')) return;

    const geojson = {
      type: 'FeatureCollection',
      features: waypoints.map((wp, i) => ({
        type: 'Feature',
        properties: {
          id: wp.id,
          selected: selectedIds.includes(wp.id),
          heading: wp.heading || 0,
          index: i + 1
        },
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

    const routeSource = map.current.getSource('route');
    if (routeSource) routeSource.setData(lineGeo);

    const wpSource = map.current.getSource('waypoints');
    if (wpSource) wpSource.setData(geojson);
  }, [waypoints, selectedIds]);

  useEffect(() => {
    if (!map.current) return;
    map.current.on('load', () => {
      // Load Blue Icon
      const imgBlue = new Image();
      imgBlue.src = TEARDROP_IMAGE;
      imgBlue.onload = () => {
        if (!map.current.hasImage('teardrop')) {
          map.current.addImage('teardrop', imgBlue);
        }
      };

      // Load Red Icon
      const imgRed = new Image();
      imgRed.src = TEARDROP_SELECTED_IMAGE;
      imgRed.onload = () => {
        if (!map.current.hasImage('teardrop-selected')) {
          map.current.addImage('teardrop-selected', imgRed);
        }
      };

      if (!map.current.getSource('route')) {
        map.current.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.current.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          paint: { 'line-color': '#60a5fa', 'line-width': 2, 'line-opacity': 0.8 }
        });
      }

      if (!map.current.getSource('waypoints')) {
        map.current.addSource('waypoints', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        map.current.addLayer({
          id: 'waypoints-symbol',
          type: 'symbol',
          source: 'waypoints',
          layout: {
            'icon-image': ['case', ['boolean', ['get', 'selected'], false], 'teardrop-selected', 'teardrop'],
            'icon-size': 1.0,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-pitch-alignment': 'viewport',
            'icon-rotate': ['get', 'heading'],
            'icon-rotation-alignment': 'map',
            'icon-anchor': 'center',
            'text-field': ['to-string', ['get', 'index']],
            'text-size': 12,
            'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
            'text-offset': [0, 0.1], // Slight offset to center in the circle part
            'text-anchor': 'center',
            'text-allow-overlap': true,
            'text-ignore-placement': true
          },
          paint: {
            'text-color': ['case', ['boolean', ['get', 'selected'], false], '#ffffff', '#3b82f6'], // White on red, Blue on white circle (wait, icon has white circle)
            // Actually, the icon has a white circle in the center. 
            // Blue Icon: Blue body, White circle. Text should be Blue.
            // Red Icon: Red body, White circle. Text should be Red.
            'icon-opacity': 1
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

      {/* Custom Draw Controls */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <button
          onClick={() => draw.current.changeMode('draw_circle')}
          className="bg-white p-2 rounded shadow hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-2"
          title="Draw Circle"
        >
          <div className="w-3 h-3 rounded-full border-2 border-blue-600"></div>
          Circle
        </button>
        <button
          onClick={() => draw.current.changeMode('draw_polygon')}
          className="bg-white p-2 rounded shadow hover:bg-gray-50 text-gray-700 font-bold text-xs flex items-center gap-2"
          title="Draw Polygon"
        >
          <div className="w-3 h-3 border-2 border-blue-600"></div>
          Polygon
        </button>
      </div>
    </div>
  );
}
