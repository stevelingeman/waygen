import React, { useEffect, useRef, useState } from 'react';
import * as turf from '@turf/turf';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import MapboxGeocoder from '@mapbox/mapbox-gl-geocoder';
import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import '@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css';
import { useMissionStore } from '../../store/useMissionStore';
import DragRectangleMode from '../../logic/DragRectangleMode';
import DrawToolbar from './DrawToolbar';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

// Custom Teardrop Icon (Blue - Solid)
const TEARDROP_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 0 L35 20 A 15 15 0 0 1 5 20 Z" fill="#3b82f6" stroke="white" stroke-width="2"/>
</svg>
`);

// Custom Teardrop Icon (Red - Solid for Selected)
const TEARDROP_SELECTED_IMAGE = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 0 L35 20 A 15 15 0 0 1 5 20 Z" fill="#ef4444" stroke="white" stroke-width="2"/>
</svg>
`);

const simpleStyles = [
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
  const { waypoints, selectedIds, selectWaypoint, setSelectedIds, resetTrigger, createCircleTrigger, settings } = useMissionStore();

  // Handle Reset
  useEffect(() => {
    if (resetTrigger > 0 && draw.current) {
      draw.current.deleteAll();
      onPolygonDrawn(null);
    }
  }, [resetTrigger, onPolygonDrawn]);

  // Handle Create Circle
  useEffect(() => {
    if (createCircleTrigger > 0 && draw.current && map.current) {
      const center = map.current.getCenter();
      const radius = settings.orbitRadius || 50;
      const options = { steps: 64, units: 'meters' };
      const circle = turf.circle([center.lng, center.lat], radius, options);

      // Ensure it has an ID for MapboxDraw
      circle.id = crypto.randomUUID();

      draw.current.add(circle);
      onPolygonDrawn(circle);
    }
  }, [createCircleTrigger, onPolygonDrawn, settings.orbitRadius]);

  const [selectionBox, setSelectionBox] = useState(null);
  const startPointRef = useRef(null);

  // Handle Radius Change from Store (Two-way binding)
  useEffect(() => {
    if (!draw.current || !map.current) return;

    const selectedIds = draw.current.getSelectedIds();
    if (selectedIds.length === 0) return;

    const feature = draw.current.get(selectedIds[0]);
    if (!feature || feature.geometry.type !== 'Polygon') return;

    // Check if it's a "circle" (heuristic or property)
    // For now, we'll assume if we are in Orbit mode, we treat it as a circle
    // or if it was created with our circle tool.

    // Calculate current radius to avoid infinite loops
    const center = turf.centroid(feature);
    const currentRadius = turf.distance(
      center,
      turf.point(feature.geometry.coordinates[0][0]),
      { units: 'meters' }
    );

    if (Math.abs(currentRadius - settings.orbitRadius) > 1) {
      // Update the circle geometry
      const newCircle = turf.circle(
        center.geometry.coordinates,
        settings.orbitRadius,
        { steps: 64, units: 'meters' }
      );

      // Preserve ID and properties
      newCircle.id = feature.id;
      newCircle.properties = { ...feature.properties, isCircle: true };

      draw.current.add(newCircle);
      onPolygonDrawn(newCircle);
    }
  }, [settings.orbitRadius]);

  // Update store when circle is drawn/edited
  const updateRadiusFromFeature = (feature) => {
    if (!feature || feature.geometry.type !== 'Polygon') return;

    const center = turf.centroid(feature);
    const radius = turf.distance(
      center,
      turf.point(feature.geometry.coordinates[0][0]),
      { units: 'meters' }
    );

    // Only update if significantly different to avoid loops
    if (Math.abs(radius - settings.orbitRadius) > 1) {
      useMissionStore.getState().updateSettings({ orbitRadius: Math.round(radius) });
    }
  };

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
      controls: {
        point: false,
        line: false,
        polygon: false,
        trash: false,
        combine_features: false,
        uncombine_features: false
      },
      styles: simpleStyles,
      modes: {
        ...MapboxDraw.modes,
        drag_circle: DragCircleMode,
        draw_rectangle: DragRectangleMode,
        direct_select: DirectMode,
        simple_select: SimpleSelectMode
      }
    });
    map.current.addControl(draw.current);
    window.mapboxDraw = draw.current;

    map.current.on('draw.create', (e) => {
      const feature = e.features[0];

      // 1. Enforce "Circle" property if created via drag_circle
      if (draw.current.getMode() === 'drag_circle') {
        draw.current.setFeatureProperty(feature.id, 'isCircle', true);
        feature.properties.isCircle = true;
      }

      // 2. Handle Rectangle Creation (Optional: Tag it)
      if (draw.current.getMode() === 'draw_rectangle') {
        // It's already a polygon, so path generator handles it fine.
      }

      // 3. Check for "Accidental Large Circle" (Click vs Drag)
      // If the user just clicks, it might create a huge default circle. We resize it to 50m.
      const center = turf.centroid(feature);
      const currentRadius = turf.distance(
        center,
        turf.point(feature.geometry.coordinates[0][0]),
        { units: 'meters' }
      );

      if (currentRadius > 500) {
        // Resize to 50m
        const newCircle = turf.circle(
          center.geometry.coordinates,
          50,
          { steps: 64, units: 'meters' }
        );
        newCircle.id = feature.id;
        newCircle.properties = { ...feature.properties, isCircle: true };

        draw.current.add(newCircle);
        // Update store with 50m
        useMissionStore.getState().updateSettings({ orbitRadius: 50 });
        onPolygonDrawn(newCircle);
      } else {
        updateRadiusFromFeature(feature);
        onPolygonDrawn(feature);
      }

      // 3. Auto-Deselect Tool (Switch to Simple Select)
      // This prevents drawing another circle immediately and shows resize handles
      setTimeout(() => {
        draw.current.changeMode('simple_select', { featureIds: [feature.id] });
      }, 100);
    });

    map.current.on('draw.update', (e) => {
      const feature = e.features[0];
      updateRadiusFromFeature(feature);
      onPolygonDrawn(feature);
    });

    map.current.on('draw.selectionchange', (e) => {
      if (e.features.length > 0) {
        updateRadiusFromFeature(e.features[0]);
        onPolygonDrawn(e.features[0]);
      } else {
        onPolygonDrawn(null);
      }
    });

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

    map.current.on('load', () => {
      // Add Mission Path Source
      map.current.addSource('mission-path', {
        type: 'geojson',
        data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } }
      });

      // Add Mission Path Layer (Line)
      map.current.addLayer({
        id: 'mission-path-line',
        type: 'line',
        source: 'mission-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      // Add Waypoints Source
      map.current.addSource('waypoints', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Add Waypoints Layer
      map.current.addLayer({
        id: 'waypoints-symbol',
        type: 'symbol',
        source: 'waypoints',
        layout: {
          'icon-image': ['case', ['get', 'selected'], 'teardrop-selected', 'teardrop'],
          'icon-size': [
            'interpolate', ['linear'], ['zoom'],
            10, 0.5,
            15, 0.75,
            20, 1
          ],
          'icon-anchor': 'center',
          'icon-allow-overlap': true,
          'icon-rotate': ['get', 'heading'],
          'icon-rotation-alignment': 'map',
          'text-field': ['to-string', ['get', 'index']],
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            10, 9,
            15, 11,
            20, 13
          ],
          'text-offset': [0, 0],
          'text-anchor': 'center',
          'text-allow-overlap': true,
          'text-rotation-alignment': 'map', // Rotate text with icon/map so it stays upright relative to icon? No, usually text stays upright relative to viewport or map.
          // If 'map', text rotates with the map. If 'viewport', it stays upright.
          // If icon rotates (heading), we might want text to stay upright relative to viewport for readability?
          // But if it's inside the icon, maybe it should rotate with the icon?
          // User said "heading icons are pointed correct direction".
          // Let's try 'viewport' for text so numbers are always readable, or 'map' if they want it fixed to the ground.
          // Usually for sequence numbers inside a rotating icon, we want them to be readable (upright).
          // But if the icon is upside down, the number will be over the "point" if we don't rotate it?
          // Actually, if anchor is center, and text-offset is 0,0, it stays in center.
          // Let's stick to viewport alignment for readability.
          'text-rotation-alignment': 'viewport'
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': '#000000',
          'text-halo-width': 0.5
        }
      });

      // Load Images
      const loadIcon = (name, url) => {
        const img = new Image();
        img.src = url;
        img.onload = () => {
          if (!map.current.hasImage(name)) map.current.addImage(name, img);
        };
      };
      loadIcon('teardrop', TEARDROP_IMAGE);
      loadIcon('teardrop-selected', TEARDROP_SELECTED_IMAGE);

      // Force Initial Data Update
      // This ensures waypoints and path are rendered if they exist before map load
      const currentWaypoints = useMissionStore.getState().waypoints;
      const currentSelectedIds = useMissionStore.getState().selectedIds;

      if (currentWaypoints.length > 0) {
        const features = currentWaypoints.map((wp, index) => ({
          type: 'Feature',
          properties: {
            id: wp.id,
            index: index + 1,
            selected: currentSelectedIds.includes(wp.id),
            heading: wp.heading || 0
          },
          geometry: {
            type: 'Point',
            coordinates: [wp.lng, wp.lat]
          }
        }));
        map.current.getSource('waypoints').setData({ type: 'FeatureCollection', features });

        const lineCoords = currentWaypoints.map(wp => [wp.lng, wp.lat]);
        map.current.getSource('mission-path').setData({
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: lineCoords }
        });
      }
    });

    const updateMode = (e) => {
      setCurrentMode(e.mode);
      if (e.mode === 'drag_circle' || e.mode === 'draw_rectangle') {
        map.current.dragPan.disable();
      } else {
        map.current.dragPan.enable();
      }
    };

    map.current.on('draw.modechange', updateMode);

  }, []);

  // Force Layout Updates (Fix for HMR/Persisted Styles)
  useEffect(() => {
    if (!map.current || !map.current.getLayer('waypoints-symbol')) return;

    map.current.setLayoutProperty('waypoints-symbol', 'text-offset', [0, 0]);
    map.current.setLayoutProperty('waypoints-symbol', 'text-anchor', 'center');
    map.current.setLayoutProperty('waypoints-symbol', 'icon-anchor', 'center');
    map.current.setLayoutProperty('waypoints-symbol', 'text-rotation-alignment', 'viewport');
  }, []);

  // Update Waypoints Source & Path
  useEffect(() => {
    if (!map.current) return;

    const wpSource = map.current.getSource('waypoints');
    const pathSource = map.current.getSource('mission-path');

    if (wpSource) {
      const features = waypoints.map((wp, index) => ({
        type: 'Feature',
        properties: {
          id: wp.id,
          index: index + 1,
          selected: selectedIds.includes(wp.id),
          heading: wp.heading || 0
        },
        geometry: {
          type: 'Point',
          coordinates: [wp.lng, wp.lat]
        }
      }));
      wpSource.setData({ type: 'FeatureCollection', features });
    }

    if (pathSource) {
      const lineCoords = waypoints.map(wp => [wp.lng, wp.lat]);
      pathSource.setData({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: lineCoords
        }
      });
    }
  }, [waypoints, selectedIds]);

  // Ensure default radius is reasonable on load
  useEffect(() => {
    if (settings.orbitRadius > 500) {
      useMissionStore.getState().updateSettings({ orbitRadius: 50 });
    }
  }, []);

  const [currentMode, setCurrentMode] = useState('simple_select');

  return (
    <div className={`relative w-full h-full ${currentMode === 'drag_circle' || currentMode === 'draw_rectangle' ? 'force-crosshair' : ''}`}>
      <style>{`
        .force-crosshair .mapboxgl-canvas-container {
          cursor: crosshair !important;
        }
        .force-crosshair .mapboxgl-canvas {
          cursor: crosshair !important;
        }
      `}</style>
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

      {/* Custom Draw Controls - Moved down to avoid overlap */}
      <DrawToolbar
        currentMode={currentMode}
        onModeChange={(mode) => {
          // 1. Change Mode in MapboxDraw
          draw.current?.changeMode(mode);

          // 2. Manually Update React State (Guaranteed UI Feedback)
          setCurrentMode(mode);

          // 3. Manually Handle DragPan (Guaranteed Interaction Fix)
          if (map.current) {
            if (mode === 'drag_circle' || mode === 'draw_rectangle') {
              map.current.dragPan.disable();
            } else {
              map.current.dragPan.enable();
            }
          }
        }}
      />
    </div>
  );
}
