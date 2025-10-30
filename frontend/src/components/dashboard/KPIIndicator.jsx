// /frontend/src/components/dashboard/KPIIndicator.jsx

import React from 'react';

function KPIIndicator({ kpi }) {
  // Calculate the progress percentage for the progress bar.
  // We use Math.min to ensure the progress doesn't exceed 100%.
  const progressPercentage = kpi.target_value > 0 
    ? Math.min((kpi.current_value / kpi.target_value) * 100, 100) 
    : 0;

  return (
    <div className="kpi-indicator">
      <div className="kpi-info">
        {/* Display the name and unit, e.g., "Wells Drilled (wells)" */}
        <span>{kpi.name} ({kpi.unit})</span>
        {/* Display the progress, e.g., "7 / 15" */}
        <span>{kpi.current_value} / {kpi.target_value}</span>
      </div>
      <div className="progress-bar-background">
        <div 
          className="progress-bar-foreground" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}

export default KPIIndicator;