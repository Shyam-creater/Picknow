import React, { useEffect, useState } from 'react';
import './ModernLoader.css';
import PicknowLogo from '../../assets/PicknowLogo.png';

const ModernLoader = ({
  text = 'Picknow',
  showProgress = true,
  customMessage = 'Loading...',
  preventScroll = true,
  inline = false
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (preventScroll && !inline) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflowY = 'scroll';

      return () => {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        document.body.style.overflowY = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [preventScroll, inline]);

  useEffect(() => {
  if (showProgress) {
    const interval = setInterval(() => {
      setProgress(prev =>
        prev >= 100 ? 100 : Math.min(prev + Math.random() * 5, 100)
      );
    }, 300);

    return () => clearInterval(interval);
  }
}, [showProgress]);

  return (
    <div className={`modern-discovery-loader ${inline ? 'inline' : ''}`}>
      <div className="loader-portal-sleek">
        <div className="loader-logo-container-sleek">
          <div className="loader-spinner-minimal"></div>
          <img src={PicknowLogo} alt="Picknow" className="loader-logo-sleek" />
        </div>
        
        <div className="loader-info-sleek">
          <h3 className="loader-title-sleek">{text}</h3>
          <p className="loader-msg-sleek">{customMessage}</p>
          
          {showProgress && (
            <div className="loader-progress-sleek">
              <div className="loader-bar-bg-sleek">
                <div 
                  className="loader-bar-fill-sleek" 
                  style={{ width: `${Math.round(progress)}%` }}
                ></div>
              </div>
              <span className="loader-percent-sleek">{Math.round(progress)}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModernLoader;