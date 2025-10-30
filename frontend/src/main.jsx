// /frontend/src/main.jsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Imports your main App component

// This is the CRUCIAL change for Task 3.
// We are now importing the CSS file from its new home in the 'assets' folder.
import './assets/index.css'; 

// This code finds the <div id="root"> in your main index.html file
// and tells React to render your entire application inside of it.
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);