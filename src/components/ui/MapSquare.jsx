import Map from './Map';
import './MapSquare.css';

const MapSquare = ({ 
  size = 500, 
  fullScreen = false,
  accessToken,
  center,
  zoom,
  style,
  pitch = 45,
  bearing = 0,
  className = '',
  ...props 
}) => {
  const containerStyle = fullScreen 
    ? {
        width: '100vw',
        height: 'calc(100vh - 220px)', // Subtract header + search area height
        position: 'fixed',
        top: '220px', // Start below header and search
        left: 0,
        zIndex: 1000,
      }
    : {
        width: `${size}px`,
        height: `${size}px`,
      };

  return (
    <div 
      className={`map-square ${fullScreen ? 'map-square--fullscreen' : ''} ${className}`} 
      style={containerStyle}
      {...props}
    >
      <Map 
        accessToken={accessToken}
        center={center}
        zoom={zoom}
        style={style}
        pitch={pitch}
        bearing={bearing}
      />
    </div>
  );
};

export default MapSquare;
