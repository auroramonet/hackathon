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
          
          // Add catastrophe data source
          map.current.addSource('catastrophe-data', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [-74.010, 40.710],
                      [-74.005, 40.710],
                      [-74.005, 40.715],
                      [-74.010, 40.715],
                      [-74.010, 40.710]
                    ]]
                  },
                  properties: {
                    height: 50,
                    base_height: 0,
                    color: '#ff4444',
                    type: 'flood',
                    severity: 'high'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [-74.015, 40.705],
                      [-74.012, 40.705],
                      [-74.012, 40.708],
                      [-74.015, 40.708],
                      [-74.015, 40.705]
                    ]]
                  },
                  properties: {
                    height: 80,
                    base_height: 0,
                    color: '#ff8800',
                    type: 'fire',
                    severity: 'critical'
                  }
                },
                {
                  type: 'Feature',
                  geometry: {
                    type: 'Polygon',
                    coordinates: [[
                      [-74.000, 40.720],
                      [-73.995, 40.720],
                      [-73.995, 40.725],
                      [-74.000, 40.725],
                      [-74.000, 40.720]
                    ]]
                  },
                  properties: {
                    height: 30,
                    base_height: 0,
                    color: '#4488ff',
                    type: 'earthquake',
                    severity: 'medium'
                  }
                }
              ]
            }
          });

          // Create multi-layer fading effect by stacking layers with decreasing opacity
          // Bottom layer (0-40% height): Most opaque (0.9)
          map.current.addLayer({
            id: 'catastrophe-3d-layer-bottom',
            type: 'fill-extrusion',
            source: 'catastrophe-data',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['*', ['get', 'height'], 0.4],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.9
            }
          });
          
          // Middle-bottom layer (40-60% height): Medium-high opacity (0.7)
          map.current.addLayer({
            id: 'catastrophe-3d-layer-mid-bottom',
            type: 'fill-extrusion',
            source: 'catastrophe-data',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['*', ['get', 'height'], 0.6],
              'fill-extrusion-base': ['*', ['get', 'height'], 0.4],
              'fill-extrusion-opacity': 0.7
            }
          });
          
          // Middle-top layer (60-80% height): Medium opacity (0.5)
          map.current.addLayer({
            id: 'catastrophe-3d-layer-mid-top',
            type: 'fill-extrusion',
            source: 'catastrophe-data',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['*', ['get', 'height'], 0.8],
              'fill-extrusion-base': ['*', ['get', 'height'], 0.6],
              'fill-extrusion-opacity': 0.5
            }
          });
          
          // Top layer (80-100% height): Most transparent (0.25)
          map.current.addLayer({
            id: 'catastrophe-3d-layer-top',
            type: 'fill-extrusion',
            source: 'catastrophe-data',
            paint: {
              'fill-extrusion-color': ['get', 'color'],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': ['*', ['get', 'height'], 0.8],
              'fill-extrusion-opacity': 0.25
            }
          });
          
          console.log('Added multi-layer catastrophe 3D visualization with opacity fade effect');
          
          // Add click interaction for catastrophe areas (only need to bind to bottom layer)
          const handleCatastropheClick = (e) => {
            const properties = e.features[0].properties;
            
            new mapboxgl.Popup()
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="padding: 10px;">
                  <h3 style="margin: 0 0 8px 0; color: ${properties.color};">
                    ${properties.type.toUpperCase()} ALERT
                  </h3>
                  <p style="margin: 0; font-size: 14px;">
                    <strong>Severity:</strong> ${properties.severity}<br>
                    <strong>Height:</strong> ${properties.height}m<br>
                    <strong>Type:</strong> ${properties.type}
                  </p>
                </div>
              `)
              .addTo(map.current);
          };
          
          // Bind click to all layers
          ['catastrophe-3d-layer-bottom', 'catastrophe-3d-layer-mid-bottom', 
           'catastrophe-3d-layer-mid-top', 'catastrophe-3d-layer-top'].forEach(layerId => {
            map.current.on('click', layerId, handleCatastropheClick);
            
            // Change cursor on hover
            map.current.on('mouseenter', layerId, () => {
              map.current.getCanvas().style.cursor = 'pointer';
            });
            
            map.current.on('mouseleave', layerId, () => {
              map.current.getCanvas().style.cursor = '';
            });
          });
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
        const height = 60;
        
        // Add 3D polygon with multi-layer fading effect
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
              height: height
            }
          }
        });
        
        // Create 4 stacked layers for fading effect
        // Bottom layer (0-40%): Most opaque
        map.current.addLayer({
          id: `${polygonId}-bottom`,
          type: 'fill-extrusion',
          source: polygonId,
          paint: {
            'fill-extrusion-color': drawingColor,
            'fill-extrusion-height': height * 0.4,
            'fill-extrusion-base': 0,
            'fill-extrusion-opacity': 0.9
          }
        });
        
        // Middle-bottom layer (40-60%)
        map.current.addLayer({
          id: `${polygonId}-mid-bottom`,
          type: 'fill-extrusion',
          source: polygonId,
          paint: {
            'fill-extrusion-color': drawingColor,
            'fill-extrusion-height': height * 0.6,
            'fill-extrusion-base': height * 0.4,
            'fill-extrusion-opacity': 0.7
          }
        });
        
        // Middle-top layer (60-80%)
        map.current.addLayer({
          id: `${polygonId}-mid-top`,
          type: 'fill-extrusion',
          source: polygonId,
          paint: {
            'fill-extrusion-color': drawingColor,
            'fill-extrusion-height': height * 0.8,
            'fill-extrusion-base': height * 0.6,
            'fill-extrusion-opacity': 0.5
          }
        });
        
        // Top layer (80-100%): Most transparent
        map.current.addLayer({
          id: `${polygonId}-top`,
          type: 'fill-extrusion',
          source: polygonId,
          paint: {
            'fill-extrusion-color': drawingColor,
            'fill-extrusion-height': height,
            'fill-extrusion-base': height * 0.8,
            'fill-extrusion-opacity': 0.25
          }
        });
        
        console.log('Created multi-layer 3D polygon with opacity fade -', drawingPath.current.length, 'points');
        
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
  }, [isDrawingMode, drawingColor, onDrawingComplete]);

  return (
    <div 
      ref={mapContainer} 
      className={`map-container ${className}`}
      {...props}
    />
  );
};

export default Map;
