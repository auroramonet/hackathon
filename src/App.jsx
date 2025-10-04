import { useState } from 'react';
import { Layout, MapSquare, SearchBox, DrawingButton, ColorPicker } from './components';
import './App.css';

function App() {
  const [mapConfig, setMapConfig] = useState({
    center: [-74.0066, 40.7135], // NYC Manhattan - great for 3D buildings
    zoom: 15.5,
    pitch: 45,
    bearing: -17.6
  });
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingColor, setDrawingColor] = useState('#ff4444');

  const handleLocationSelect = (locationData) => {
    console.log('Location selected:', locationData);
    console.log('New center coordinates:', locationData.center);
    setMapConfig(prev => {
      const newConfig = {
        ...prev,
        center: locationData.center,
        zoom: 16 // Zoom in when a location is selected
      };
      console.log('Updated map config:', newConfig);
      return newConfig;
    });
  };

  const handleDrawingComplete = (drawingData) => {
    console.log('Drawing completed:', drawingData);
    setIsDrawing(false);
  };

  return (
    <>
      <div className="app-overlay">
        <div className="app-header">
          <h1>Catastrophe Data</h1>
          <p>Search and explore locations in 3D</p>
        </div>
        
        <div className="app-search">
          <SearchBox 
            onLocationSelect={handleLocationSelect}
            placeholder="Search for any location..."
          />
        </div>
        
        <div className="app-drawing-controls">
          <DrawingButton 
            isActive={isDrawing}
            onClick={() => setIsDrawing(!isDrawing)}
          />
          <ColorPicker 
            color={drawingColor}
            onChange={setDrawingColor}
          />
        </div>
      </div>
      
      <MapSquare 
        key={`map-${mapConfig.center[0]}-${mapConfig.center[1]}`}
        fullScreen={true}
        center={mapConfig.center}
        zoom={mapConfig.zoom}
        pitch={mapConfig.pitch}
        bearing={mapConfig.bearing}
        style="mapbox://styles/mapbox/satellite-streets-v12"
        isDrawingMode={isDrawing}
        drawingColor={drawingColor}
        onDrawingComplete={handleDrawingComplete}
      />
    </>
  );
}

export default App;