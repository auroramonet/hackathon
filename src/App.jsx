import { useState } from "react";
import {
  Layout,
  MapSquare,
  SearchBox,
  DrawingButton,
  MagnitudeSlider,
} from "./components";
import { analyzeArea } from "./services/api";
import { getCompleteAreaAnalysis } from "./utils/apiUtils";
import "./App.css";

function App() {
  const [mapConfig, setMapConfig] = useState({
    center: [-74.0066, 40.7135], // NYC Manhattan - great for 3D buildings
    zoom: 15.5,
    pitch: 45,
    bearing: -17.6,
  });

  const [isDrawing, setIsDrawing] = useState(false);
  const [magnitude, setMagnitude] = useState(5.0); // Magnitude from 0 to 10
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastDrawnArea, setLastDrawnArea] = useState(null);

  const handleLocationSelect = (locationData) => {
    console.log("Location selected:", locationData);
    console.log("New center coordinates:", locationData.center);
    setMapConfig((prev) => {
      const newConfig = {
        ...prev,
        center: locationData.center,
        zoom: 16, // Zoom in when a location is selected
      };
      console.log("Updated map config:", newConfig);
      return newConfig;
    });
  };

  const handleDrawingComplete = async (drawingData) => {
    console.log("Drawing completed:", drawingData);
    setIsDrawing(false);
    setLastDrawnArea(drawingData);

    // Now we have bounding box data for API calls!
    if (drawingData.boundingBox) {
      console.log('Bounding box for APIs:', drawingData.apiCoordinates);
      
      // Call population and building APIs with the 4 bounding box points
      try {
        const { south, west, north, east } = drawingData.apiCoordinates;
        const areaAnalysis = await getCompleteAreaAnalysis(south, west, north, east);
        console.log('📊 Area Analysis:', areaAnalysis);
        
        if (areaAnalysis.success) {
          console.log(`🏠 Buildings found: ${areaAnalysis.buildings.total_buildings.toLocaleString()}`);
          console.log(`👥 Population: ${areaAnalysis.population.total_population.toLocaleString()}`);
          console.log(`🏥 Hospitals: ${areaAnalysis.summary.critical_facilities.hospitals}`);
          console.log(`🏫 Schools: ${areaAnalysis.summary.critical_facilities.schools}`);
        }
      } catch (error) {
        console.error('Failed to get area analysis:', error);
      }
    }

    // Get AI analysis
    setIsAnalyzing(true);
    try {
      const analysisData = {
        coordinates: drawingData.coordinates,
        magnitude: magnitude,
        center: drawingData.boundingBox ? drawingData.boundingBox.center : mapConfig.center,
        placeName: "Current location", // Could be enhanced with reverse geocoding
        boundingBox: drawingData.boundingBox,
      };

      const result = await analyzeArea(analysisData);
      setAiAnalysis(result);
      console.log("AI Analysis:", result);
    } catch (error) {
      console.error("Failed to get AI analysis:", error);
      setAiAnalysis({
        error:
          "Failed to generate analysis. Make sure the backend server is running.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      <div className="app-overlay">
        <div className="app-header">
          <h1>Catastrophe Data</h1>
          <p>Search and explore locations in 3D</p>
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
        drawingColor="#ff4444"
        drawingMagnitude={magnitude}
        onDrawingComplete={handleDrawingComplete}
      />

      <div className="app-map-controls">
        <div className="app-controls-left">
          <div className="app-drawing-controls">
            <DrawingButton
              isActive={isDrawing}
              onClick={() => setIsDrawing(!isDrawing)}
            />
            <MagnitudeSlider magnitude={magnitude} onChange={setMagnitude} />
          </div>

          <div className="app-search">
            <SearchBox
              onLocationSelect={handleLocationSelect}
              placeholder="Search for any location..."
            />
          </div>

          {/* AI Analysis Panel */}
          {(aiAnalysis || isAnalyzing) && (
            <div className="ai-analysis-panel">
              <div className="ai-analysis-header">
                <h3>AI Analysis</h3>
                {aiAnalysis && !aiAnalysis.error && (
                  <button
                    className="close-btn"
                    onClick={() => setAiAnalysis(null)}
                  >
                    ×
                  </button>
                )}
              </div>

              {isAnalyzing ? (
                <div className="ai-analysis-loading">
                  <div className="spinner"></div>
                  <p>Analyzing catastrophe area...</p>
                </div>
              ) : aiAnalysis.error ? (
                <div className="ai-analysis-error">
                  <p>{aiAnalysis.error}</p>
                </div>
              ) : (
                <div className="ai-analysis-content">
                  <div className="ai-analysis-metadata">
                    <span>
                      Magnitude: {aiAnalysis.metadata?.magnitude.toFixed(1)}
                    </span>
                    {aiAnalysis.metadata?.severity && (
                      <span
                        className={`severity-badge severity-${aiAnalysis.metadata.severity.toLowerCase()}`}
                      >
                        {aiAnalysis.metadata.severity}
                      </span>
                    )}
                    {aiAnalysis.metadata?.areaSize && (
                      <span>Area: {aiAnalysis.metadata.areaSize}</span>
                    )}
                  </div>
                  <div className="ai-analysis-text">{aiAnalysis.analysis}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default App;
