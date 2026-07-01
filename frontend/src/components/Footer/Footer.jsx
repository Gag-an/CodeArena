import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h2><span className="brand-icon">{"</>"}</span> CodeArena</h2>
          <p>Compete Together. Grow Together.</p>
        </div>
        <div className="footer-links">
          <Link to="/">About</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} CodeArena. Built for coders, by coders.</p>
      </div>
    </footer>
  );
};

export default Footer;
