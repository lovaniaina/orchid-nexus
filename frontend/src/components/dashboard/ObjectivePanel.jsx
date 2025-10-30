// /frontend/src/components/dashboard/ObjectivePanel.jsx

import ActivityPanel from './ActivityPanel';
import React, { useState } from 'react';
// We will create the ActivityPanel component in a later step
// import ActivityPanel from './ActivityPanel';

function ObjectivePanel({ objective }) {
  // We use a state variable to control whether the panel's content is visible or hidden.
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="objective-panel">
      <div className="panel-header-objective" onClick={() => setIsOpen(!isOpen)}>
        <h3>{objective.name}</h3>
        {/* This little arrow will rotate based on the isOpen state */}
        <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
      
      {/* Conditionally render the content based on the isOpen state */}
      {isOpen && (
        <div className="objective-content">
          {/* 
            Here, we will map over the activities for this objective
            and render an ActivityPanel for each one.
            We will build this component next.
          */}
          {objective.activities.map(activity => (
              <ActivityPanel key={activity.id} activity={activity} />
              ))}
        </div>
      )}
    </div>
  );
}

export default ObjectivePanel;