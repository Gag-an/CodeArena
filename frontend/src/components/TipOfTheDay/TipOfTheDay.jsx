import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import './TipOfTheDay.css';

const TipOfTheDay = () => {
  const { API_URL } = useContext(AuthContext);
  const [tip, setTip] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTip = async () => {
      try {
        const res = await axios.get(`${API_URL}/tip`);
        if (res.data.success) {
          setTip(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch daily tip:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTip();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="tip-widget glass-panel skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-badges"></div>
        <div className="skeleton-body"></div>
        <div className="skeleton-body short"></div>
      </div>
    );
  }

  if (!tip) return null;

  return (
    <div className="tip-widget glass-panel fade-in">
      <div className="tip-header">
        <h3 className="tip-title">Tip of the Day</h3>
      </div>
      
      <div className="tip-badges">
        <span className="tip-category">{tip.category}</span>
        <span className={`tip-difficulty ${tip.difficulty?.toLowerCase() || 'easy'}`}>
          {tip.difficulty}
        </span>
      </div>

      <h4 style={{ color: '#fff', marginBottom: '0.5rem', fontSize: '1rem' }}>{tip.title}</h4>
      <p className="tip-text">{tip.tip}</p>

      {tip.practiceQuestion && (
        <div className="tip-practice">
          <strong>Practice This:</strong> {tip.practiceQuestion}
        </div>
      )}
    </div>
  );
};

export default TipOfTheDay;
