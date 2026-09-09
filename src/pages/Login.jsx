import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setErrorMessage('Please enter both username and password.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');

    const res = await login(username, password);
    setSubmitting(false);

    if (res.success) {
      navigate('/employees');
    } else {
      setErrorMessage(res.message || 'Authentication failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="flex-center" style={{ marginBottom: '12px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--primary-50)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Shield size={28} color="var(--primary-600)" />
            </div>
          </div>
          <div className="login-logo">NETFIL ERP</div>
          <p className="login-subtitle">Enterprise Resource Planning System</p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label">Username</label>
            <div className="search-input-wrap">
              <User size={16} />
              <input
                type="text"
                className="form-input search-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={submitting}
                autoFocus
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Password</label>
            <div className="search-input-wrap">
              <Lock size={16} />
              <input
                type="password"
                className="form-input search-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px' }}
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid var(--neutral-200)',
          fontSize: '12px',
          color: 'var(--neutral-500)',
          textAlign: 'center',
          backgroundColor: 'var(--neutral-50)',
          borderRadius: '6px',
          padding: '10px'
        }}>
          <div><strong>Demo Admin Credentials:</strong></div>
          <div>Username: <code>admin</code> | Password: <code>Admin@123</code></div>
        </div>
      </div>
    </div>
  );
};

export default Login;
