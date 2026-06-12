import { useEffect, useState } from 'react';

import Topbar from '../../components/dashboard/Topbar';
import WriterSidebar from '../../components/dashboard/WriterSidebar';
import { useToast } from '../../components/useToast';
import { getProfile, updateProfile } from '../../services/userService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

export default function WriterProfile() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '' });

  useEffect(() => {
    getProfile()
      .then((user) => setForm({ name: user.name || '', email: user.email || '', password: '' }))
      .catch((err) => showToast(getApiErrorMessage(err, 'Failed to load profile'), 'error'));
  }, [showToast]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const user = await updateProfile(form.password ? form : { ...form, password: undefined });
      localStorage.setItem('auth_user', JSON.stringify(user));
      setForm((current) => ({ ...current, password: '' }));
      showToast('Profile updated.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to update profile'), 'error');
    }
  }

  return (
    <div className="admin-shell">
      <WriterSidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>Writer account</p>
              <h1>Profile</h1>
              <span>Manage your writer identity and login details.</span>
            </div>
          </section>

          <form className="admin-editor-card" onSubmit={handleSubmit}>
            <div className="admin-field-grid">
              <label className="admin-field">
                <span>Name</span>
                <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
              </label>
              <label className="admin-field">
                <span>Email</span>
                <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
              </label>
            </div>
            <label className="admin-field">
              <span>New Password</span>
              <input type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder="Leave blank to keep current password" />
            </label>
            <button className="admin-save-button">Save Profile</button>
          </form>
        </main>
      </div>
    </div>
  );
}
