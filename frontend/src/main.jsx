// /frontend/src/main.jsx - FINAL VERSION WITH SUSPENSE

import React, { Suspense } from 'react'; // Import Suspense
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n'; // Your i18n configuration

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Wrap your App component in a Suspense component */}
    <Suspense fallback={<div>Loading...</div>}>
      <App />
    </Suspense>
  </React.StrictMode>,
)