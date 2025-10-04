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
  isDrawingMode,
  drawingColor,
  onDrawingComplete,
  className = '',
  ...props 
}) => {
  const containerStyle = fullScreen 
    ? {
        width: '100vw',
        height: 'calc(100vh - 300px)', // Subtract header + search + drawing controls
        position: 'fixed',
        top: '300px', // Start below header, search, and drawing controls
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
        isDrawingMode={isDrawingMode}
        drawingColor={drawingColor}
        onDrawingComplete={onDrawingComplete}
      />
    </div>
  );
};

export default MapSquare;
