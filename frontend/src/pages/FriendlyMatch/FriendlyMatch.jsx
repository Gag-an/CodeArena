import React, { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { AuthContext } from '../../context/AuthContext';
import { SocketContext } from '../../context/SocketContext';
import './FriendlyMatch.css';

const DEFAULT_CODE = {
  'cpp': 'class Solution {\npublic:\n    int numOfStrings(vector<string>& patterns, string word) {\n        \n    }\n};',
  'java': 'class Solution {\n    public int numOfStrings(String[] patterns, String word) {\n        \n    }\n}',
  'python': 'class Solution:\n    def numOfStrings(self, patterns: List[str], word: str) -> int:\n        '
};

const DraggableVideo = ({ stream, isLocal, title, defaultPos, isAudioMuted, toggleAudio, isVideoMuted, toggleVideo }) => {
  const [pos, setPos] = useState(defaultPos);
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleDrag = (e) => {
    if (e.buttons !== 1) return;
    setPos(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }));
  };

  return (
    <div className="video-chat-window" style={{ left: pos.x, top: pos.y }}>
      <div className="video-chat-header" onMouseMove={handleDrag}>{title}</div>
      <div className="video-chat-content">
        <video ref={videoRef} autoPlay playsInline muted={isLocal} />
        {isLocal && (
           <div className="video-chat-controls">
             <button onClick={toggleAudio} className={isAudioMuted ? 'muted' : ''}>{isAudioMuted ? '🔇' : '🎙️'}</button>
             <button onClick={toggleVideo} className={isVideoMuted ? 'muted' : ''}>{isVideoMuted ? '🚫' : '📹'}</button>
           </div>
        )}
      </div>
    </div>
  );
};

