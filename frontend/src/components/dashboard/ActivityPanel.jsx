// /frontend/src/components/dashboard/ActivityPanel.jsx

import KPIIndicator from './KPIIndicator';
import React, { useState } from 'react';
// We will create the KPIIndicator component in the next step
// import KPIIndicator from './KPIIndicator';

function ActivityPanel({ activity }) {
  // Each activity panel can also be collapsed
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="activity-panel">
      <div className="panel-header-activity" onClick={() => setIsOpen(!isOpen)}>
        <h4>{activity.name}</h4>
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>

      {isOpen && (
        <div className="activity-content">
          <div className="kpi-section">
            <h5>Key Performance Indicators</h5>
            {/*
              Here, we will map over the KPIs for this activity
              and render a KPIIndicator for each one.
            */}
            {activity.kpis.map(kpi => (
                <KPIIndicator key={kpi.id} kpi={kpi} />
                ))}
          </div>

          <div className="task-section">
            <h5>Tasks</h5>
            {/*
              Here, we will map over the tasks and display them.
              For the MVP, a simple list is enough.
            */}
            <ul>
              {activity.tasks.map(task => (
                <li key={task.id}>{task.description}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default ActivityPanel;