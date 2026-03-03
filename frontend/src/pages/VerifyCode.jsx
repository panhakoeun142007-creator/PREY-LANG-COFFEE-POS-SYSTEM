import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../style/index.css';

export default function VerifyCode() {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const email = location.state?.email || localStorage.getItem('verificationEmail') || '';
  const devCode = location.state?.devCode || localStorage.getItem('verificationDevCode') || '';
  const inputRefs = useRef([]);

  const handleChange = (element, index) => {
    if (isNaN(element.value)) return;

    setCode([...code.map((d, idx) => (idx === index ? element.value : d))]);

    if (element.value !== '' && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && code[index] === '' && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').slice(0, 6);
    const newCode = pasteData.split('').concat(new Array(6 - pasteData.length).fill(''));
    setCode(newCode);
  };

  const handleResendCode = () => {
    setCode(new Array(6).fill(''));
    setError('');
    setSuccess('');
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const enteredCode = code.join('');
    if (!email) {
      setError('Missing email. Please request a new verification code.');
      return;
    }

    if (enteredCode.length !== 6) {
      setError('Please enter the 6-digit code.');
      return;
    }

    if (devCode && enteredCode === devCode) {
      setSuccess('Code verified successfully.');
      localStorage.removeItem('verificationDevCode');
      localStorage.setItem('passwordResetVerified', 'true');
      navigate('/reset-password', { state: { email } });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/verify-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: enteredCode }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Code verified successfully.');
        localStorage.removeItem('verificationDevCode');
        localStorage.setItem('passwordResetVerified', 'true');
        navigate('/reset-password', { state: { email } });
      } else {
        setError(data.message || 'Invalid verification code');
      }
    } catch (err) {
      console.error('Error verifying code:', err);
      setError('Verification request failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container verify-ref-page">
      <main className="login-main">
        <div className="login-card verify-ref-card">
          <div className="verify-ref-icon" aria-hidden="true">?</div>

          <h2 className="login-title">Verify Code</h2>

          <p className="login-description">
            We&apos;ve sent a 6-digit code to your email. Please enter it below to continue.
          </p>

          {error && (
            <div className="error-message">
              <span className="error-icon">!</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message" style={{ marginBottom: '10px' }}>
              {success}
            </div>
          )}

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="verify-ref-label">Verification Code</label>
              <div className="code-inputs verify-ref-code-inputs">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : null}
                    className="code-input verify-ref-code-input"
                    required
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Verifying...' : 'Reset Password'}
            </button>
          </form>

          <div className="verify-ref-resend-row">
            Didn&apos;t receive a code?
            <button type="button" className="resend-btn verify-ref-resend-btn" onClick={handleResendCode}>
              Resend
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
