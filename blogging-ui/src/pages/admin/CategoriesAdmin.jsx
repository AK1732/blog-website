import { useEffect, useState } from 'react';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { useToast } from '../../components/useToast';
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '../../services/categoryService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

export default function CategoriesAdmin() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setCategories(await getCategories());
    } catch {
      setCategories([
        { id: 'strategy', name: 'Strategy', created_at: new Date().toISOString() },
        { id: 'design', name: 'Design', created_at: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!name.trim()) return;
    try {
      if (editing) await updateCategory(editing.id, { name });
      else await createCategory({ name });
      showToast(editing ? 'Category updated.' : 'Category created.');
      setName('');
      setEditing(null);
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to save category'), 'error');
    }
  }

  async function handleDelete(category) {
    if (!confirm(`Delete "${category.name}"?`)) return;
    try {
      await deleteCategory(category.id);
      showToast('Category deleted.');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete category'), 'error');
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
              <p>Editorial taxonomy</p>
              <h1>Categories</h1>
              <span>Create and manage article categories for a cleaner content library.</span>
            </div>
          </section>

          <form className="admin-inline-form" onSubmit={handleSubmit}>
            <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Category name" />
            <button>{editing ? 'Update Category' : 'Add Category'}</button>
          </form>

          <section className="admin-card-grid">
            {categories.map((category) => (
              <article key={category.id} className="admin-category-card">
                <small>Category</small>
                <h2>{category.name}</h2>
                <p>{category.created_at ? new Date(category.created_at).toLocaleDateString() : 'Local category'}</p>
                <div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(category);
                      setName(category.name);
                    }}
                  >
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(category)}>Delete</button>
                </div>
              </article>
            ))}
            {!categories.length && !loading && <div className="admin-empty">No categories yet.</div>}
          </section>
        </main>
      </div>
    </div>
  );
}
