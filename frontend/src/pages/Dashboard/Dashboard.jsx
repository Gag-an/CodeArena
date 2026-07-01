import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import Loader from '../../components/Loader/Loader';
import SpriteAvatar from '../../components/SpriteAvatar/SpriteAvatar';
import TipOfTheDay from '../../components/TipOfTheDay/TipOfTheDay';
import './Dashboard.css';

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, API_URL } = useContext(AuthContext);
  const [showLoader, setShowLoader] = useState(location.state?.fromLogin || false);
  
  const { socket, pendingInvites, removePendingInvite, party } = useContext(SocketContext);
  
  // New States for dynamic lobby
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [recentPlayers, setRecentPlayers] = useState(() => {
    try {
      const saved = localStorage.getItem('recentPlayers');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const addToRecentPlayers = (newPlayer) => {
    setRecentPlayers(prev => {
      const filtered = prev.filter(p => p.playerId !== newPlayer.playerId);
      const updated = [newPlayer, ...filtered].slice(0, 5); // Keep last 5
      localStorage.setItem('recentPlayers', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (showLoader) {
      const timer = setTimeout(() => {
        setShowLoader(false);
        window.history.replaceState({}, document.title);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showLoader]);

  const matchMode = party?.matchMode || 'competitive';
  const maxFriends = matchMode === 'friendly' ? 1 : 10;
  
  const player = {
    playerId: user?.playerId,
    username: user?.username || 'CodeWizard',
    level: user?.level || 42,
    rank: user?.rank || 'Gold III',
    xp: user?.xp || 8500,
    nextLevelXp: 10000,
    avatar: user?.avatar || '0',
    wins: user?.wins || 0,
    losses: user?.losses || 0,
  };

  // Derive lobby friends from party state
  const lobbyFriends = party?.members ? party.members.filter(m => m.playerId !== player.playerId) : [];
  const isLeader = party?.leaderId === player.playerId;

  useEffect(() => {
    if (!player.playerId || !party?.members) return;
    const newMembers = party.members.filter(m => m.playerId !== player.playerId);
    if (newMembers.length > 0) {
      newMembers.forEach(m => addToRecentPlayers(m));
    }
  }, [party?.members, player.playerId]);

  useEffect(() => {
    if (!socket) return;
    
    const handleMatchStarted = (data) => {
      navigate('/match-loading');
    };

    socket.on('match_started', handleMatchStarted);

    return () => {
      socket.off('match_started', handleMatchStarted);
    };
  }, [socket, navigate]);

  if (showLoader) {
    return <Loader />;
  }


  const rewardsInfo = [
    { id: 1, title: 'Match Win', reward: '+50 XP Bonus' },
    { id: 2, title: 'Round Win', reward: '+15-50 XP' },
    { id: 3, title: 'Match Loss', reward: '+0 XP' },
  ];
  
  const handleModeChange = (mode) => {
    if (!isLeader) return;
    // UI updates via socket sync, but we emit the intent
    if (socket) {
      socket.emit('change_match_mode', { playerId: player.playerId, mode });
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
      setSearchResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/users/search?id=${searchQuery}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.success) {
        setSearchResults([data.data]);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const handleInvite = (friend) => {
    if (!socket) return;
    // Send invite to the friend's playerId, along with my profile data
    socket.emit('send_invite', { 
      toPlayerId: friend.playerId, 
      fromPlayer: player 
    });
    
    setIsInviteModalOpen(false);
    setSearchQuery('');
    setSearchResults(null);
  };

  const handleAcceptInvite = (inviteData) => {
    addToRecentPlayers(inviteData.from);
    // Tell the sender that I accepted, sending my profile data
    if (socket) {
      socket.emit('accept_invite', {
        toPlayerId: inviteData.from.playerId,
        fromPlayer: player,
        partyId: inviteData.partyId
      });
    }
    removePendingInvite(inviteData.from.playerId);
  };

  const handleDeclineInvite = (playerId) => {
    removePendingInvite(playerId);
  };

  const removeFriend = (friendId) => {
    // Only leader can remove friends? Or a user can leave the party. 
    // For now we rely on socket disconnects.
  };

  // Determine if we should show the invite card
  const showInviteCard = isLeader && lobbyFriends.length < maxFriends;

  // Split friends evenly for left and right of the main player
  const midIndex = Math.ceil(lobbyFriends.length / 2);
  const leftFriends = lobbyFriends.slice(0, midIndex);
  const rightFriends = lobbyFriends.slice(midIndex);

  return (
    <div className="dashboard-container valorant-theme">
      
      {/* Pending Invites Overlay */}
      {pendingInvites.length > 0 && (
        <div className="invites-container" style={{position: 'fixed', top: '20px', right: '20px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px'}}>
          {pendingInvites.map(invite => (
            <div key={invite.from.playerId} className="glass-panel" style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '10px', animation: 'fadeIn 0.3s ease'}}>
              <div style={{color: 'white'}}>
                <strong>{invite.from.username}</strong> invited you to their lobby!
              </div>
              <div style={{display: 'flex', gap: '10px'}}>
                <button className="btn-primary" style={{padding: '5px 15px'}} onClick={() => handleAcceptInvite(invite)}>Accept</button>
                <button className="btn-secondary" style={{padding: '5px 15px'}} onClick={() => handleDeclineInvite(invite.from.playerId)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <header className="dashboard-header">
        <h2>LOBBY</h2>
        <p>Compete Together. Grow Together.</p>
      </header>

      <div className="lobby-middle-section">
        <div className="tip-container" style={{ zIndex: 10 }}>
          <TipOfTheDay />
        </div>

        {/* The main lobby stage where avatars stand */}
        <div className="lobby-stage" style={{justifyContent: 'center', flexWrap: 'wrap'}}>
        
        {/* Render friends on the left */}
        {leftFriends.map((friend) => (
          <div className="agent-card joined" key={friend.playerId}>
            {party.leaderId === friend.playerId && (
              <div style={{position: 'absolute', top: '10px', right: '10px', color: 'gold', fontSize: '1.2rem'}}>⭐</div>
            )}
            <div className="agent-avatar"><SpriteAvatar index={friend.avatar || '0'} /></div>
            <div className="agent-info">
              <h4>{friend.username}</h4>
              <span className="agent-rank">{friend.rank} - {friend.xp || 0} XP</span>
            </div>
          </div>
        ))}

        {/* Center Slot: Main Player */}
        <div className="agent-card main-player joined">
           {party.leaderId === player.playerId && (
              <div style={{position: 'absolute', top: '10px', right: '10px', color: 'gold', fontSize: '1.2rem', zIndex: 10}}>⭐</div>
           )}
           <div className="agent-avatar highlight"><SpriteAvatar index={player.avatar} /></div>
           <div className="agent-info">
             <h4>{player.username} (You)</h4>
             <span className="agent-rank text-yellow">{player.rank} - {player.xp} XP</span>
           </div>
        </div>

        {/* Render friends on the right */}
        {rightFriends.map((friend) => (
          <div className="agent-card joined" key={friend.playerId}>
            {party.leaderId === friend.playerId && (
              <div style={{position: 'absolute', top: '10px', right: '10px', color: 'gold', fontSize: '1.2rem'}}>⭐</div>
            )}
            <div className="agent-avatar"><SpriteAvatar index={friend.avatar || '0'} /></div>
            <div className="agent-info">
              <h4>{friend.username}</h4>
              <span className="agent-rank">{friend.rank} - {friend.xp || 0} XP</span>
            </div>
          </div>
        ))}

        {/* Show a single + Invite card on the right if not full */}
        {showInviteCard && (
          <div className="agent-card empty" onClick={() => setIsInviteModalOpen(true)} style={{cursor: 'pointer'}}>
            <div className="empty-slot-text">+ Invite</div>
          </div>
        )}
        </div>
        
        {/* Spacer for perfect center alignment */}
        <div className="lobby-spacer"></div>
      </div>

      {/* Floating panels at the bottom */}
      <div className="lobby-bottom-bar">
        <div className="stats-panel glass-panel">
          <h3>Player Stats</h3>
          <div className="stats-row">
            <div className="stat-item"><span>Rank:</span> <span className="stat-value text-yellow">{player.rank}</span></div>
            <div className="stat-item"><span>XP:</span> <span className="stat-value">{player.xp}</span></div>
          </div>
        </div>

        <div className="action-panel" style={{ flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="match-mode-selector" style={{ opacity: isLeader ? 1 : 0.6, display: 'flex', gap: '1rem', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#aaa' }}>Rounds:</span>
              <select 
                value={party?.numRounds || 1}
                onChange={(e) => {
                  if (socket && isLeader) {
                    socket.emit('change_num_rounds', { playerId: player.playerId, numRounds: parseInt(e.target.value) });
                  }
                }}
                disabled={!isLeader}
                className="auth-input"
                style={{ padding: '0.4rem', fontSize: '0.9rem', margin: 0, width: '60px', background: 'rgba(255,255,255,0.05)' }}
              >
                {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                className={`mode-btn ${matchMode === 'friendly' ? 'active' : ''}`}
                onClick={() => handleModeChange('friendly')}
                disabled={!isLeader}
              >
                Friendly Match
              </button>
              <button 
                className={`mode-btn ${matchMode === 'competitive' ? 'active' : ''}`}
                onClick={() => handleModeChange('competitive')}
                disabled={!isLeader}
              >
                Competitive Match
              </button>
            </div>
          </div>

           {isLeader ? (
             <button className="btn-primary start-match-btn" onClick={() => {
                if (socket) {
                    socket.emit('start_match', { playerId: player.playerId });
                } else {
                    navigate('/match-loading'); // fallback if no socket
                }
             }}>START MATCH</button>
           ) : (
             <button className="btn-secondary start-match-btn" disabled>WAITING FOR LEADER...</button>
           )}
        </div>

        <div className="quests-panel-mini glass-panel">
           <h3>Player Record</h3>
           <div className="quests-list-mini">
              <div className="quest-item-mini">
                 <span className="quest-title">Match Wins</span>
                 <span className="quest-reward" style={{color: '#00b8a3'}}>{player.wins}</span>
              </div>
              <div className="quest-item-mini">
                 <span className="quest-title">Match Losses</span>
                 <span className="quest-reward" style={{color: '#ff4655'}}>{player.losses}</span>
              </div>
              <div className="quest-item-mini">
                 <span className="quest-title">Win Rate</span>
                 <span className="quest-reward text-yellow">
                   {player.wins + player.losses > 0 
                     ? Math.round((player.wins / (player.wins + player.losses)) * 100) + '%' 
                     : '0%'}
                 </span>
              </div>
           </div>
        </div>
      </div>

      {/* Invite Friends Modal */}
      {isInviteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsInviteModalOpen(false)}>
          <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
            <h2 style={{color: '#fff', textAlign: 'center', marginBottom: '1.5rem'}}>Invite a Friend</h2>
            
            <form onSubmit={handleSearch} style={{display: 'flex', gap: '10px', marginBottom: '1.5rem'}}>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Search by Player ID (e.g. X7K9A)"
                className="auth-input"
                style={{flex: 1, margin: 0}}
              />
              <button type="submit" className="btn-primary" disabled={isSearching} style={{padding: '0 1rem'}}>
                {isSearching ? '...' : 'Search'}
              </button>
            </form>

            <div className="friends-list">
              {searchResults !== null ? (
                searchResults.length > 0 ? (
                  searchResults
                  .map(friend => (
                    <div className="friend-list-item" key={friend.playerId} onClick={() => !lobbyFriends.find(f => f.playerId === friend.playerId) && handleInvite(friend)} style={{ opacity: lobbyFriends.find(f => f.playerId === friend.playerId) ? 0.5 : 1, cursor: lobbyFriends.find(f => f.playerId === friend.playerId) ? 'not-allowed' : 'pointer' }}>
                      <div style={{width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #444'}}>
                        <SpriteAvatar index={friend.avatar || '0'} />
                      </div>
                      <div className="friend-info" style={{marginLeft: '1rem', flex: 1}}>
                        <div style={{color: '#fff', fontWeight: 'bold'}}>{friend.username}</div>
                        <div style={{color: '#aaa', fontSize: '0.8rem'}}>{friend.rank}</div>
                      </div>
                      <button className="btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} disabled={lobbyFriends.find(f => f.playerId === friend.playerId)}>
                        {lobbyFriends.find(f => f.playerId === friend.playerId) ? 'In Lobby' : 'Invite'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div style={{textAlign: 'center', color: '#888'}}>No player found with that ID.</div>
                )
              ) : (
                recentPlayers.length > 0 ? (
                  <div>
                    <div style={{color: '#888', marginBottom: '10px', fontSize: '0.9rem'}}>Recent Players</div>
                    {recentPlayers.map(friend => (
                      <div className="friend-list-item" key={friend.playerId} onClick={() => !lobbyFriends.find(f => f.playerId === friend.playerId) && handleInvite(friend)} style={{ opacity: lobbyFriends.find(f => f.playerId === friend.playerId) ? 0.5 : 1, cursor: lobbyFriends.find(f => f.playerId === friend.playerId) ? 'not-allowed' : 'pointer', animation: 'fadeIn 0.3s ease' }}>
                        <div style={{width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '1px solid #444'}}>
                          <SpriteAvatar index={friend.avatar || '0'} />
                        </div>
                        <div className="friend-info" style={{marginLeft: '1rem', flex: 1}}>
                          <div style={{color: '#fff', fontWeight: 'bold'}}>{friend.username}</div>
                          <div style={{color: '#aaa', fontSize: '0.8rem'}}>{friend.rank}</div>
                        </div>
                        <button className="btn-secondary" style={{padding: '0.4rem 0.8rem', fontSize: '0.8rem'}} disabled={lobbyFriends.find(f => f.playerId === friend.playerId)}>
                          {lobbyFriends.find(f => f.playerId === friend.playerId) ? 'In Lobby' : 'Invite'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{textAlign: 'center', color: '#888'}}>Enter a Player ID above to search for players!</div>
                )
              )}
            </div>
            <button className="btn-secondary" style={{width: '100%', marginTop: '1rem'}} onClick={() => setIsInviteModalOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
