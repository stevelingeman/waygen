import React, { useState } from 'react';
import MapContainer from './components/Map/MapContainer';
import SidebarMain from './components/Sidebar/SidebarMain';

import SearchBar from './components/Common/SearchBar';

function App() {
  const [currentPolygon, setCurrentPolygon] = useState(null);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000); // Simulate initialization
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-2xl font-bold text-blue-600 animate-pulse">
          Waygen Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="relative flex-grow">
        <SearchBar />

        <MapContainer onPolygonDrawn={setCurrentPolygon} />
      </div>
      <SidebarMain currentPolygon={currentPolygon} setCurrentPolygon={setCurrentPolygon} />
    </div>
  );
}

export default App;