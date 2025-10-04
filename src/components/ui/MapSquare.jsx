import Map from './Map';
import './MapSquare.css';

const MapSquare = ({ 
  size = 500, 
  accessToken,
  center,
  zoom,
  style,
  pitch = 45,
  bearing = 0,
  className = '',
  ...props 
}) => {
  const squareStyle = {
    width: `${size}px`,
    height: `${size}px`,
  };

  return (
    <div 
      className={`map-square ${className}`} 
      style={squareStyle}
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