const FriendlyMatch = () => {
  const navigate = useNavigate();
  const { user, setUser, fetchProfile } = useContext(AuthContext);
  const { socket, party } = useContext(SocketContext);
  
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(DEFAULT_CODE['cpp']);
  const [testStatus, setTestStatus] = useState('idle');
  const [terminalOutput, setTerminalOutput] = useState('');
  const [notepadText, setNotepadText] = useState('');
  const [roundOverlay, setRoundOverlay] = useState(null);
  const [matchOverlay, setMatchOverlay] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [activeTab, setActiveTab] = useState('notepad'); // notepad, chat

  const [opponentCode, setOpponentCode] = useState(DEFAULT_CODE['cpp']);
  const [opponentLanguage, setOpponentLanguage] = useState('cpp');

  const opponent = party?.members?.find(m => m.playerId !== user?.playerId);

  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const peerConnectionRef = useRef(null);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);

  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    setLanguage(lang);
    setCode(DEFAULT_CODE[lang]);
    if (socket && user && party) {
      socket.emit('code_sync', { partyId: party.leaderId, playerId: user.playerId, code: DEFAULT_CODE[lang], language: lang });
    }
  };

  const handleCodeChange = (value) => {
    setCode(value);
    if (socket && user && party) {
      socket.emit('code_sync', { partyId: party.leaderId, playerId: user.playerId, code: value, language });
    }
  };

  const handleNotepadChange = (e) => {
    setNotepadText(e.target.value);
    if (socket && user && party) {
      socket.emit('notepad_sync', { partyId: party.leaderId, playerId: user.playerId, content: e.target.value });
    }
  };

  const handleSolveOnLeetCode = () => {
    let slug = party?.problemData?.titleSlug || party?.question?.titleSlug;
    if (!slug && party?.problemData?.title) {
        // Fallback: generate slug from title
        slug = party.problemData.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    
    if (slug) {
      window.open(`https://leetcode.com/problems/${slug}/`, '_blank');
    } else {
      alert("Error: Could not determine problem slug to open LeetCode.");
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
    if (leetcodeUsername.includes('leetcode.com/')) {
      try {
        const urlStr = leetcodeUsername.startsWith('http') ? leetcodeUsername : `https://${leetcodeUsername}`;
        const url = new URL(urlStr);
        const pathSegments = url.pathname.split('/').filter(Boolean);
        if (pathSegments.length > 0) {
          leetcodeUsername = pathSegments[pathSegments.length - 1];
        }
      } catch (e) {}
    }
    
    if (socket) {
      socket.emit('verify_win', { playerId: user.playerId, leetcodeUsername });
    }
  };

  useEffect(() => {
    if (!socket) return;
    
    socket.on('match_ended', ({ winnerId }) => {
      setMatchOverlay({ winnerId });
      if (winnerId === user.playerId && user) {
        if (fetchProfile) fetchProfile();
      }
      setTimeout(() => navigate('/dashboard'), 5000);
    });

    socket.on('round_ended', ({ winnerId, nextRoundIn }) => {
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

    socket.on('next_round', ({ currentRound, problemData }) => {
      setRoundOverlay(null);
      setTestStatus('idle');
      setTerminalOutput('');
      setCode(DEFAULT_CODE[language]);
      setOpponentCode(DEFAULT_CODE[opponentLanguage]);
    });

    socket.on('verify_failed', ({ message }) => {
      setTestStatus('failed');
      setTerminalOutput(`Verification Failed: ${message}`);
    });

    socket.on('code_update', ({ playerId, code, language }) => {
      if (opponent && playerId === opponent.playerId) {
        setOpponentCode(code);
        setOpponentLanguage(language);
      }
    });

    socket.on('notepad_update', ({ playerId, content }) => {
      if (opponent && playerId === opponent.playerId) {
        setNotepadText(content);
      }
    });

    socket.on('new_chat_message', (msg) => {
      setChatMessages(prev => [...prev, msg]);
    });

    return () => {
      socket.off('match_ended');
      socket.off('round_ended');
      socket.off('next_round');
      socket.off('verify_failed');
      socket.off('code_update');
      socket.off('notepad_update');
      socket.off('new_chat_message');
    };
  }, [socket, navigate, user, setUser, opponent]);

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

  // WebRTC Setup and Signaling
  useEffect(() => {
    if (!socket || !party || !user) return;
    const isLeader = party.leaderId === user.playerId;

    const startWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        peerConnectionRef.current = pc;

        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        pc.ontrack = (event) => {
          setRemoteStream(event.streams[0]);
        };

        pc.onicecandidate = (event) => {
          if (event.candidate) {
             socket.emit('webrtc_signal', { partyId: party.leaderId, playerId: user.playerId, signal: { type: 'ice', candidate: event.candidate } });
          }
        };

        if (isLeader) {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit('webrtc_signal', { partyId: party.leaderId, playerId: user.playerId, signal: { type: 'offer', offer } });
        }
      } catch (err) {
        console.error("Failed to start WebRTC", err);
      }
    };

    startWebRTC();

    return () => {
      if (peerConnectionRef.current) {
         peerConnectionRef.current.close();
      }
      setLocalStream(prev => {
        if(prev) prev.getTracks().forEach(t => t.stop());
        return null;
      });
    };
  }, [socket, party, user]);

  useEffect(() => {
    if (!socket || !party || !user) return;
    
    const handleSignal = async ({ playerId, signal }) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('webrtc_signal', { partyId: party.leaderId, playerId: user.playerId, signal: { type: 'answer', answer } });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
        } else if (signal.type === 'ice') {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (e) {
        console.error('WebRTC Signaling Error:', e);
      }
    };

    socket.on('webrtc_signal', handleSignal);
    return () => socket.off('webrtc_signal', handleSignal);
  }, [socket, party, user]);

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsAudioMuted(!localStream.getAudioTracks()[0].enabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoMuted(!localStream.getVideoTracks()[0].enabled);
    }
  };

  return (
    <div className="friendly-match">
      {localStream && (
        <DraggableVideo 
          stream={localStream} 
          isLocal={true} 
          title="You" 
          defaultPos={{ x: 20, y: window.innerHeight - 260 }} 
          isAudioMuted={isAudioMuted}
          isVideoMuted={isVideoMuted}
          toggleAudio={toggleAudio}
          toggleVideo={toggleVideo}
        />
      )}
      {remoteStream && (
        <DraggableVideo 
          stream={remoteStream} 
          isLocal={false} 
          title={`${opponent ? opponent.username : 'Opponent'}`} 
          defaultPos={{ x: window.innerWidth - 260, y: window.innerHeight - 260 }} 
        />
      )}
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
        <div className="match-scoreboard" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #333' }}>
          <div style={{ color: '#fff', fontWeight: 'bold' }}>
            ROUND {party?.currentRound || 1} / {party?.numRounds || 1}
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

      {/* Middle Panel: My Editor and Terminal */}
      <div className="editor-terminal-panel">
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
              onChange={handleCodeChange}
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
            <div>
              <span className={`terminal-tab ${activeTab === 'notepad' ? 'active' : ''}`} onClick={() => setActiveTab('notepad')}>Shared Notepad</span>
              <span className={`terminal-tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Party Chat</span>
            </div>
          </div>
          <div className="terminal-content" style={{ padding: 0, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {activeTab === 'chat' ? (
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
            ) : (
              <textarea
                style={{
                  flex: 1, background: 'transparent', color: '#ccc',
                  border: 'none', padding: '1rem', outline: 'none', resize: 'none',
                  fontFamily: "'Fira Code', 'Courier New', monospace", fontSize: '0.9rem'
                }}
                value={notepadText}
                onChange={handleNotepadChange}
                placeholder="Type notes here to share with your duo..."
                spellCheck="false"
              />
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: Opponent Editor */}
      <div className="editor-terminal-panel opponent-panel">
        <div className="editor-area glass-panel" style={{height: '100%'}}>
          <div className="editor-header opponent-header">
             <span style={{color: '#fff', fontWeight: 'bold'}}>{opponent ? opponent.username : 'Opponent'}'s Code ({opponentLanguage})</span>
          </div>
          
          <div className="monaco-container">
            <Editor
              height="100%"
              language={opponentLanguage === 'python' ? 'python' : opponentLanguage}
              theme="vs-dark"
              value={opponentCode}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'Fira Code', 'Courier New', monospace",
                lineHeight: 24,
                padding: { top: 16 },
                readOnly: true
              }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};

export default FriendlyMatch;
