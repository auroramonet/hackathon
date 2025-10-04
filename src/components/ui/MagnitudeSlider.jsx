import React from 'react';
import './MagnitudeSlider.css';

const MagnitudeSlider = ({ magnitude, onChange, className = '' }) => {
  return (
    <div className={`magnitude-slider ${className}`}>
      <div className="magnitude-slider__label">
        Magnitude: <span className="magnitude-slider__value">{magnitude.toFixed(1)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="0.1"
        value={magnitude}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="magnitude-slider__input"
      />
      <div className="magnitude-slider__scale">
        <span>0</span>
        <span>5</span>
        <span>10</span>
      </div>
    </div>
  );
};

export default MagnitudeSlider;

