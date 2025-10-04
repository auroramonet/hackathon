<<<<<<< HEAD
import { useState } from 'react';
import { Layout, MapSquare, SearchBox } from './components';
import './App.css';
=======
import { Layout } from "./components";
import "./App.css";
import Map from "./components/Map";
>>>>>>> a438eef1ffd5f98e8a4cce90ea067b053d041c33

function App() {
  const [mapConfig, setMapConfig] = useState({
    center: [-74.0066, 40.7135], // NYC Manhattan - great for 3D buildings
    zoom: 15.5,
    pitch: 45,
    bearing: -17.6
  });

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

  return (
    <Layout>
      <div className="app">
<<<<<<< HEAD
        <h1>Interactive 3D Map</h1>
        <p>Search and explore locations in 3D</p>
        
        <SearchBox 
          onLocationSelect={handleLocationSelect}
          placeholder="Search for any location..."
        />
        
        <div className="app__map-container">
          <MapSquare 
            key={`map-${mapConfig.center[0]}-${mapConfig.center[1]}`}
            size={500}
            center={mapConfig.center}
            zoom={mapConfig.zoom}
            pitch={mapConfig.pitch}
            bearing={mapConfig.bearing}
            style="mapbox://styles/mapbox/satellite-streets-v12"
          />
        </div>
=======
        <h1>Welcome to Your React App</h1>
        <p>Start building your amazing application here!</p>
        <Map />
>>>>>>> a438eef1ffd5f98e8a4cce90ea067b053d041c33
      </div>
    </Layout>
  );
}

export default App;
