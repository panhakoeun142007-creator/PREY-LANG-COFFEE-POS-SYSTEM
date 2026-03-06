import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../style/index.css';

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || localStorage.getItem('verificationEmail') || '';
  const isVerified = localStorage.getItem('passwordResetVerified') === 'true';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!isVerified) {
      setError('Please verify your code first.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.resetPassword({
        email,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (!data?.success) {
        setError(data?.message || 'Could not reset password.');
        return;
      }

      localStorage.removeItem('passwordResetVerified');
      localStorage.removeItem('verificationDevCode');
      setSuccess('Password changed successfully. Redirecting...');
      setTimeout(() => navigate('/verify-successful'), 600);
    } catch (err) {
      setError(err?.message || 'Reset password failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container reset-ref-page">
      <main className="login-main">
        <div className="login-card reset-ref-card">
          <div className="reset-ref-icon" aria-hidden="true">🔒</div>

          <h5 className="login-title">Set New Password</h5>

          <p className="login-description">
            Create a new password for your account.
          </p>

          {/* {email && (
            <p className="instruction" style={{ marginBottom: '12px' }}>
              Account: {email}
            </p>
          )} */}

          {error && (
            <div className="error-message" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '16px' }}>
              {success}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                placeholder="Min. 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Updating...' : 'Reset Password'}
            </button>
          </form>

          <div className="back-to-login reset-ref-back">
            <Link to="/verify-code" className="back-link">{'<-'} Back to Verify Code</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
