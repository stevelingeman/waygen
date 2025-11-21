import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { CircleMode, DragCircleMode, DirectMode, SimpleSelectMode } from 'mapbox-gl-draw-circle';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { useMissionStore } from '../../store/useMissionStore';

// Add your token in .env
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapContainer({ onPolygonDrawn }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const draw = useRef(null);
  const { waypoints, selectedIds, selectWaypoint, setSelectedIds } = useMissionStore();
  
  // Rubber band state
  const [startBox, setStartBox] = useState(null);

  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-98, 39], 
      zoom: 4
    });

    draw.current = new MapboxDraw({
      userProperties: true,
      displayControlsDefault: false,
      modes: {
        ...MapboxDraw.modes,
        draw_circle: CircleMode,
        drag_circle: DragCircleMode,
        direct_select: DirectMode,
        simple_select: SimpleSelectMode
      }
    });
    map.current.addControl(draw.current);

    map.current.on('draw.create', (e) => onPolygonDrawn(e.features[0]));
    map.current.on('draw.update', (e) => onPolygonDrawn(e.features[0]));
    
    // Selection Logic
    map.current.on('click', (e) => {
      // Click on empty map clears selection
      if (e.defaultPrevented) return;
      const features = map.current.queryRenderedFeatures(e.point, { layers: ['waypoints-layer'] });
      if (features.length) {
        const id = features[0].properties.id;
        selectWaypoint(id, e.originalEvent.shiftKey);
        e.preventDefault();
      } else {
        setSelectedIds([]);
      }
    });

    // Rubber Band Logic (Shift + Drag)
    map.current.on('mousedown', (e) => {
      if (e.originalEvent.shiftKey) {
        e.preventDefault();
        map.current.dragPan.disable();
        setStartBox(e.point);
      }
    });

    map.current.on('mouseup', (e) => {
      if (startBox) {
        const endBox = e.point;
        const features = map.current.queryRenderedFeatures(
          [startBox, endBox], 
          { layers: ['waypoints-layer'] }
        );
        const ids = features.map(f => f.properties.id);
        setSelectedIds(ids);
        setStartBox(null);
        map.current.dragPan.enable();
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
        properties: { 
            id: wp.id, 
            selected: selectedIds.includes(wp.id) 
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

    map.current.getSource('route').setData(lineGeo);
    map.current.getSource('waypoints').setData(geojson);
  }, [waypoints, selectedIds]);

  // Initial Layer Setup
  useEffect(() => {
      if(!map.current) return;
      map.current.on('load', () => {
          map.current.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            paint: { 'line-color': '#3b82f6', 'line-width': 2 }
          });

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
      });
  }, []);

  // Expose drawing controls to parent via refs or store if needed
  // For now, simple button handlers in Sidebar will call draw.current.changeMode
  window.mapboxDraw = draw.current; 

  return <div ref={mapContainer} className="w-full h-full relative" />;
}