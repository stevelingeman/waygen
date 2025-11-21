import React from 'react';
import { Square, Hexagon, Circle, MousePointer2 } from 'lucide-react';

export default function DrawToolbar() {
  const setMode = (mode) => {
    if (window.mapboxDraw) window.mapboxDraw.changeMode(mode);
  };

  return (
    <div className="absolute top-4 left-4 bg-white p-1 rounded shadow z-10 flex flex-col gap-1">
       <button onClick={() => setMode('simple_select')} className="p-2 hover:bg-gray-100 rounded" title="Select"><MousePointer2 size={20}/></button>
       <button onClick={() => setMode('draw_polygon')} className="p-2 hover:bg-gray-100 rounded" title="Polygon"><Hexagon size={20}/></button>
       <button onClick={() => setMode('draw_circle')} className="p-2 hover:bg-gray-100 rounded" title="Circle"><Circle size={20}/></button>
    </div>
  );
}