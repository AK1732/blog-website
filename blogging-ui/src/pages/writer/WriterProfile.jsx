import { useEffect, useState } from 'react';

import Topbar from '../../components/dashboard/Topbar';
import WriterSidebar from '../../components/dashboard/WriterSidebar';
import { useToast } from '../../components/useToast';
import { getProfile, updateProfile } from '../../services/userService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function WriterProfile() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', bio: '', profile_image: '' });
  const [stats, setStats] = useState({ total_blogs: 0, published_blogs: 0 });

  useEffect(() => {
    getProfile()
      .then((user) => {
        setForm({
          name: user.name || '',
          email: user.email || '',
          password: '',
          bio: user.bio || '',
          profile_image: user.profile_image || '',
        });
        setStats({
          total_blogs: user.total_blogs || 0,
          published_blogs: user.published_blogs || 0,
        });
      })
      .catch((err) => showToast(getApiErrorMessage(err, 'Failed to load profile'), 'error'));
  }, [showToast]);

  async function handleImageFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Choose an image file.', 'error');
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setForm((current) => ({ ...current, profile_image: dataUrl }));
  }

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
            <div className="admin-profile-strip">
              {form.profile_image ? <img src={form.profile_image} alt="" /> : <div>{form.name.slice(0, 1) || 'W'}</div>}
              <span>Total blogs: {stats.total_blogs}</span>
              <span>Published blogs: {stats.published_blogs}</span>
            </div>
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
              <span>Bio</span>
              <textarea rows={4} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
            </label>
            <label className="admin-field">
              <span>Profile Image</span>
              <input value={form.profile_image} onChange={(event) => setForm((current) => ({ ...current, profile_image: event.target.value }))} placeholder="Paste image URL or upload below" />
              <input type="file" accept="image/*" onChange={handleImageFile} />
            </label>
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
