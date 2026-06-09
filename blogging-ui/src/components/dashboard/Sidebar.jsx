import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import '../../styles/admin.css';

const items = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/dashboard/blogs', label: 'Blog Management' },
  { to: '/dashboard/blogs/add', label: 'Add Blog' },
  { to: '/dashboard/categories', label: 'Categories' },
  { to: '/dashboard/comments', label: 'Comments' },
  { to: '/dashboard/settings', label: 'Settings' },
];

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  let email = 'demo@bluepurple.local';
  try {
    email = JSON.parse(localStorage.getItem('auth_user') || '{}')?.email || email;
  } catch {
    email = 'demo@bluepurple.local';
  }

  return (
    <>
      <button
        className={`admin-sidebar-toggle ${open ? 'is-open' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close admin menu' : 'Open admin menu'}
      >
        {open ? '<' : '>'}
      </button>

      {open && <button className="admin-sidebar-backdrop" type="button" onClick={() => setOpen(false)} aria-label="Close menu" />}

      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <span>BP</span>
          <div>
            <strong>BluePurple</strong>
            <small>Admin Console</small>
          </div>
        </div>

        <nav className="admin-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/dashboard'}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'is-active' : ''}`}
              onClick={() => setOpen(false)}
            >
              <i />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-user-card">
          <small>Signed in as</small>
          <strong>{email}</strong>
        </div>
      </aside>
    </>
  );
}
