import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import '../style/index.css';

export default function Login() {
  const [loginType, setLoginType] = useState('staff');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const data = await authService.login({
        email: identifier.trim(),
        password,
      });

      if (data?.success) {
        if (data.token) localStorage.setItem('authToken', data.token);
        if (data.user) localStorage.setItem('authUser', JSON.stringify(data.user));
        login();
        navigate('/dashboard');
      } else {
        setError(data?.message || 'Invalid credentials. Please try again.');
      }
    } catch (submitError) {
      setError(submitError?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container login-ref-page">
      <main className="login-main">
        <div className="login-card">
          {/* <div className="login-ref-backrow">
            <a href="#" className="login-ref-backlink">{'<-'} Back to Role Selection</a>
          </div> */}

          <div className="login-ref-role-switch" role="tablist" aria-label="Role switch">
            <button
              type="button"
              className={`login-ref-role-btn ${loginType === 'staff' ? 'active' : ''}`}
              onClick={() => setLoginType('staff')}
            >
              Staff
            </button>
            <button
              type="button"
              className={`login-ref-role-btn ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => setLoginType('admin')}
            >
              Admin
            </button>
          </div>

          <h2 className="login-title">{loginType === 'admin' ? 'ADMIN LOGIN' : 'STAFF LOGIN'}</h2>

          <p className="login-description">
            {loginType === 'admin'
              ? 'Please enter your credentials to access the management portal.'
              : 'Please enter your credentials to access the shop portal.'}
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="identifier">{loginType === 'admin' ? 'Admin ID or Email' : 'Staff ID'}</label>
              <input
                type="text"
                id="identifier"
                placeholder={loginType === 'admin' ? 'Enter your admin email' : 'Enter your staff ID'}
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{loginType === 'admin' ? 'Password' : 'PIN / Password'}</label>
              <div className="password-input">
                <input
                  type="password"
                  id="password"
                  placeholder={loginType === 'admin' ? 'Enter your password' : 'Enter your PIN'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <Link to="/forgot-password" className="forgot-link">
                  {loginType === 'admin' ? 'Forgot password?' : 'Forgot PIN?'}
                </Link>
              </div>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            <div className="form-options">
              <label className="checkbox-label">
                <input type="checkbox" />
                <span>Remember session</span>
              </label>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'SIGNING IN...' : `SIGN IN TO ${loginType === 'admin' ? 'DASHBOARD' : 'PORTAL'} ->`}
            </button>
          </form>

          <div className="security-note login-ref-switch">
            Secure login channel enabled
          </div>
        </div>
      </main>
    </div>
  );
}
