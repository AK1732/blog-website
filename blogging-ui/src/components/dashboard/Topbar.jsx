import '../../styles/admin.css';

export default function Topbar() {
  return (
    <header className="admin-topbar">
      <div className="admin-brand compact">
        <span>BP</span>
        <div>
          <strong>Admin</strong>
          <small>Overview</small>
        </div>
      </div>
    </header>
  );
}
