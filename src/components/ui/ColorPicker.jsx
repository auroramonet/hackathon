import React from 'react';
import './ColorPicker.css';

const ColorPicker = ({ color, onChange, className = '' }) => {
  const presetColors = [
    '#ff4444', // Red
    '#ff8800', // Orange
    '#ffcc00', // Yellow
    '#44ff44', // Green
    '#4488ff', // Blue
    '#8844ff', // Purple
    '#ff44ff', // Magenta
    '#ffffff', // White
  ];

  return (
    <div className={`color-picker ${className}`}>
      <div className="color-picker__label">Color:</div>
      <div className="color-picker__swatches">
        {presetColors.map((presetColor) => (
          <button
            key={presetColor}
            className={`color-swatch ${color === presetColor ? 'color-swatch--active' : ''}`}
            style={{ backgroundColor: presetColor }}
            onClick={() => onChange(presetColor)}
            title={presetColor}
          />
        ))}
      </div>
      <input
        type="color"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        className="color-picker__input"
      />
    </div>
  );
};

export default ColorPicker;

