import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { SocketContext } from '../../context/SocketContext';
import './MatchLoading.css';

const MatchLoading = () => {
  const navigate = useNavigate();
  const { party } = useContext(SocketContext);
  const [loadingText, setLoadingText] = useState('Connecting to CodeArena...');

  useEffect(() => {
    const sequence = [
      { text: 'Finding Opponents...', time: 1000 },
      { text: 'Selecting Problem...', time: 2500 },
      { text: 'Spawning Workspace...', time: 4000 }
    ];

    sequence.forEach((step) => {
      setTimeout(() => {
        setLoadingText(step.text);
      }, step.time);
    });

    const timer = setTimeout(() => {
      if (party?.matchMode === 'friendly') {
        navigate('/friendly-match');
      } else {
        navigate('/competitive-match');
      }
    }, 5500);

    return () => clearTimeout(timer);
  }, [navigate, party]);

  return (
    <div className="match-loading-container valorant-theme">
      <div className="loading-content">
        <div className="valorant-spinner"></div>
        <h2 className="loading-text fade-in-out">{loadingText}</h2>
        <div className="progress-bar-container">
          <div className="progress-bar-fill"></div>
        </div>
      </div>
    </div>
  );
};

export default MatchLoading;
