import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { getCurrentUser } from '../../services/authService';
import '../../styles/admin.css';

export default function SettingsAdmin() {
  const user = getCurrentUser();

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>Workspace preferences</p>
              <h1>Settings</h1>
              <span>Manage profile details, publishing defaults, and the admin appearance.</span>
            </div>
          </section>

          <section className="admin-settings-grid">
            <form className="admin-editor-card">
              <h2 className="admin-card-title">Profile</h2>
              <div className="admin-field-grid">
                <label className="admin-field">
                  <span>Display name</span>
                  <input defaultValue={user?.name || 'Local Publisher'} />
                </label>
                <label className="admin-field">
                  <span>Email</span>
                  <input defaultValue={user?.email || 'admin@insighthub.local'} />
                </label>
              </div>
              <label className="admin-field">
                <span>Timezone</span>
                <select defaultValue="Asia/Calcutta">
                  <option value="Asia/Calcutta">Asia/Calcutta</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </label>
              <button className="admin-save-button" type="button">Save Preferences</button>
            </form>

            <aside className="admin-publish-card">
              <div className="admin-status-pill">Appearance</div>
              <h2>InsightHub Glass</h2>
              <p>Dark premium interface with blue and purple accents for publishing workflows.</p>
              <div className="admin-theme-swatch" />
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
