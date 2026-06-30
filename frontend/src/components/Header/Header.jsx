import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="header">
      <Link to={user ? "/dashboard" : "/"} className="header-brand" style={{ textDecoration: 'none' }}>
        <span className="brand-icon">{"</>"}</span>
        <h1>CodeArena</h1>
      </Link>
      <nav>
        <ul>
          <li><Link to={user ? "/dashboard" : "/"}>Home</Link></li>
          <li><Link to="/leaderboard">Leaderboard</Link></li>
          {user && <li><Link to="/profile">Profile</Link></li>}
        </ul>
      </nav>
      <div className="header-actions">
        {user ? (
          <button onClick={logout} className="btn-secondary">Log Out</button>
        ) : (
          <>
            <Link to="/auth" className="btn-secondary">Log In</Link>
            <Link to="/auth" className="btn-primary" style={{ display: 'flex', alignItems: 'center' }}>Play Now</Link>
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
