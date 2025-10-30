// /frontend/src/components/dashboard/AddObjectiveForm.jsx

import React, { useState } from 'react';

function AddObjectiveForm({ onSubmit }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the browser from reloading the page
    if (!name.trim()) {
      // Don't submit if the input is empty
      return;
    }
    // Call the function passed down from the parent component
    onSubmit(name);
    // Clear the input field for the next entry
    setName('');
  };

  return (
    <div className="objective-panel" style={{ marginTop: '1.5rem' }}>
      <div className="objective-content">
        <h3>Create New Objective</h3>
        <form onSubmit={handleSubmit} className="simple-add-form">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter objective name..."
            required
          />
          <button type="submit">+ Create</button>
        </form>
      </div>
    </div>
  );
}

export default AddObjectiveForm;