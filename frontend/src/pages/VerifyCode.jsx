import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import '../style/index.css';

export default function VerifyCode() {
  const location = useLocation();
  const navigate = useNavigate();
  const [code, setCode] = useState(new Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const email = location.state?.email || localStorage.getItem('verificationEmail') || '';
  const [devCode, setDevCode] = useState(location.state?.devCode || localStorage.getItem('verificationDevCode') || '');
  const [mailSent, setMailSent] = useState(location.state?.mailSent !== false);
  const inputRefs = useRef([]);
  const isBusy = isVerifying || isResending;

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

  const handleAutofillDevCode = () => {
    if (!devCode || devCode.length !== 6) return;
    const newCode = devCode.split('').slice(0, 6);
    setCode(newCode);
    const lastIndex = Math.min(newCode.length - 1, 5);
    if (inputRefs.current[lastIndex]) inputRefs.current[lastIndex].focus();
  };

  const handleResendCode = async () => {
    setCode(new Array(6).fill(''));
    setError('');
    setSuccess('');
    if (inputRefs.current[0]) inputRefs.current[0].focus();

    if (!email) {
      setError('Missing email. Please request a new verification code.');
      return;
    }

    setIsResending(true);
    try {
      const data = await authService.sendResetLink({ email });
      if (data?.success) {
        localStorage.setItem('verificationEmail', email);
        setMailSent(data?.mailSent !== false);

        if (data?.devCode) {
          localStorage.setItem('verificationDevCode', data.devCode);
          setDevCode(data.devCode);
        } else {
          localStorage.removeItem('verificationDevCode');
          setDevCode('');
        }

        setSuccess(data?.message || 'Verification code resent.');
      } else {
        setError(data?.message || 'Failed to resend verification code.');
      }
    } catch (err) {
      console.error('Error resending verification code:', err);
      setError(err?.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setIsResending(false);
    }
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

    // Always verify through the API
    setIsVerifying(true);

    try {
      const data = await authService.verifyCode({ email, code: enteredCode });
      if (data.success) {
        setSuccess('Code verified successfully.');
        localStorage.setItem('verificationEmail', email);
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
      setIsVerifying(false);
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
          {email && <p className="verify-ref-email">{email}</p>}

          {!!devCode && (
            <div className="success-message" style={{ marginBottom: '10px' }}>
              Dev code: <strong>{devCode}</strong>{' '}
              <button
                type="button"
                className="resend-btn verify-ref-resend-btn"
                onClick={handleAutofillDevCode}
                disabled={isBusy}
                style={{ marginLeft: '8px' }}
              >
                Autofill
              </button>
              {!mailSent && <div style={{ marginTop: '6px' }}>Email not sent (check backend MAIL_* settings).</div>}
            </div>
          )}

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
              
              <div className="code-inputs verify-ref-code-inputs">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleChange(e.target, index)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    onPaste={index === 0 ? handlePaste : null}
                    className="code-input verify-ref-code-input"
                    style={{
                      color: '#22314d',
                      backgroundColor: '#ffffff',
                      textAlign: 'center',
                      width: '42px',
                      height: '50px',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}
                    required
                  />
                ))}
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isBusy}>
              {isVerifying ? 'Verifying...' : 'Reset Password'}
            </button>
          </form>

          <div className="verify-ref-resend-row">
            Didn&apos;t receive a code?
            <button type="button" className="resend-btn verify-ref-resend-btn" onClick={handleResendCode} disabled={isBusy}>
              {isResending ? 'Sending...' : 'Resend'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
