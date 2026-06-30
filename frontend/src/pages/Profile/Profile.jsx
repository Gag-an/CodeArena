import React, { useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import SpriteAvatar from '../../components/SpriteAvatar/SpriteAvatar';
import './Profile.css';

const Profile = () => {
  const { user, setUser, token, API_URL } = useContext(AuthContext);
  const [heatmapData, setHeatmapData] = useState([]);
  
  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    avatar: '',
    college: '',
    leetcode_link: '',
    hackerearth_link: ''
  });
  const [editError, setEditError] = useState('');
  
  useEffect(() => {
    const fetchHeatmap = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/heatmap`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHeatmapData(res.data.data);
      } catch (err) {
        console.error("Could not load heatmap", err);
      }
    };
    if (token) {
      fetchHeatmap();
    }
  }, [token, API_URL]);


  const openEditModal = () => {
    setEditForm({
      username: user.username || '',
      avatar: user.avatar || '',
      college: user.college || '',
      leetcode_link: user.leetcode_link || '',
      hackerearth_link: user.hackerearth_link || ''
    });
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put(`${API_URL}/users/profile`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data.data);
      setIsEditModalOpen(false);
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  // Use actual submissions if available, fallback to empty array
  const submissions = user?.submissions || [];
  const easyCount = user?.difficultyStats?.Easy || 0;
  const medCount = user?.difficultyStats?.Medium || 0;
  const hardCount = user?.difficultyStats?.Hard || 0;
  const solvedCount = easyCount + medCount + hardCount;

  const BADGE_TIERS = [
    { threshold: 10, name: 'Novice Adventurer', icon: '🔰' },
    { threshold: 25, name: 'Apprentice', icon: '🎓' },
    { threshold: 50, name: 'Squire', icon: '🛡️' },
    { threshold: 100, name: 'Knight', icon: '⚔️' },
    { threshold: 200, name: 'Champion', icon: '🏆' },
    { threshold: 300, name: 'Hero', icon: '🦸' },
    { threshold: 500, name: 'Legend', icon: '👑' },
    { threshold: 750, name: 'Mythic Warrior', icon: '🐉' },
    { threshold: 1000, name: 'Immortal', icon: '✨' },
  ];

  const earnedBadges = BADGE_TIERS.filter(b => solvedCount >= b.threshold);



  const generateHeatmap = () => {
    // Map backend data by date string for easy lookup
    const dataMap = {};
    heatmapData.forEach(entry => {
      dataMap[entry.date] = entry.level;
    });

    const weeks = [];
    const today = new Date();
    
    for (let i = 0; i < 52; i++) {
      const days = [];
      for (let j = 0; j < 7; j++) {
        // Calculate the date for this cell (backwards from today)
        // 52 weeks * 7 days = 364 days ago is the start
        const daysAgo = (51 - i) * 7 + (6 - j);
        const d = new Date(today);
        d.setDate(today.getDate() - daysAgo);
        const dateString = d.toISOString().split('T')[0];
        
        const level = dataMap[dateString] || 0;
        days.push(<div key={`${i}-${j}`} className={`heatmap-cell level-${level}`} title={`${dateString}: Level ${level}`}></div>);
      }
      weeks.push(<div key={i} className="heatmap-week">{days}</div>);
    }
    return weeks;
  };

  const getDynamicMonths = () => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentMonthIdx = new Date().getMonth();
    const dynamicMonths = [];
    for (let i = 11; i >= 0; i--) {
      let m = currentMonthIdx - i;
      if (m < 0) m += 12;
      dynamicMonths.push(monthNames[m]);
    }
    return dynamicMonths;
  };

  const calculateMaxStreak = () => {
    if (heatmapData.length === 0) return 0;
    
    const sortedDates = [...heatmapData]
      .map(entry => entry.date)
      .sort();
      
    let maxStreak = 1;
    let currentStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prev = new Date(sortedDates[i-1]);
      const curr = new Date(sortedDates[i]);
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    return Math.max(maxStreak, currentStreak);
  };

  if (!user) return <div className="profile-container" style={{color: 'white', textAlign: 'center'}}>Loading Profile...</div>;

  return (
    <div className="profile-container">
      {/* Left Sidebar */}
      <aside className="profile-sidebar">
        <div className="profile-identity glass-panel">
          <div className="avatar-wrapper">
            <div className="avatar-image" style={{overflow: 'hidden'}}>
              <SpriteAvatar index={user.avatar || '0'} />
            </div>
          </div>
          <h2 className="real-name">{user.username}</h2>
          <p className="username">@{user.username.toLowerCase()}</p>
          {user.playerId && <p className="username" style={{marginTop: '-10px', fontSize: '0.9rem', color: 'var(--accent-yellow)'}}>ID: #{user.playerId}</p>}
          <div className="rank-info" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '5px' }}>
            <div>Level <span className="rank-number">{user.level || 1}</span></div>
            <div>Tier <span className="rank-number">{user.rank || 'Unranked'}</span></div>
          </div>
          <button className="btn-secondary edit-profile-btn" onClick={openEditModal}>Edit Profile</button>
          <div className="social-links">
            {user.college && <div className="link-item">🎓 {user.college}</div>}
            {user.leetcode_link && (
              <a href={user.leetcode_link} target="_blank" rel="noopener noreferrer" className="link-item" style={{textDecoration: 'none'}}>
                🔗 LeetCode Profile
              </a>
            )}
            {user.hackerearth_link && (
              <a href={user.hackerearth_link} target="_blank" rel="noopener noreferrer" className="link-item" style={{textDecoration: 'none'}}>
                🔗 HackerEarth Profile
              </a>
            )}
            <div className="link-item">🐈 code-ninja</div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="profile-main">
        {/* Top Stats & Badges */}
        <div className="profile-top-grid">
          <div className="solved-panel glass-panel">
            <div className="donut-chart-container">
              <svg viewBox="0 0 100 100" className="donut-chart">
                <circle cx="50" cy="50" r="40" className="donut-bg"></circle>
                {solvedCount > 0 && (
                  <>
                    <circle cx="50" cy="50" r="40" className="donut-segment easy" 
                      style={{ 
                        strokeDasharray: `${(easyCount / solvedCount) * 251.327} 251.327`, 
                        strokeDashoffset: 0 
                      }}></circle>
                    <circle cx="50" cy="50" r="40" className="donut-segment med" 
                      style={{ 
                        strokeDasharray: `${(medCount / solvedCount) * 251.327} 251.327`, 
                        strokeDashoffset: -((easyCount / solvedCount) * 251.327) 
                      }}></circle>
                    <circle cx="50" cy="50" r="40" className="donut-segment hard" 
                      style={{ 
                        strokeDasharray: `${(hardCount / solvedCount) * 251.327} 251.327`, 
                        strokeDashoffset: -(((easyCount + medCount) / solvedCount) * 251.327) 
                      }}></circle>
                  </>
                )}
              </svg>
              <div className="donut-inner-text">
                <span className="solved-big">{solvedCount}</span>
                <span className="solved-label">Solved</span>
              </div>
            </div>
            <div className="difficulty-stats">
              <div className="diff-stat easy">
                <span className="diff-label">Easy</span>
                <span className="diff-count">{easyCount}<span className="diff-total">/951</span></span>
              </div>
              <div className="diff-stat med">
                <span className="diff-label">Med.</span>
                <span className="diff-count">{medCount}<span className="diff-total">/2077</span></span>
              </div>
              <div className="diff-stat hard">
                <span className="diff-label">Hard</span>
                <span className="diff-count">{hardCount}<span className="diff-total">/949</span></span>
              </div>
            </div>
          </div>

          <div className="badges-panel glass-panel">
            <div className="badges-header">
              <span>Badges</span>
              <span className="badge-count">{earnedBadges.length}</span>
            </div>
            <div className="earned-badges-list">
              {earnedBadges.map((badge, idx) => (
                <div key={idx} className="earned-badge">
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-name">{badge.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="heatmap-panel glass-panel">
          <div className="heatmap-header">
            <span><strong>{submissions.length}</strong> submissions in the past one year</span>
            <span className="heatmap-stats">Total active days: {heatmapData.length} | Max streak: {calculateMaxStreak()}</span>
          </div>
          <div className="heatmap-grid-container">
            {generateHeatmap()}
          </div>
          <div className="heatmap-months">
            {getDynamicMonths().map((m, idx) => (
              <span key={idx}>{m}</span>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="recent-panel glass-panel">
          <div className="recent-tabs">
            <button className="tab active">📋 Recent AC</button>
          </div>
          <ul className="recent-list">
            {submissions.length === 0 ? (
              <li style={{color: '#888', textAlign: 'center'}}>No recent submissions.</li>
            ) : (
              submissions.map(sub => (
                <li key={sub.id}>
                  <span className="problem-name">{sub.problemName}</span>
                  <span className="time-ago">{new Date(sub.createdAt).toLocaleDateString()}</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <h2>Edit Profile</h2>
            {editError && <div className="error-message" style={{color: '#ff4d4d', marginBottom: '1rem'}}>{editError}</div>}
            <form onSubmit={handleEditSubmit} className="edit-form">
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  name="username" 
                  value={editForm.username} 
                  onChange={handleEditChange} 
                  required 
                  className="auth-input"
                />
              </div>
              <div className="form-group">
                <label>College / University</label>
                <input 
                  type="text" 
                  name="college" 
                  value={editForm.college} 
                  onChange={handleEditChange} 
                  className="auth-input"
                />
              </div>
              <div className="form-group">
                <label>Select Avatar</label>
                <div className="avatar-selection-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px'}}>
                  {Array.from({length: 12}).map((_, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setEditForm({ ...editForm, avatar: idx.toString() })}
                      style={{
                        width: '60px', height: '80px', cursor: 'pointer',
                        border: editForm.avatar === idx.toString() ? '2px solid var(--accent-yellow)' : '1px solid transparent',
                        borderRadius: '8px', overflow: 'hidden'
                      }}
                    >
                      <SpriteAvatar index={idx} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>LeetCode Profile Link</label>
                <input 
                  type="url" 
                  name="leetcode_link" 
                  value={editForm.leetcode_link} 
                  onChange={handleEditChange} 
                  className="auth-input"
                />
              </div>
              <div className="form-group">
                <label>HackerEarth Profile Link</label>
                <input 
                  type="url" 
                  name="hackerearth_link" 
                  value={editForm.hackerearth_link} 
                  onChange={handleEditChange} 
                  className="auth-input"
                />
              </div>
              <div className="modal-actions" style={{display: 'flex', gap: '1rem', marginTop: '1.5rem'}}>
                <button type="button" className="btn-secondary" style={{flex: 1}} onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{flex: 1}}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
