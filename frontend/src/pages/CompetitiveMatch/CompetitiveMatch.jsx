import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import './CompetitiveMatch.css';

const DEFAULT_CODE = {
  'cpp': 'class Solution {\npublic:\n    int numOfStrings(vector<string>& patterns, string word) {\n        \n    }\n};',
  'java': 'class Solution {\n    public int numOfStrings(String[] patterns, String word) {\n        \n    }\n}',
  'python': 'class Solution:\n    def numOfStrings(self, patterns: List[str], word: str) -> int:\n        '
};

const CompetitiveMatch = () => {
  const navigate = useNavigate();
  const { user, setUser, fetchProfile } = useContext(AuthContext);
  const { socket, party } = useContext(SocketContext);
  
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(DEFAULT_CODE['cpp']);
  const [testStatus, setTestStatus] = useState('idle'); // idle, running, success, failed
  const [terminalOutput, setTerminalOutput] = useState('You must run your code first');
  const [roundOverlay, setRoundOverlay] = useState(null);
  const [matchOverlay, setMatchOverlay] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // chat only now

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
  };

  const handleSolveOnLeetCode = () => {
    const slug = party?.problemData?.titleSlug || party?.question?.titleSlug;
    if (slug) {
      window.open(`https://leetcode.com/problems/${slug}/`, '_blank');
    }
  };

  const handleVerify = () => {
    if (!user?.leetcode_link) {
      setTestStatus('failed');
      setTerminalOutput('Verification Failed: Please go to your Profile page and link your LeetCode username first!');
      return;
    }

    setTestStatus('running');
    setTerminalOutput('Verifying submission with LeetCode servers...');
    
    let leetcodeUsername = user.leetcode_link;
    // Extract username robustly if they provided a full URL
    if (leetcodeUsername.includes('leetcode.com/')) {
      try {
        const urlStr = leetcodeUsername.startsWith('http') ? leetcodeUsername : `https://${leetcodeUsername}`;
        const url = new URL(urlStr);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          leetcodeUsername = pathSegments[pathSegments.length - 1];
        }
      } catch (e) {
        console.error("Failed to parse LeetCode URL", e);
      }
    }
    
    if (socket) {
      socket.emit('verify_win', { playerId: user.playerId, leetcodeUsername });
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    socket.on('match_ended', ({ winnerId, scores }) => {
      setMatchOverlay({ winnerId, scores });
      if (winnerId === user.playerId && user) {
        setUser({ ...user, xp: (user.xp || 0) + 50 });
        if (fetchProfile) fetchProfile();
      }
      setTimeout(() => navigate('/dashboard'), 5000);
    });

    socket.on('round_ended', ({ winnerId, nextRoundIn, scores }) => {
      setTestStatus('success');
      setTerminalOutput(`Round Over! Winner: ${winnerId === user.playerId ? 'You' : winnerId}`);
      if (winnerId === user.playerId && user) {
        if (fetchProfile) fetchProfile(); // Sync normal XP immediately
      }
      
      let timeLeft = nextRoundIn;
      setRoundOverlay({ winnerId, countdown: timeLeft });
      const timer = setInterval(() => {
        timeLeft -= 1;
        setRoundOverlay(prev => prev ? { ...prev, countdown: timeLeft } : null);
        if (timeLeft <= 0) clearInterval(timer);
      }, 1000);
    });

    socket.on('next_round', ({ currentRound, problemData, scores }) => {
      setRoundOverlay(null);
      setTestStatus('idle');
      setTerminalOutput('You must run your code first');
      setCode(DEFAULT_CODE[language]);
    });

    socket.on('verify_failed', ({ message }) => {
      setTestStatus('failed');
      setTerminalOutput(`Verification Failed: ${message}`);
    });

    socket.on('new_chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('match_ended');
      socket.off('round_ended');
      socket.off('next_round');
      socket.off('verify_failed');
      socket.off('new_chat_message');
    };
  }, [socket, navigate, user, setUser]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !socket || !party) return;
    socket.emit('chat_message', { partyId: party.leaderId, playerId: user.playerId, message: chatInput.trim() });
    setChatInput('');
  };

  const handleQuit = () => {
    if (socket && user) {
      socket.emit('leave_party', { playerId: user.playerId });
    }
    navigate('/dashboard');
  };

  return (
    <div className="competitive-match">
      {testStatus !== 'idle' && testStatus !== 'success' && (
        <div style={{
          position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
          padding: '12px 24px', borderRadius: '8px', zIndex: 9999, fontWeight: 'bold',
          background: testStatus === 'failed' ? '#ff4655' : '#ffa116',
          color: testStatus === 'running' ? '#000' : '#fff',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.3s ease'
        }}>
          {terminalOutput}
        </div>
      )}

      {matchOverlay && (
        <div className="modal-overlay" style={{ zIndex: 3000 }}>
          <div className="modal-content glass-panel" style={{ textAlign: 'center', background: 'linear-gradient(135deg, #ffd70033 0%, #1a1a1a 100%)', border: '2px solid #ffd700' }}>
            <h1 style={{ color: '#ffd700', fontSize: '3rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '2px' }}>Match Complete</h1>
            <h2 style={{ color: '#fff', fontSize: '2rem', marginBottom: '2rem' }}>
              {matchOverlay.winnerId === user.playerId ? '🏆 YOU WON THE MATCH! 🏆' : `🏆 ${matchOverlay.winnerId} WON 🏆`}
            </h2>
            {matchOverlay.winnerId === user.playerId && (
              <div style={{ color: '#00b8a3', fontSize: '1.2rem', marginBottom: '2rem', fontWeight: 'bold' }}>+50 Bonus Match XP Earned!</div>
            )}
            <div style={{ fontSize: '1.2rem', color: '#aaa' }}>Returning to lobby...</div>
          </div>
        </div>
      )}

      {roundOverlay && !matchOverlay && (
        <div className="modal-overlay" style={{ zIndex: 2000 }}>
          <div className="modal-content glass-panel" style={{ textAlign: 'center', background: '#1a1a1a' }}>
            <h1 style={{ color: '#00b8a3', fontSize: '2.5rem', marginBottom: '1rem' }}>Round Complete!</h1>
            <h2 style={{ color: '#fff', marginBottom: '2rem' }}>
              {roundOverlay.winnerId === user.playerId ? 'You won this round!' : `${roundOverlay.winnerId} won this round!`}
            </h2>
            <div style={{ fontSize: '1.2rem', color: '#aaa' }}>
              Next round starting in <span style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 'bold' }}>{roundOverlay.countdown}</span>...
            </div>
          </div>
        </div>
      )}

      {/* Left Panel: Problem Statement */}
      <div className="problem-panel glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className="match-scoreboard" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
          <div style={{ color: '#fff', fontWeight: 'bold' }}>
            ROUND {party?.currentRound || 1} / {party?.numRounds || 1}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {party?.members?.map(m => (
              <div key={m.playerId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#2a2a2a', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>{m.username}:</span>
                <span style={{ color: '#00b8a3', fontWeight: 'bold' }}>{party?.scores?.[m.playerId] || 0} pts</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="problem-header">
          <h2>{party?.problemData?.title || 'Loading Problem...'}</h2>
          <div className="problem-tags">
            {party?.problemData?.difficulty && (
              <span className={`difficulty ${party.problemData.difficulty.toLowerCase()}`}>
                {party.problemData.difficulty}
              </span>
            )}
            {party?.problemData?.topicTags?.map(tag => (
              <span key={tag.name} className="topic-tag">{tag.name}</span>
            ))}
          </div>
        </div>
        
        <div className="problem-body">
          <div dangerouslySetInnerHTML={{ __html: party?.problemData?.content || '<p>Problem details will appear here...</p>' }}></div>
        </div>
      </div>

      {/* Right Panel: Editor and Terminal */}
      <div className="editor-terminal-panel">
        
        {/* Editor Area */}
        <div className="editor-area glass-panel">
          <div className="editor-header">
            <div className="language-selector">
              <select value={language} onChange={handleLanguageChange}>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
                <option value="python">Python 3</option>
              </select>
            </div>
            <div className="editor-actions">
              <button className="btn-secondary run-btn" onClick={handleSolveOnLeetCode} style={{ background: '#ffa116', color: '#000', borderColor: '#ffa116' }}>
                Solve on LeetCode
              </button>
              <button className="btn-primary submit-btn" onClick={handleVerify} disabled={testStatus === 'running'}>
                {testStatus === 'running' ? 'Verifying...' : 'Verify Win'}
              </button>
              <button className="btn-secondary quit-btn" onClick={handleQuit} style={{ borderColor: '#ff4655', color: '#ff4655', padding: '6px 16px' }}>
                Quit Match
              </button>
            </div>
          </div>
          
          <div className="monaco-container">
            <Editor
              height="100%"
              language={language === 'python' ? 'python' : language}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value)}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                lineHeight: 24,
                padding: { top: 16 }
              }}
            />
          </div>
        </div>

        {/* Terminal Area */}
        <div className="terminal-area glass-panel">
          <div className="terminal-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span className={`terminal-tab active`}>Party Chat</span>
          </div>
          <div className={`terminal-content ${testStatus}`} style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '0.5rem' }}>
              <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {chatMessages.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', marginTop: '1rem' }}>No messages yet. Say hi!</div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'baseline' }}>
                      <strong style={{ color: msg.playerId === user.playerId ? '#00b8a3' : '#ffc01e', fontSize: '0.9rem' }}>
                        {party?.members?.find(m => m.playerId === msg.playerId)?.username || msg.playerId}:
                      </strong>
                      <span style={{ color: '#eee', fontSize: '0.9rem' }}>{msg.message}</span>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendChat} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  className="auth-input"
                  style={{ flex: 1, margin: 0, padding: '0.5rem', background: '#111' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 1rem' }}>Send</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompetitiveMatch;
