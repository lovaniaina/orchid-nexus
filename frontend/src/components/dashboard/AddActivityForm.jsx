// /frontend/src/components/dashboard/AddActivityForm.jsx

import React, { useState } from 'react';

function AddActivityForm({ onSubmit }) {
  const [name, setName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="simple-add-form" style={{ padding: '0 1.5rem 1.5rem 1.5rem' }}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter new activity name..."
        required
      />
      <button type="submit">+ Add Activity</button>
    </form>
  );
}

export default AddActivityForm;