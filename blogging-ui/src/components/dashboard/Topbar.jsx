import '../../styles/admin.css';
import { getCurrentUser } from '../../services/authService';

export default function Topbar() {
  const user = getCurrentUser();
  const label = user?.role === 'writer' ? 'Writer' : 'Admin';

  return (
    <header className="admin-topbar">
      <div className="admin-brand compact">
        <span>IH</span>
        <div>
          <strong>{label}</strong>
          <small>Overview</small>
        </div>
      </div>
    </header>
  );
}
