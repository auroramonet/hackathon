import React from "react";
import "./MagnitudeSlider.css";

const MagnitudeSlider = ({ magnitude, onChange, className = "" }) => {
  const getSeverityLabel = (mag) => {
    if (mag < 2) return "Minimal";
    if (mag < 4) return "Minor";
    if (mag < 6) return "Moderate";
    if (mag < 8) return "Severe";
    return "Catastrophic";
  };

  const getSeverityClass = (mag) => {
    if (mag < 2) return "minimal";
    if (mag < 4) return "minor";
    if (mag < 6) return "moderate";
    if (mag < 8) return "severe";
    return "catastrophic";
  };

  return (
    <div className={`magnitude-slider ${className}`}>
      <div className="magnitude-slider__label">
        <span>Magnitude</span>
        <div className="magnitude-slider__value-group">
          <span className="magnitude-slider__value">
            {magnitude.toFixed(1)}
          </span>
          <span
            className={`magnitude-slider__severity severity-${getSeverityClass(
              magnitude
            )}`}
          >
            {getSeverityLabel(magnitude)}
          </span>
        </div>
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
        <span className="scale-marker">
          <span className="scale-value">0</span>
          <span className="scale-label">Minimal</span>
        </span>
        <span className="scale-marker">
          <span className="scale-value">10</span>
          <span className="scale-label">Catastrophic</span>
        </span>
      </div>
    </div>
  );
};

export default MagnitudeSlider;
