import React from 'react';
import './Snackbar.css';

const Snackbar = ({ message, type, isOpen, onClose }) => {
  React.useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={`snackbar ${type} ${isOpen ? 'show' : ''}`}>
      <div className="snackbar-content">
        <span className="snackbar-message">{message}</span>
        <button className="snackbar-close" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default Snackbar;
