import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { verifyEmail } from '../services/authService';
import '../styles/homepage.css';

export default function VerifyEmail() {
  const { token } = useParams();
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }

    let active = true;
    setStatus('loading');

    verifyEmail(token)
      .then(() => {
        if (active) setStatus('success');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, [token]);

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';
  const message = isLoading
    ? 'Verifying your email...'
    : isSuccess
      ? 'Email verified successfully'
      : 'Verification link is invalid or expired';

  return (
    <section className="bp-login-page">
      <div className="bp-login-card">
        <div className="bp-login-card-header">
          <p className="bp-eyebrow">Email Verification</p>
          <h2>{message}</h2>
          {isLoading ? (
            <p>Please wait while we confirm your verification link.</p>
          ) : (
            <p>
              {isSuccess
                ? 'Your account is ready. You can now sign in.'
                : 'Please request a new verification email and try again.'}
            </p>
          )}
        </div>
        {!isLoading && (
          <Link className="bp-login-submit" to="/login">
            Go to Login
          </Link>
        )}
      </div>
    </section>
  );
}
