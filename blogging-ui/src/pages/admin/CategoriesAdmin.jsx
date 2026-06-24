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
import { createTag, getTags } from '../../services/tagService';
import { getApiErrorMessage, getApiFieldError } from '../../utils/apiError';
import '../../styles/admin.css';

export default function CategoriesAdmin() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState([]);
  const [tagName, setTagName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [loadError, setLoadError] = useState('');

  async function load() {
    setLoading(true);
    setLoadError('');
    try {
      setCategories(await getCategories());
      setTags(await getTags());
    } catch (err) {
      setCategories([]);
      setTags([]);
      setLoadError(getApiErrorMessage(err, 'Could not load categories from the database.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleTagSubmit(event) {
    event.preventDefault();
    if (!tagName.trim()) return;
    try {
      await createTag({ name: tagName });
      showToast('Tag created.');
      setTagName('');
      setTags(await getTags());
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to save tag'), 'error');
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setCategoryError('');
    if (!name.trim()) {
      setCategoryError('Category name is required');
      return;
    }
    try {
      if (editing) await updateCategory(editing.id, { name });
      else await createCategory({ name });
      showToast(editing ? 'Category updated.' : 'Category created.');
      setName('');
      setEditing(null);
      load();
    } catch (err) {
      const fieldError = getApiFieldError(err);
      if (fieldError?.field === 'name') setCategoryError(fieldError.message);
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
            <label className="admin-field">
              <span>Category name</span>
              <input
                value={name}
                onChange={(event) => {
                  setCategoryError('');
                  setName(event.target.value);
                }}
                placeholder="Category name"
              />
              {categoryError && <small>{categoryError}</small>}
            </label>
            <button>{editing ? 'Update Category' : 'Add Category'}</button>
          </form>

          {editing && (
            <button
              className="admin-save-button"
              type="button"
              onClick={() => {
                setEditing(null);
                setName('');
                setCategoryError('');
              }}
            >
              Cancel editing
            </button>
          )}

          {loadError && <div className="admin-empty">{loadError}</div>}

          <form className="admin-inline-form" onSubmit={handleTagSubmit}>
            <input value={tagName} onChange={(event) => setTagName(event.target.value)} placeholder="Tag name" />
            <button>Add Tag</button>
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

          <section className="admin-card-grid">
            {tags.map((tag) => (
              <article key={tag.id} className="admin-category-card">
                <small>Tag</small>
                <h2>{tag.name}</h2>
                <p>{tag.slug}</p>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  );
}
