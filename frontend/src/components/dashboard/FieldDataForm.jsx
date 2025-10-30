// /frontend/src/components/dashboard/FieldDataForm.jsx

import React, { useState } from 'react';

function FieldDataForm({ tasks, onDataSubmit }) {
  // We need state to track the selected task ID and the numeric value entered.
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [value, setValue] = useState('');

  const handleSubmit = (event) => {
    // Prevent the browser from doing a full page reload.
    event.preventDefault(); 
    
    // Simple validation
    if (!selectedTaskId || !value) {
      alert("Please select a task and enter a value.");
      return;
    }

    // Call the function passed down from the parent component with the submitted data.
    onDataSubmit({
      taskId: parseInt(selectedTaskId, 10),
      numericValue: parseInt(value, 10)
    });

    // Reset the form for the next entry.
    setSelectedTaskId('');
    setValue('');
  };

  return (
    <form className="field-data-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="task-select">Select Task</label>
        <select 
          id="task-select"
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          required
        >
          <option value="" disabled>-- Choose a task --</option>
          {tasks.map(task => (
            <option key={task.id} value={task.id}>
              {task.description}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="value-input">Enter Value</label>
        <input 
          id="value-input"
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g., 25"
          required
        />
      </div>

      <button type="submit">Submit Data</button>
    </form>
  );
}

export default FieldDataForm;