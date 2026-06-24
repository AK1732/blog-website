import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useToast } from '../components/useToast';
import { register } from '../services/authService';
import { getApiErrorMessage } from '../utils/apiError';
import '../styles/homepage.css';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Signup() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const errors = useMemo(() => {
    const next = {};
    if (!form.name.trim()) next.name = 'Full name is required.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) next.confirmPassword = 'Confirm your password.';
    else if (form.password !== form.confirmPassword) next.confirmPassword = 'Passwords do not match';
    return next;
  }, [form]);

  const canSubmit = Object.keys(errors).length === 0;

  function updateField(field, value) {
    setFormError('');
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched({ name: true, email: true, password: true, confirmPassword: true });
    if (!canSubmit) return;

    setFormError('');
    setSubmitting(true);
    try {
      const result = await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      showToast(result.message || 'Account created. Please verify your email before login.');
      navigate('/login', { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err, 'Signup failed. Check that the backend and PostgreSQL are running.');
      setFormError(message === 'Network Error' ? 'Signup failed. Backend is not running or cannot reach PostgreSQL.' : message);
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
          <p className="bp-eyebrow">Writer Access</p>
          <h1>Create your publishing account.</h1>
          <p>
            Join the editorial workspace, draft articles, and submit polished posts for admin review.
          </p>
          <div className="bp-login-stats">
            <div>
              <strong>JWT</strong>
              <span>Secure sessions</span>
            </div>
            <div>
              <strong>SQL</strong>
              <span>PostgreSQL users</span>
            </div>
            <div>
              <strong>Role</strong>
              <span>Writer by default</span>
            </div>
          </div>
        </aside>

        <div className="bp-login-card">
          <div className="bp-login-card-header">
            <p className="bp-eyebrow">Create Account</p>
            <h2>Signup</h2>
            <p>New accounts start as writers and can submit posts for review.</p>
          </div>

          <form className="bp-login-form" onSubmit={handleSubmit} noValidate>
            <label>
              <span>Full Name</span>
              <input
                value={form.name}
                onChange={(event) => updateField('name', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, name: true }))}
                placeholder="Your name"
              />
              {touched.name && errors.name && <small>{errors.name}</small>}
            </label>

            <label>
              <span>Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(event) => updateField('email', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, email: true }))}
                placeholder="writer@blog.com"
              />
              {touched.email && errors.email && <small>{errors.email}</small>}
            </label>

            <label>
              <span>Password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, password: true }))}
                placeholder="Create password"
              />
              {touched.password && errors.password && <small>{errors.password}</small>}
            </label>

            <label>
              <span>Confirm Password</span>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={(event) => updateField('confirmPassword', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, confirmPassword: true }))}
                placeholder="Confirm password"
              />
              <button
                className="bp-password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
              >
                {showPassword ? 'Hide passwords' : 'Show passwords'}
              </button>
              {touched.confirmPassword && errors.confirmPassword && <small>{errors.confirmPassword}</small>}
            </label>

            <button className="bp-login-submit" type="submit" disabled={!canSubmit || submitting}>
              {submitting ? 'Creating account...' : 'Create Account'}
            </button>

            {formError && <div className="bp-form-error">{formError}</div>}

            <p className="bp-auth-switch">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
