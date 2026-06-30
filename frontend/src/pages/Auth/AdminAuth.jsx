import React, { useState } from 'react';
import './Auth.css';

const AdminAuth = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Hardcoded credentials check
    if (formData.email === 'gagkaur274@gmail.com' && formData.password === 'Gagan@27') {
      setSuccess(true);
    } else {
      setError('Invalid admin credentials.');
    }
  };

  if (success) {
    return (
      <div className="auth-container">
        <div className="auth-card glass-panel admin-success">
          <h2>Admin Access Granted</h2>
          <p>Welcome back, Gagan.</p>
          <button className="btn-primary" onClick={() => setSuccess(false)}>Log Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel admin-card">
        <div className="admin-icon">🛡️</div>
        <h2>Admin Portal</h2>
        <p className="auth-subtitle">Authorized personnel only.</p>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Admin Email</label>
            <input 
              type="email" 
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required 
            />
          </div>
          <div className="form-group">
            <label>Master Password</label>
            <input 
              type="password" 
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required 
            />
          </div>
          <button type="submit" className="btn-primary auth-submit-btn admin-btn">
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminAuth;
