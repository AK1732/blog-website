import { useState } from 'react';
import { NavLink } from 'react-router-dom';

import '../../styles/admin.css';

const items = [
  { to: '/writer', label: 'Dashboard' },
  { to: '/writer/blogs', label: 'My Blogs' },
  { to: '/writer/blogs/add', label: 'Create Blog' },
  { to: '/writer/drafts', label: 'Drafts' },
  { to: '/writer/profile', label: 'Profile' },
];

export default function WriterSidebar() {
  const [open, setOpen] = useState(false);
  let email = 'writer@insighthub.local';
  try {
    email = JSON.parse(localStorage.getItem('auth_user') || '{}')?.email || email;
  } catch {
    email = 'writer@insighthub.local';
  }

  return (
    <>
      <button
        className={`admin-sidebar-toggle ${open ? 'is-open' : ''}`}
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close writer menu' : 'Open writer menu'}
      >
        {open ? '<' : '>'}
      </button>

      {open && <button className="admin-sidebar-backdrop" type="button" onClick={() => setOpen(false)} aria-label="Close menu" />}

      <aside className={`admin-sidebar ${open ? 'is-open' : ''}`}>
        <div className="admin-brand">
          <span>IH</span>
          <div>
            <strong>InsightHub</strong>
            <small>Writer Studio</small>
          </div>
        </div>

        <nav className="admin-nav">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/writer'}
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
