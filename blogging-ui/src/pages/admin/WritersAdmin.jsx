import { useEffect, useState } from 'react';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { useToast } from '../../components/useToast';
import { createUser, deleteUser, getUsers, updateUser } from '../../services/userService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

const emptyForm = { name: '', email: '', password: '', role: 'writer' };

export default function WritersAdmin() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);

  async function load() {
    setUsers(await getUsers());
  }

  useEffect(() => {
    load().catch((err) => showToast(getApiErrorMessage(err, 'Failed to load users'), 'error'));
  }, [showToast]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (editing) await updateUser(editing.id, form.password ? form : { ...form, password: undefined });
      else await createUser(form);
      showToast(editing ? 'Writer updated.' : 'Writer created.');
      setForm(emptyForm);
      setEditing(null);
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to save writer'), 'error');
    }
  }

  async function handleDelete(user) {
    if (!confirm(`Delete ${user.name}?`)) return;
    try {
      await deleteUser(user.id);
      showToast('Writer deleted.');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete writer'), 'error');
    }
  }

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>User operations</p>
              <h1>Writers</h1>
              <span>Create, edit, and remove writer accounts from the admin console.</span>
            </div>
          </section>

          <form className="admin-inline-form" onSubmit={handleSubmit}>
            <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Writer name" />
            <input value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} placeholder="Email" />
            <input value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} placeholder={editing ? 'New password optional' : 'Password'} type="password" />
            <button>{editing ? 'Update Writer' : 'Create Writer'}</button>
          </form>

          <section className="admin-table-card">
            <div className="admin-post-list">
              {users.map((user) => (
                <article key={user.id}>
                  <div>
                    <h3>{user.name}</h3>
                    <p>{user.email} / {user.role}</p>
                  </div>
                  <span>{user.role}</span>
                  <div className="admin-row-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(user);
                        setForm({ name: user.name, email: user.email, password: '', role: user.role });
                      }}
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDelete(user)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
