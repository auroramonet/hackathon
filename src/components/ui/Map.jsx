import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Map.css';

const Map = ({ 
  accessToken = import.meta.env.VITE_MAPBOX_TOKEN, // Use environment variable
  center = [-74.0066, 40.7135], // Default to NYC coordinates
  zoom = 15.5,
  style = 'mapbox://styles/mapbox/standard',
  pitch = 45, // 3D tilt angle (0-60 degrees)
  bearing = -17.6, // Map rotation in degrees
  isDrawingMode = false,
  drawingColor = '#ff4444',
  drawingMagnitude = 5.0, // Magnitude from 0 to 10
  onDrawingComplete,
  className = '',
  ...props 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const isDrawing = useRef(false);
  const drawingPath = useRef([]);

  useEffect(() => {
    if (map.current) return; // Initialize map only once

    // Debug: Log the access token
    console.log('Mapbox Access Token:', accessToken);
    
    // Check if we have a valid access token
    if (!accessToken || accessToken === 'undefined') {
      console.error('Mapbox access token is missing or undefined');
      return;
    }

    // Set the access token
    mapboxgl.accessToken = accessToken;

    // Add a small delay to ensure the container is rendered
    const initMap = () => {
      try {
        console.log('Initializing map with container:', mapContainer.current);

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: style,
          config: {
            basemap: {
              theme: 'monochrome'
            }
          },
          center: center,
          zoom: zoom,
          pitch: pitch,
          bearing: bearing,
          antialias: true,
          attributionControl: false, // Remove attribution for cleaner look
        });

        map.current.on('style.load', () => {
          console.log('Map style loaded successfully');
          
          const layers = map.current.getStyle().layers;
          const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
          )?.id;

          // Add realistic 3D buildings layer
          map.current.addLayer(
            {
              id: 'realistic-3d-buildings',
              source: 'composite',
              'source-layer': 'building',
              filter: ['==', 'extrude', 'true'],
              type: 'fill-extrusion',
              minzoom: 0, // Show at ALL zoom levels
              paint: {
                'fill-extrusion-color': [
                  'interpolate',
                  ['linear'],
                  ['get', 'height'],
                  0, '#C0C0C0',    // Light gray for low buildings
                  50, '#A0A0A0',   // Medium gray for medium buildings  
                  100, '#808080',  // Darker gray for tall buildings
                  200, '#606060'   // Dark gray for skyscrapers
                ],
                'fill-extrusion-height': ['get', 'height'],
                'fill-extrusion-base': ['get', 'min_height'],
                'fill-extrusion-opacity': 0.9 // More solid appearance
              }
            },
            labelLayerId
          );
          
          console.log('Added persistent 3D buildings with no zoom restrictions');
          
          console.log('Map initialized - ready for drawing');
        });

        map.current.on('error', (e) => {
          console.error('Map error:', e);
        });

        // Add navigation controls (includes pitch and bearing controls for 3D)
        map.current.addControl(new mapboxgl.NavigationControl({
          visualizePitch: true // Show pitch control for 3D
        }), 'top-right');
        
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    // Use setTimeout to ensure container is rendered
    const timeoutId = setTimeout(initMap, 100);

    // Clean up on unmount
    return () => {
      clearTimeout(timeoutId);
      if (map.current) {
        map.current.remove();
      }
    };
  }, [accessToken, style]); // Only re-initialize if token or style changes

  // Handle dynamic changes to map properties
  useEffect(() => {
    console.log('Map props changed:', { center, zoom, pitch, bearing });
    if (map.current && map.current.isStyleLoaded()) {
      console.log('Flying to new location:', center);
      map.current.easeTo({
        center: center,
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        duration: 1000 // Smooth transition
      });
    } else {
      console.log('Map not ready for updates');
    }
  }, [center, zoom, pitch, bearing]);

  // Handle freehand drawing mode
  useEffect(() => {
    if (!map.current) return;

    const handleMouseDown = (e) => {
      if (!isDrawingMode) return;
      
      isDrawing.current = true;
      drawingPath.current = [e.lngLat];
      
      // Disable map interactions during drawing
      map.current.dragPan.disable();
      map.current.scrollZoom.disable();
      map.current.getCanvas().style.cursor = 'crosshair';
      
      console.log('Started drawing at:', e.lngLat);
    };

    const handleMouseMove = (e) => {
      if (!isDrawingMode || !isDrawing.current) return;
      
      drawingPath.current.push(e.lngLat);
      
      // Show temporary line while drawing
      if (map.current.getSource('temp-drawing-line')) {
        map.current.getSource('temp-drawing-line').setData({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: drawingPath.current.map(p => [p.lng, p.lat])
          }
        });
      } else {
        map.current.addSource('temp-drawing-line', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'LineString',
              coordinates: drawingPath.current.map(p => [p.lng, p.lat])
            }
          }
        });
        
        map.current.addLayer({
          id: 'temp-drawing-line-layer',
          type: 'line',
          source: 'temp-drawing-line',
          paint: {
            'line-color': drawingColor,
            'line-width': 3,
            'line-opacity': 0.8
          }
        });
      }
    };

    const handleMouseUp = () => {
      if (!isDrawingMode || !isDrawing.current) return;
      
      isDrawing.current = false;
      
      // Convert path to polygon and create 3D shape
      if (drawingPath.current.length > 2) {
        const coordinates = drawingPath.current.map(p => [p.lng, p.lat]);
        // Close the polygon
        coordinates.push(coordinates[0]);
        
        const polygonId = `drawn-polygon-${Date.now()}`;
        // Calculate height based on magnitude: 0 = 10m, 10 = 100m
        const height = 10 + (drawingMagnitude * 9);
        
        // Add 3D polygon with single semi-transparent layer
        map.current.addSource(polygonId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [coordinates]
            },
            properties: {
              color: drawingColor,
              height: height,
              magnitude: drawingMagnitude
            }
          }
        });
        
        // Single semi-transparent layer - height corresponds to magnitude
        map.current.addLayer({
          id: polygonId,
          type: 'fill-extrusion',
          source: polygonId,
          paint: {
            'fill-extrusion-color': drawingColor,
            'fill-extrusion-height': height,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.4
          }
        });
        
        console.log(`Created 3D polygon - Magnitude: ${drawingMagnitude.toFixed(1)}, Height: ${height.toFixed(1)}m, Points: ${drawingPath.current.length}`);
        
        if (onDrawingComplete) {
          onDrawingComplete({
            id: polygonId,
            coordinates: coordinates,
            color: drawingColor
          });
        }
      }
      
      // Remove temporary line
      if (map.current.getLayer('temp-drawing-line-layer')) {
        map.current.removeLayer('temp-drawing-line-layer');
      }
      if (map.current.getSource('temp-drawing-line')) {
        map.current.removeSource('temp-drawing-line');
      }
      
      // Re-enable map interactions
      map.current.dragPan.enable();
      map.current.scrollZoom.enable();
      
      drawingPath.current = [];
    };

    if (isDrawingMode) {
      map.current.on('mousedown', handleMouseDown);
      map.current.on('mousemove', handleMouseMove);
      map.current.on('mouseup', handleMouseUp);
      map.current.getCanvas().style.cursor = 'crosshair';
      console.log('✏️ Drawing mode enabled - click and drag to draw');
    } else {
      map.current.off('mousedown', handleMouseDown);
      map.current.off('mousemove', handleMouseMove);
      map.current.off('mouseup', handleMouseUp);
      map.current.getCanvas().style.cursor = '';
      
      // Re-enable map interactions when exiting drawing mode
      if (map.current.dragPan && !map.current.dragPan.isEnabled()) {
        map.current.dragPan.enable();
      }
      if (map.current.scrollZoom && !map.current.scrollZoom.isEnabled()) {
        map.current.scrollZoom.enable();
      }
    }

    return () => {
      if (map.current) {
        map.current.off('mousedown', handleMouseDown);
        map.current.off('mousemove', handleMouseMove);
        map.current.off('mouseup', handleMouseUp);
      }
    };
  }, [isDrawingMode, drawingColor, drawingMagnitude, onDrawingComplete]);

  // Force map resize when container dimensions change
  useEffect(() => {
    const resizeMap = () => {
      if (map.current) {
        // Small delay to ensure container has resized
        setTimeout(() => {
          map.current.resize();
        }, 100);
      }
    };

    window.addEventListener('resize', resizeMap);
    // Also resize on mount
    resizeMap();

    return () => {
      window.removeEventListener('resize', resizeMap);
    };
  }, []);

  return (
    <div 
      ref={mapContainer} 
      className={`map-container ${className}`}
      {...props}
    />
  );
};

export default Map;
