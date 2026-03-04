import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../style/index.css';

export default function VerifySuccessful() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="login-container success-ref-page">
      <main className="login-main">
        <div className="login-card success-ref-card">
          <div className="success-ref-icon-wrap">
            <div className="success-ref-icon">
              <span className="success-ref-checkmark" />
            </div>
          </div>

          <h2 className="login-title success-ref-title">Verification Successful</h2>

          <p className="login-description success-ref-description">
            Your identity has been securely confirmed. You&apos;re ready to access your personal dashboard.
          </p>

          <div className="success-ref-actions">
            <Link to="/dashboard" className="login-btn success-ref-btn">
              Go to Dashboard &nbsp;-&gt;
            </Link>
          </div>

          <div className="success-ref-timer">
            <span className="success-ref-dot">&bull;</span>
            Auto-redirecting in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}
          </div>
        </div>
      </main>

      <div className="success-ref-footer-link">
        <Link to="/dashboard" className="back-link">Back to Login -&gt;</Link>
      </div>
    </div>
  );
}

