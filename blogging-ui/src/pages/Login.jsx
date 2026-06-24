import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useToast } from '../components/useToast';
import { login } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';
import { getDashboardPath } from '../utils/dashboardPath';
import '../styles/homepage.css';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const next = {};
    if (!email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(email)) next.email = 'Enter a valid email address.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    return next;
  }, [email, password]);

  const canSubmit = Object.keys(errors).length === 0;

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ email: true, password: true });
    if (!canSubmit) return;

    setFormError('');
    setSubmitting(true);
    try {
      const result = await login({ email, password });
      showToast('Welcome back.');
      navigate(getDashboardPath(result.user?.role), { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Email does not exist');
      setFormError(message === 'Network Error' ? 'Login failed. Backend is not running or cannot reach PostgreSQL.' : message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="bp-login-page">
      <div className="bp-login-shell">
        <aside className="bp-login-identity">
          <div className="bp-access-orb">
            <span />
            <span />
            <span />
            <strong>IH</strong>
          </div>
          <p className="bp-eyebrow">Command Prism</p>
          <h1>One secure gateway for your publishing desk.</h1>
          <p>
            Review drafts, publish articles, moderate comments, and keep your content system moving
            from a focused admin workspace.
          </p>
          <div className="bp-login-stats">
            <div>
              <strong>SQL</strong>
              <span>PostgreSQL core</span>
            </div>
            <div>
              <strong>JWT</strong>
              <span>Protected admin</span>
            </div>
            <div>
              <strong>Live</strong>
              <span>Editorial tools</span>
            </div>
          </div>
        </aside>

        <div className="bp-login-card">
          <div className="bp-login-card-header">
            <p className="bp-eyebrow">Secure Access</p>
            <h2>Login</h2>
            <p>Enter your credentials to open your InsightHub publishing workspace.</p>
          </div>

          <form className="bp-login-form" onSubmit={handleSubmit} noValidate>
            <label>
              <span>Email</span>
              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) => {
                  setFormError('');
                  setEmail(event.target.value);
                }}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
              />
              {touched.email && errors.email && <small>{errors.email}</small>}
            </label>

            <label>
              <span>Password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={password}
                onChange={(event) => {
                  setFormError('');
                  setPassword(event.target.value);
                }}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
              />
              <button
                className="bp-password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide password' : 'Show password'}
              </button>
              {touched.password && errors.password && <small>{errors.password}</small>}
            </label>

            <button className="bp-login-submit" type="submit" disabled={!canSubmit || submitting}>
              {submitting ? 'Signing in...' : 'Enter dashboard'}
            </button>

            {formError && <div className="bp-form-error">{formError}</div>}

            <p className="bp-auth-switch">
              New writer? <Link to="/signup">Create an account</Link>
            </p>
            <p className="bp-auth-switch">
              Forgot password? <Link to="/forgot-password">Reset it</Link>
            </p>

          </form>
        </div>
      </div>
    </section>
  );
}
