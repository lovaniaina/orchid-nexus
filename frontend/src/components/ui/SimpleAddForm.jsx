// /frontend/src/components/ui/SimpleAddForm.jsx

import React, { useState } from 'react';

function SimpleAddForm({ placeholder, onSubmit, cta }) {
  const [name, setName] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="simple-add-form">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        required
      />
      <button type="submit">{cta}</button>
    </form>
  );
}

export default SimpleAddForm;