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
  className = '',
  ...props 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

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

  return (
    <div 
      ref={mapContainer} 
      className={`map-container ${className}`}
      {...props}
    />
  );
};

export default Map;
