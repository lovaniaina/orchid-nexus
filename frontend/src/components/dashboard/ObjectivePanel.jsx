// /frontend/src/components/dashboard/ObjectivePanel.jsx

import ActivityPanel from './ActivityPanel';
import AddActivityForm from './AddActivityForm';
import React, { useState } from 'react';
// We will create the ActivityPanel component in a later step
// import ActivityPanel from './ActivityPanel';

function ObjectivePanel({ objective, onDelete, onUpdate, onCreateActivity, onDeleteActivity, onUpdateActivity }) {
  // We use a state variable to control whether the panel's content is visible or hidden.
  const [isOpen, setIsOpen] = useState(true);
  // Add these inside the ObjectivePanel component
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(objective.name);
  // Add this handler inside the ObjectivePanel component
  const handleUpdate = () => {
    if (editedName.trim() && editedName !== objective.name) {
      onUpdate(objective.id, editedName);
    }
    setIsEditing(false); // Switch back to display mode
  };

  return (
    <div className="objective-panel">
      <div className="panel-header-objective" onClick={() => setIsOpen(!isOpen)}>
        {isEditing ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleUpdate} // Save when the input loses focus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdate(); // Save on Enter key
              if (e.key === 'Escape') setIsEditing(false); // Cancel on Escape key
            }}
            autoFocus // Automatically focus the input when it appears
            className="panel-header-input"
          />
        ) : (
          <h3>{objective.name}</h3>
        )}
        {/* This little arrow will rotate based on the isOpen state */}
        <div className="panel-actions">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }} 
            className="edit-button"
          >
            ✏️
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation(); // Prevents the panel from toggling when the button is clicked
              onDelete(objective.id);
            }} 
            className="delete-button"
          >
            🗑️
          </button>
          <span className={`chevron ${isOpen ? 'open' : ''}`}>▼</span>
      </div>
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
              <ActivityPanel key={activity.id} activity={activity} onDelete={onDeleteActivity} onUpdate={onUpdateActivity} />
              ))}
          <AddActivityForm onSubmit={(activityName) => onCreateActivity(objective.id, activityName)} />
        </div>
      )}
    </div>
  );
}

export default ObjectivePanel;