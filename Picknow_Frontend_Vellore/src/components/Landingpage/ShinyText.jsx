import React from 'react';
import './ShinyText.css';

const GlowingText = ({ text, inactive = false, speed = 5, className = '' }) => {
  const animationDuration = `${speed}s`;

  return (
    <div
      className={`glowing-text ${inactive ? 'inactive' : ''} ${className}`}
      style={{ animationDuration }}
    >
      {text}
    </div>
  );
};

export default GlowingText;
