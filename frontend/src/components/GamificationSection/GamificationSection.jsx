import React, { useState, useEffect } from 'react';
import './GamificationSection.css';

const GamificationSection = () => {
  const [progress, setProgress] = useState(0);
  const targetProgress = 100;

  useEffect(() => {
    let startTimestamp = null;
    const duration = 1500; // 1.5 seconds

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsedTime = timestamp - startTimestamp;
      const currentProgress = Math.min(
        Math.floor((elapsedTime / duration) * targetProgress),
        targetProgress
      );
      
      setProgress(currentProgress);
      
      if (elapsedTime < duration) {
        window.requestAnimationFrame(step);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [targetProgress]);

  return (
    <section className="gamification-section">
      <div className="gamification-content glass-panel">
        <h2 className="gamification-title">Get (even) better at coding</h2>
        <p className="gamification-subtitle">
          Master multiple programming languages and frameworks.<br />
          Level up your skills with every challenge you complete.
        </p>

        <div className="gamification-visual">
          <div className="badges-container">
            <div className="badges-line"></div>
            <div className="badge small-badge"><span className="lang-text" style={{color: '#F7DF1E'}}>JS</span></div>
            <div className="badge small-badge"><span className="lang-text" style={{color: '#3776AB'}}>Py</span></div>
            <div className="badge small-badge"><span className="lang-text" style={{color: '#00599C'}}>C++</span></div>
            <div className="badge small-badge"><span className="lang-text" style={{color: '#3178C6'}}>TS</span></div>
            
            <div className="badge large-badge center-badge">
              <svg viewBox="0 0 128 128" width="80" height="80">
                <path fill="#5382A1" d="M37.6,83.2c-0.1-2,1-4,3-4.9c4.2-2.1,9.8-3.5,16.2-4.1c11.5-1.1,23.3-0.5,33.5,2.7
                c3.3,1.1,6.3,2.4,9,3.9c1.9,1.1,3,3,3,5.1c-0.1,2.8-2,5.2-4.7,5.9c-8.9,2.5-24.9,3.8-39.6,3.4C44,95,37.6,90.4,37.6,83.2z" />
                <path fill="#F8981D" d="M107.5,74.7c-4-4-11.8-6.1-23.7-6.2c-15.3-0.1-33.6,3-48.4,9.2C30,79.9,26.4,83,24.4,87
                c-1.8,3.6-2,7.7-0.7,11.5c1.9,5.5,6.5,9.6,12.2,10.8c21.8,4.7,50.1,1.5,67.6-7.8c7.4-3.9,11.8-10.7,11.2-18.7
                C114.2,80,111.4,78.6,107.5,74.7z M83.2,95.9c-11.2,3.3-30.8,4.5-44.1,2.5c-3-0.5-5.5-2.7-6.4-5.6c-0.6-1.9-0.5-3.9,0.3-5.7
                c1.4-3.2,4.4-5.6,7.8-6.6c13.7-4.1,32.4-5.3,47.1-3.2c2.7,0.4,5.1,1.9,6.5,4.2C96.2,85.5,95.3,92.3,83.2,95.9z" />
                <path fill="#F8981D" d="M109.1,66.4c0-0.4,0-0.9,0-1.3c-0.7-9.3-8.6-15.8-17.9-14.7c-6.8,0.8-12.7,4.8-15.4,10.5
                c-1.3,2.7-1.3,5.8-0.2,8.5c1.1,2.7,3.1,4.9,5.8,6.2C85.5,77,91.1,77,95.2,75c3.2-1.6,5.6-4.5,6.3-8c1.3,0,2.6,0,3.9,0
                C107.1,67,108.3,66.8,109.1,66.4z M96.1,71.2c-1.3,1.3-3.2,2.2-5.1,2.4c-2.3,0.3-4.6-0.3-6.4-1.7c-1.7-1.4-2.7-3.4-2.8-5.7
                c-0.1-2.2,0.7-4.4,2.3-5.9c1.6-1.5,3.8-2.3,6-2.1c2.1,0.2,4.1,1.1,5.5,2.7C97.1,63,97.7,65.3,97.7,67
                C97.7,68.6,97.1,70,96.1,71.2z" />
                <path fill="#E76F00" d="M72.2,33.5c-4.9-3.9-6.3-10.7-3.3-16.1c1.5-2.6,4.1-4.5,7-5.1c0.8-0.2,1.6-0.2,2.4-0.1
                c-0.6,1.4-1.1,2.8-1.4,4.2c-0.8,4.3,0.5,8.8,3.5,11.8c2.4,2.4,5.6,3.6,9,3.4c2.8-0.2,5.5-1.3,7.6-3.2c-0.6,2.2-1.6,4.3-3.1,6
                c-3.1,3.4-7.5,5.1-12.2,4.7C77.4,38.8,74.1,36.7,72.2,33.5z" />
                <path fill="#E76F00" d="M72.6,49.8c-2.9-1.9-5.1-4.7-6.1-8.1c-1.2-4.1-0.5-8.4,1.8-11.8c0.1-0.2,0.3-0.3,0.4-0.5
                c-1.4,2.2-2,4.8-1.8,7.4c0.3,3.4,2,6.5,4.7,8.5c2.6,2,5.8,2.7,9.1,2.1c2.8-0.5,5.3-2,7-4.1c-1.4,2.8-3.7,5-6.6,6.2
                C78.4,50.7,75.2,50.8,72.6,49.8z" />
                <path fill="#E76F00" d="M68.5,55.4c-1.9-0.5-3.6-1.5-4.9-2.9c-2.4-2.7-3.2-6.5-2.2-9.9c0.2-0.7,0.4-1.3,0.7-2
                c-1.1,1.7-1.7,3.7-1.6,5.8c0.1,2.8,1.4,5.4,3.6,7c2.3,1.7,5.2,2.3,8,1.6c2.5-0.6,4.7-2.1,6-4.1c-1.5,2.4-4,3.9-6.8,4.4
                C70.3,55.7,69.4,55.6,68.5,55.4z" />
              </svg>
            </div>
            
            <div className="badge small-badge"><span className="lang-text" style={{color: '#00ADD8'}}>Go</span></div>
            <div className="badge small-badge"><span className="lang-text" style={{color: '#DEA584'}}>Rs</span></div>
            <div className="badge small-badge"><span className="lang-text" style={{color: '#CC342D'}}>Rb</span></div>
            <div className="badge small-badge"><span className="lang-text" style={{color: '#777BB4'}}>PHP</span></div>
          </div>

          <div className="progress-section">
            <div className="progress-header">
              <span className="skill-name">Java learning</span>
            </div>
            <div className="progress-track-wrapper">
              <div className="progress-bar-container">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <span className="skill-percentage">{progress}%</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamificationSection;
