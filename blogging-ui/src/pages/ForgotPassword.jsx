import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useToast } from '../components/useToast';
import { forgotPassword } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';
import '../styles/homepage.css';

export default function ForgotPassword() {
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      showToast('Reset email requested.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to request reset email'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bp-login-page">
      <div className="bp-login-card">
        <div className="bp-login-card-header">
          <p className="bp-eyebrow">Account Recovery</p>
          <h2>Forgot Password</h2>
          <p>Enter your email and we will send a reset link.</p>
        </div>
        <form className="bp-login-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <button className="bp-login-submit" disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
          {message && <div className="bp-form-success">{message}</div>}
          <p className="bp-auth-switch"><Link to="/login">Back to login</Link></p>
        </form>
      </div>
    </section>
  );
}
