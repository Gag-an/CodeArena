import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Master <span className="text-yellow">coding magic.</span><br />
          Cast spells. Build skills.
        </h1>
        <p className="hero-subtitle">
          Enter the sanctum of developers where you can cast code snippets, solve mystical puzzles, and earn XP while mastering real-world coding.
        </p>
        <div className="hero-cta">
          <button className="btn-primary hero-btn">
            <span className="icon">▶</span> Start playing
          </button>
          <button className="btn-secondary hero-btn">View Challenges</button>
        </div>
      </div>
      
      <div className="hero-visual">
        <div className="code-window glass-panel">
          <div className="window-header">
            <div className="dot red"></div>
            <div className="dot yellow"></div>
            <div className="dot green"></div>
            <span className="window-title">spells.js</span>
          </div>
          <pre className="code-content">
<code>
<span className="keyword">function</span> <span className="function">castSpell</span>(wizard, target) {'{'}
<br/>  <span className="comment">// Prepare your algorithms</span>
<br/>  <span className="keyword">const</span> magic = <span className="keyword">new</span> <span className="class">ArcaneArts</span>(wizard.level);
<br/>  
<br/>  <span className="keyword">if</span> (wizard.mana {'>'} <span className="number">9000</span>) {'{'}
<br/>    <span className="keyword">return</span> magic.<span className="function">executeUltimate</span>();
<br/>  {'}'}
<br/>
<br/>  <span className="keyword">return</span> magic.<span className="function">cast</span>();
<br/>{'}'}
</code>
          </pre>
        </div>
      </div>
    </section>
  );
};

export default Hero;
