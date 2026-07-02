import React, { useState, useEffect } from 'react';
import './CareerLadder.css';

const initialPlayers = [
  { id: 'p1', name: 'SteelFort', points: 245270, isMe: false },
  { id: 'p2', name: 'MissRubis', points: 201054, isMe: false },
  { id: 'p3', name: 'Nagrarok', points: 182099, isMe: true },
  { id: 'p4', name: 'RaptorTwo', points: 180874, isMe: false },
];

const CareerLadder = () => {
  const [players, setPlayers] = useState(initialPlayers);
  const [animatedPoints, setAnimatedPoints] = useState(182099);

  useEffect(() => {
    let timeoutId;
    let pointInterval;

    const runAnimation = () => {
      // Reset state to initial before animating again
      setPlayers(initialPlayers);
      setAnimatedPoints(182099);

      // Start animation after a short delay
      timeoutId = setTimeout(() => {
        let current = 182099;
        const target = 300000;
        const duration = 1200;
        const stepTime = 20;
        const steps = duration / stepTime;
        const increment = (target - current) / steps;

        pointInterval = setInterval(() => {
          current += increment;
          if (current >= target) {
            current = target;
            clearInterval(pointInterval);
            
            // Re-sort players after points updated
            setPlayers(prev => {
              const newPlayers = prev.map(p => 
                p.isMe ? { ...p, points: target } : p
              );
              return newPlayers.sort((a, b) => b.points - a.points);
            });

            // Loop the animation after 4 seconds of displaying the final state
            timeoutId = setTimeout(runAnimation, 4000);
          }
          setAnimatedPoints(Math.floor(current));
        }, stepTime);
      }, 2000);
    };

    runAnimation();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(pointInterval);
    };
  }, []);

  return (
    <section className="career-ladder-section">
      <div className="career-ladder-content">
        <h2>Move up the (career) ladder</h2>
        <p>
          Use CodeArena to ace your next technical<br/>
          assessment and interview to get the job you deserve.
        </p>

        <div className="leaderboard-container">
          <div className="leaderboard-list">
            {players.map((player, index) => {
              const topPos = index * 70; // 60px height + 10px gap
              const rank = 50 + index;
              
              return (
                <div 
                  key={player.id} 
                  className={`leaderboard-row ${player.isMe ? 'is-me' : ''}`}
                  style={{ top: `${topPos}px` }}
                >
                  {player.isMe && <span className="arrow-icon left">↑</span>}
                  <div className="row-content">
                    <span className="player-rank">{rank}</span>
                    <span className="player-name">{player.name}</span>
                    <span className="player-points">
                      {player.isMe ? animatedPoints.toLocaleString() : player.points.toLocaleString()} CodePoints
                    </span>
                  </div>
                  {player.isMe && <span className="arrow-icon right">↑</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CareerLadder;
