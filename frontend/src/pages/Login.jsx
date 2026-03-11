import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App.jsx';
import { authService } from '../services/authService';
import '../style/index.css';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      console.log('Attempting login with:', identifier.trim());

      const data = await authService.login({
        email: identifier.trim(),
        password,
      });

      console.log('Login response:', data);

      // Handle response - API returns {token, user} format
      const token = data?.token || data?.access_token;
      const userData = data?.user;

      console.log('Token:', token);
      console.log('User:', userData);

      if (token && userData) {
        // Successful login
        console.log('Login successful, redirecting...');

        // Determine redirect path based on role
        const userRole = userData.role || 'staff';
        const redirectPath = userRole === 'admin' ? '/' : '/staff-dashboard';

        // Update auth context state and redirect
        auth.login(token, userData, redirectPath);
        return;
      } else {
        console.log('No token or user in response');
        setError(data?.message || 'Invalid credentials. Please try again.');
      }
    } catch (submitError) {
      console.error('Login error:', submitError);
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
                <p className="login-ref-brand">Prey Lang Coffee POS</p>
                <h1 className="login-ref-aside-title">Brew Better. Sell Faster.</h1>
                <p className="login-ref-aside-text">
                  Manage orders, staff, and sales in one secure dashboard built for daily coffee shop operations.
                </p>
              </div>

              <div className="login-ref-aside-bottom">
                <div className="login-ref-logo-wrap">
                  <img
                    src="../imgs/image.png"
                    alt="Prey Lang Coffee logo"
                    className="login-ref-logo"
                  />
                </div>

                <div className="login-ref-badges">
                  <span>Live Orders</span>
                  <span>Secure Sessions</span>
                  <span>Role-based Access</span>
                </div>
              </div>
            </section>

            <section className="login-ref-form-wrap">
              <h2 className="login-title">
                Login Admin & Staff
              </h2>

              <p className="login-description">
                Use your email and password to access the POS system.
              </p>

              <form className="login-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="identifier">Email</label>
                  <input
                    type="text"
                    id="identifier"
                    placeholder="Enter your email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      id="password"
                      className="password-input-field"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      )}
                    </button>
                  </div>
                  <Link to="/forgot-password" className="forgot-link">
                    Forgot password?
                  </Link>
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
                  {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
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
