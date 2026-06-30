import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import SpriteAvatar from '../../components/SpriteAvatar/SpriteAvatar';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user, token, API_URL } = useContext(AuthContext);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/leaderboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setLeaderboard(res.data.data);
      } catch (err) {
        setError('Failed to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };
    if (token) {
      fetchLeaderboard();
    }
  }, [token, API_URL]);

  const getRankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  };

  const renderRank = (index) => {
    if (index === 0) return <span className="rank-icon">🏆</span>;
    if (index === 1) return <span className="rank-icon">🥈</span>;
    if (index === 2) return <span className="rank-icon">🥉</span>;
    return <div className="rank-number">#{index + 1}</div>;
  };

  if (loading) {
    return <div className="leaderboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading Leaderboard...</div>;
  }

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>Global Rankings</h1>
        <p>Compete with the best. Rise to the top.</p>
      </div>

      {error ? (
        <div style={{ color: '#ff4d4d', textAlign: 'center' }}>{error}</div>
      ) : (
        <div className="leaderboard-panel">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th style={{ textAlign: 'center' }}>Rank</th>
                <th>Player</th>
                <th>Level</th>
                <th>Tier</th>
                <th style={{ textAlign: 'right' }}>Total XP</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((player, index) => {
                const isCurrentUser = user && user.id === player.id;
                return (
                  <tr key={player.id} className={`leaderboard-row ${isCurrentUser ? 'current-user-row' : ''}`}>
                    <td className={`rank-cell ${getRankClass(index)}`}>
                      {renderRank(index)}
                    </td>
                    <td>
                      <div className="player-cell">
                        <div className="player-avatar">
                          <SpriteAvatar index={player.avatar || '0'} />
                        </div>
                        <div className="player-info">
                          <div className="player-name">
                            {player.username}
                            {isCurrentUser && <span className="you-badge">You</span>}
                          </div>
                          <span className="player-id">#{player.playerId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="level-badge">Lvl {player.level}</span>
                    </td>
                    <td>
                      <span className="tier-text">{player.rank}</span>
                    </td>
                    <td className="xp-cell" style={{ textAlign: 'right' }}>
                      {player.xp.toLocaleString()} XP
                    </td>
                  </tr>
                );
              })}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    No players found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
