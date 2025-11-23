import React from 'react';
import { Square, Hexagon, Circle, MousePointer2 } from 'lucide-react';

export default function DrawToolbar({ currentMode, onModeChange }) {
  const tools = [
    { id: 'simple_select', icon: MousePointer2, title: 'Select (Pointer)' },
    { id: 'draw_rectangle', icon: Square, title: 'Draw Square' },
    { id: 'draw_polygon', icon: Hexagon, title: 'Draw Polygon' },
    { id: 'drag_circle', icon: Circle, title: 'Draw Circle' },
  ];

  return (
    <div className="absolute top-32 left-4 flex flex-col gap-2 bg-white rounded-md shadow-md p-1 z-10">
      {tools.map((tool) => {
        const Icon = tool.icon;
        const isActive = currentMode === tool.id || (tool.id === 'simple_select' && currentMode === 'direct_select');

        return (
          <button
            key={tool.id}
            onClick={() => {
              console.log('Switching to mode:', tool.id);
              onModeChange(tool.id);
            }}
            className={`p-2 rounded hover:bg-gray-100 flex items-center justify-center ${isActive ? 'text-blue-600 bg-blue-50' : 'text-gray-700'
              }`}
            title={tool.title}
          >
            <Icon size={20} />
          </button>
        );
      })}
    </div>
  );
}