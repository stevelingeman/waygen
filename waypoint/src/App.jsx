import React, { useState } from 'react';
import MapContainer from './components/Map/MapContainer';
import SidebarMain from './components/Sidebar/SidebarMain';
import DrawToolbar from './components/Map/DrawToolbar';
import SearchBar from './components/Common/SearchBar';

function App() {
  const [currentPolygon, setCurrentPolygon] = useState(null);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <div className="relative flex-grow">
        <SearchBar />
		<DrawToolbar />
        <MapContainer onPolygonDrawn={setCurrentPolygon} />
      </div>
      <SidebarMain currentPolygon={currentPolygon} />
    </div>
  );
}

export default App;