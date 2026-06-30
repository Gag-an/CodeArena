import React from 'react';
import './Features.css';

const Features = () => {
  const featureList = [
    {
      title: "Interactive Puzzles",
      description: "Solve bite-sized coding challenges that test your logic and algorithmic thinking.",
      icon: "🧩",
      color: "blue"
    },
    {
      title: "Multiplayer Battles",
      description: "Compete against friends or global players in real-time coding face-offs.",
      icon: "⚔️",
      color: "pink"
    },
    {
      title: "Earn XP & Loot",
      description: "Level up your profile, unlock badges, and earn rewards as you master new skills.",
      icon: "🏆",
      color: "yellow"
    }
  ];

  return (
    <section className="features">
      <div className="features-header">
        <h2>Why Play CodeArena?</h2>
        <p>Learning to code shouldn't be boring. We make it an adventure.</p>
      </div>
      
      <div className="features-grid">
        {featureList.map((feature, index) => (
          <div className={`feature-card glass-panel card-${feature.color}`} key={index}>
            <div className="feature-icon">{feature.icon}</div>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;
