import { NavLink, useNavigate } from 'react-router-dom';

import { logout } from '../services/authService';
import { getToken } from '../utils/authStorage';
import '../styles/homepage.css';

function NavItem({ to, label }) {
  return (
    <NavLink to={to} className={({ isActive }) => `bp-nav-link ${isActive ? 'is-active' : ''}`}>
      {label}
    </NavLink>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const signedIn = Boolean(getToken());

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <header className="bp-navbar">
      <div className="bp-navbar-inner">
        <NavLink to="/" className="bp-brand">
          <span className="bp-brand-mark">BP</span>
          <span>
            <strong>BluePurple Blog</strong>
            <small>Publishing platform</small>
          </span>
        </NavLink>

        <nav className="bp-nav-menu">
          <NavItem to="/" label="Home" />
          <NavItem to="/blogs" label="Articles" />
          {signedIn && <NavItem to="/dashboard" label="Dashboard" />}
        </nav>

        <div className="bp-nav-actions">
          {signedIn ? (
            <>
              <NavLink className="bp-nav-cta" to="/dashboard/blogs/add">
                New article
              </NavLink>
              <button className="bp-nav-ghost" type="button" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <NavLink className="bp-nav-cta" to="/login">
              Login
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
