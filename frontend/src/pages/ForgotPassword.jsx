import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/index.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const validateEmail = (value) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/send-reset-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem('verificationEmail', email);

        if (data.devCode) {
          localStorage.setItem('verificationDevCode', data.devCode);
        } else {
          localStorage.removeItem('verificationDevCode');
        }

        navigate('/verify-code', {
          state: {
            email,
            devCode: data.devCode || '',
            mailSent: data.mailSent !== false,
            infoMessage: data.message || '',
          },
        });
      } else {
        setError(data.message || 'Failed to send verification code. Please try again.');
      }
    } catch (err) {
      console.error('Error sending verification code:', err);
      const fallbackCode = Math.floor(100000 + Math.random() * 900000).toString();
      localStorage.setItem('verificationEmail', email);
      localStorage.setItem('verificationDevCode', fallbackCode);
      navigate('/verify-code', {
        state: {
          email,
          devCode: fallbackCode,
          mailSent: false,
          infoMessage: 'Network issue. Using local development code.',
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container forgot-ref-page">
      <main className="login-main">
        <div className="login-card forgot-ref-card">
          <div className="forgot-ref-head">
            <div className="forgot-ref-icon" aria-hidden="true">!</div>
            <h1 className="login-title">Forgot your password?</h1>
            <p className="login-description">
              Enter your account email and we&apos;ll send a 6-digit verification code so you can create a new password.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Account Email</label>
              <input
                type="email"
                id="email"
                placeholder="Enter your email account"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="forgot-ref-fieldhint">Use the same email you use to sign in.</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">!</span>
                {error}
              </div>
            )}

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'SENDING CODE...' : 'SEND VERIFICATION CODE'}
            </button>
          </form>

          <div className="forgot-ref-divider" />

          <div className="back-to-login">
            <Link to="/login" className="back-link">{'<-'} Back to Login</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
