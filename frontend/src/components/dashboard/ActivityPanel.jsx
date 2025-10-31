// /frontend/src/components/dashboard/ActivityPanel.jsx

import KPIIndicator from './KPIIndicator';
import React, { useState } from 'react';
// We will create the KPIIndicator component in the next step
// import KPIIndicator from './KPIIndicator';

function ActivityPanel({ activity, onDelete, onUpdate }) {
  // Each activity panel can also be collapsed
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(activity.name);

  const handleUpdate = () => {
    if (editedName.trim() && editedName !== activity.name) {
      onUpdate(activity.id, editedName);
    }
    setIsEditing(false);
  };

  return (
    <div className="activity-panel">
      <div className="panel-header-activity" onClick={() => setIsOpen(!isOpen)}>
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleUpdate}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate();
              if (e.key === 'Escape') setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()} // Prevent panel from closing when clicking input
            autoFocus
            className="panel-header-input-small" // Use a smaller class
          />
        ) : (
          <h4>{activity.name}</h4>
        )}
        <div className="panel-actions">
          <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="edit-button">✏️</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(activity.id); }} className="delete-button">🗑️</button>
          <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
        </div>
      </div>

      {isOpen && (
        <div className="activity-content">
          <div className="kpi-section">
            <h5>Key Performance Indicators</h5>
            {activity.kpis.map(kpi => (
              <KPIIndicator key={kpi.id} kpi={kpi} />
            ))}
          </div>
          <div className="task-section">
            <h5>Tasks</h5>
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