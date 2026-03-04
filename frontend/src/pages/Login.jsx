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
          <div className="login-ref-shell">
            <section className="login-ref-aside" aria-hidden="true">
              <div className="login-ref-aside-top">
                <h1 className="login-ref-brand">Prey Lang Coffee</h1>
                <p className="login-ref-aside-text">
                  Manage orders, staff, and sales in one secure dashboard built for daily coffee shop operations.
                </p>
              </div>

              <div className="login-ref-aside-bottom">
                

                <div className="login-ref-badges">
                  <span>Live Orders</span>
                  <span>Secure Sessions</span>
                  <span>Role-based Access</span>
                </div>
              </div>
            </section>

            <section className="login-ref-form-wrap">
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

              <h2 className="login-title">
                {loginType === 'admin' ? 'Sign in as Admin' : 'Sign in as Staff'}
              </h2>

              <p className="login-description">
                {loginType === 'admin'
                  ? 'Use your admin email and password to access settings, reports, and management tools.'
                  : 'Use your staff ID or email and password to start billing and handle customer orders.'}
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="identifier">{loginType === 'admin' ? 'Admin Email' : 'Staff ID or Email'}</label>
                  <input
                    type="text"
                    id="identifier"
                    placeholder={loginType === 'admin' ? 'Enter admin email' : 'Enter your staff ID or email'}
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  {/* <p className="login-ref-fieldhint">
                    {loginType === 'admin'
                      ? 'Example: manager@coffee.com'
                      : 'Example: ST-102 or staff@coffee.com'}
                  </p> */}
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input">
                    <input
                      type="password"
                      id="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <Link to="/forgot-password" className="forgot-link">
                      Forgot password?
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
                  {isLoading ? 'SIGNING IN...' : `SIGN IN ${loginType === 'admin' ? 'TO DASHBOARD' : 'TO POS PORTAL'}`}
                </button>
              </form>

              <div className="security-note login-ref-switch">
                Secure login channel enabled
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
