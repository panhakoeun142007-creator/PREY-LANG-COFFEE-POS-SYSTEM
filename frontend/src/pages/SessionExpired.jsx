import React from 'react';
import { Link } from 'react-router-dom';
import '../style/index.css';

export default function SessionExpired() {
  return (
    <div className="login-container">
      <header className="login-header">
        <h1>The Daily Grind</h1>
        <Link to="/login" className="return-link">Return to Login</Link>
      </header>

      <main className="login-main">
        <div className="login-card">
          <div className="expired-badge">Session Expired</div>
          
          <div className="expired-icon">⏰</div>
          
          <h2 className="login-title">Session Expired</h2>
          
          <p className="login-description">
            For your security, your session has timed out. Please sign in again to continue.
          </p>

          <div className="expired-info">
            <div className="info-item">
              <span className="info-label">Reason:</span>
              <span className="info-value">15 minutes of inactivity</span>
            </div>
            <div className="info-item">
              <span className="info-label">Time:</span>
              <span className="info-value">{new Date().toLocaleString()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Security:</span>
              <span className="info-value">Automatic logout completed</span>
            </div>
          </div>

          <div className="action-buttons">
            <Link to="/login" className="login-btn">
              SIGN IN AGAIN →
            </Link>
            <button className="secondary-btn" onClick={() => window.history.back()}>
              GO BACK
            </button>
          </div>

          <div className="security-tips">
            <h4>Security Tips:</h4>
            <ul>
              <li>Always log out when finished using the system</li>
              <li>Use strong, unique passwords</li>
              <li>Enable two-factor authentication when available</li>
            </ul>
          </div>

          <div className="back-to-login">
            <Link to="/login" className="back-link">← Back to Login</Link>
          </div>

          <div className="security-note">
            <span className="lock-icon">🔒</span>
            Your security is our priority
          </div>
        </div>
      </main>
    </div>
  );
}
