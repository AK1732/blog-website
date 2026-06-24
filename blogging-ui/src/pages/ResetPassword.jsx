import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { useToast } from '../components/useToast';
import { resetPassword } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';
import '../styles/homepage.css';

export default function ResetPassword() {
  const { token } = useParams();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const result = await resetPassword(token, password);
      setMessage(result.message);
      showToast('Password reset complete.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to reset password'), 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bp-login-page">
      <div className="bp-login-card">
        <div className="bp-login-card-header">
          <p className="bp-eyebrow">Account Recovery</p>
          <h2>Reset Password</h2>
          <p>Create a new password for your account.</p>
        </div>
        <form className="bp-login-form" onSubmit={handleSubmit}>
          <label>
            <span>New Password</span>
            <input type="password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          <button className="bp-login-submit" disabled={loading}>{loading ? 'Saving...' : 'Reset password'}</button>
          {message && <div className="bp-form-success">{message}</div>}
          <p className="bp-auth-switch"><Link to="/login">Back to login</Link></p>
        </form>
      </div>
    </section>
  );
}
