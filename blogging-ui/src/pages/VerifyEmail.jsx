import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { verifyEmail } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';
import '../styles/homepage.css';

export default function VerifyEmail() {
  const { token } = useParams();
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    verifyEmail(token)
      .then((result) => setMessage(result.message || 'Email verified.'))
      .catch((err) => setMessage(getApiErrorMessage(err, 'Email verification failed')));
  }, [token]);

  return (
    <section className="bp-login-page">
      <div className="bp-login-card">
        <div className="bp-login-card-header">
          <p className="bp-eyebrow">Email Verification</p>
          <h2>{message}</h2>
          <p><Link to="/login">Continue to login</Link></p>
        </div>
      </div>
    </section>
  );
}
