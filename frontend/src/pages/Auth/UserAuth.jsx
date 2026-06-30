import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './Auth.css';

const UserAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login, register } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '',
    username: '',
    college: '',
    leetcode_link: '',
    hackerearth_link: ''
  });
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validatePassword = (password) => {
    // Requires: 1 lowercase, 1 uppercase, 1 special char
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*]).+$/;
    return regex.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isLogin) {
        if (!validatePassword(formData.password)) {
          setError('Password must contain at least 1 lowercase letter, 1 uppercase letter, and 1 special character.');
          setLoading(false);
          return;
        }
        await register(formData);
      } else {
        await login(formData.email, formData.password);
      }
      // Note: AuthContext handles the navigation to /dashboard upon success
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel">
        <h2>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
        <p className="auth-subtitle">
          {isLogin ? 'Log in to continue your journey.' : 'Join CodeArena today.'}
        </p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Email Address</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
              placeholder="player@codearena.com"
            />
          </div>
          
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Username</label>
                <input 
                  type="text" 
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  required 
                  placeholder="CodeNinja"
                />
              </div>
              <div className="form-group">
                <label>College (Optional)</label>
                <input 
                  type="text" 
                  value={formData.college}
                  onChange={(e) => setFormData({...formData, college: e.target.value})}
                  placeholder="Chandigarh University"
                />
              </div>
              <div className="form-group">
                <label>LeetCode Username</label>
                <input 
                  type="text" 
                  value={formData.leetcode_link}
                  onChange={(e) => setFormData({...formData, leetcode_link: e.target.value})}
                  placeholder="e.g. alexander"
                  required
                />
              </div>
              <div className="form-group">
                <label>HackerEarth Profile Link (Optional)</label>
                <input 
                  type="url" 
                  value={formData.hackerearth_link}
                  onChange={(e) => setFormData({...formData, hackerearth_link: e.target.value})}
                  placeholder="https://hackerearth.com/@username"
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
              placeholder="••••••••"
            />
            {!isLogin && (
              <small className="password-hint">
                Must contain at least 1 uppercase, 1 lowercase, and 1 special character.
              </small>
            )}
          </div>
          
          <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>

        <div className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" className="text-btn" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Sign Up' : 'Log In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
