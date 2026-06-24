import { Link } from 'react-router-dom';

import '../styles/homepage.css';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bp-footer">
      <div className="bp-footer-inner">
        <div className="bp-footer-brand">
          <span className="bp-brand-mark">IH</span>
          <div>
            <strong>InsightHub</strong>
            <p>Premium publishing workflows for modern editorial teams.</p>
          </div>
        </div>

        <div className="bp-footer-links">
          <Link to="/blogs">Articles</Link>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/login">Admin login</Link>
          <span>© {year}</span>
        </div>
      </div>
    </footer>
  );
}
