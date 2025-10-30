// /frontend/src/components/ui/Notification.jsx

import React, { useEffect } from 'react';

function Notification({ message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  return (
    <div className="notification-toast">
      <p>{message}</p>
      <button onClick={onDismiss} className="notification-dismiss">×</button>
    </div>
  );
}

export default Notification;