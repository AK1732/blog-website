import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import WriterSidebar from '../../components/dashboard/WriterSidebar';
import { useToast } from '../../components/useToast';
import { createBlog, getBlog, submitBlog, updateBlog } from '../../services/blogService';
import { getCurrentUser } from '../../services/authService';
import { getCategories } from '../../services/categoryService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

export default function AddBlogAdmin() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const currentUser = getCurrentUser();
  const isWriter = currentUser?.role === 'writer';
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    image: '',
    category_id: '',
    status: 'draft',
  });
  const [touched, setTouched] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const categoryRows = await getCategories();
        setCategories(categoryRows);
        if (editing) {
          const blog = await getBlog(id);
          setForm({
            title: blog.title || '',
            content: blog.content || '',
            image: blog.image || '',
            category_id: blog.category_id || '',
            status: blog.status || 'draft',
          });
        }
      } catch {
        setCategories([
          { id: 'strategy', name: 'Strategy' },
          { id: 'design', name: 'Design' },
          { id: 'engineering', name: 'Engineering' },
        ]);
      }
    }

    load();
  }, [editing, id]);

  const errors = useMemo(() => {
    const next = {};
    if (!form.title.trim()) next.title = 'Title is required.';
    if (!form.content.trim()) next.content = 'Content is required.';
    return next;
  }, [form]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(action) {
    setTouched({ title: true, content: true });
    if (Object.keys(errors).length) return;
    setSaving(true);
    try {
      const status = isWriter ? 'draft' : action;
      const payload = { ...form, status, approval_status: action === 'submit' ? 'pending' : form.approval_status };
      const blog = editing ? await updateBlog(id, payload) : await createBlog(payload);
      if (action === 'submit') await submitBlog(blog.id);
      showToast(action === 'submit' ? 'Blog submitted for review.' : status === 'published' ? 'Blog published.' : 'Draft saved.');
      navigate(isWriter ? '/writer/blogs' : '/dashboard/blogs');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Could not reach API. Your draft UI is ready, but database auth may need setup.'), 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-shell">
      {isWriter ? <WriterSidebar /> : <Sidebar />}
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>{isWriter ? 'Writer workflow' : 'Publishing workflow'}</p>
              <h1>{editing ? 'Edit Blog' : 'Add Blog'}</h1>
              <span>{isWriter ? 'Write drafts and submit polished articles for admin review.' : 'Write, categorize, preview, and publish from one focused workspace.'}</span>
            </div>
            <button type="button" onClick={() => handleSubmit('draft')} disabled={saving}>
              Save draft
            </button>
          </section>

          <section className="admin-editor-layout">
            <div className="admin-editor-card">
              <label className="admin-field">
                <span>Blog Title</span>
                <input
                  value={form.title}
                  onChange={(event) => updateField('title', event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, title: true }))}
                  placeholder="Building a professional blogging workflow"
                />
                {touched.title && errors.title && <small>{errors.title}</small>}
              </label>

              <div className="admin-field-grid">
                <label className="admin-field">
                  <span>Category</span>
                  <select value={form.category_id} onChange={(event) => updateField('category_id', event.target.value)}>
                    <option value="">General</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="admin-field">
                  <span>Cover Image URL</span>
                  <input
                    value={form.image}
                    onChange={(event) => updateField('image', event.target.value)}
                    placeholder="https://images.unsplash.com/..."
                  />
                </label>
              </div>

              <label className="admin-field">
                <span>Blog Content</span>
                <textarea
                  value={form.content}
                  onChange={(event) => updateField('content', event.target.value)}
                  onBlur={() => setTouched((current) => ({ ...current, content: true }))}
                  placeholder="Write the full article here..."
                />
                {touched.content && errors.content && <small>{errors.content}</small>}
              </label>
            </div>

            <aside className="admin-publish-card">
              <div className="admin-status-pill">Draft mode</div>
              <h2>{isWriter ? 'Review Settings' : 'Publish Settings'}</h2>
              <p>{isWriter ? 'Submitted posts stay hidden until an admin approves them.' : 'Drafts stay hidden from public pages until you publish them.'}</p>

              <div className="admin-publish-actions">
                {isWriter ? (
                  <button type="button" onClick={() => handleSubmit('submit')} disabled={saving}>
                    {saving ? 'Submitting...' : 'Submit for Review'}
                  </button>
                ) : (
                  <button type="button" onClick={() => handleSubmit('published')} disabled={saving}>
                    {saving ? 'Saving...' : 'Publish Blog'}
                  </button>
                )}
                <button type="button" onClick={() => handleSubmit('draft')} disabled={saving}>
                  Save Draft
                </button>
              </div>

              <div className="admin-preview">
                <span>Live Preview</span>
                <h3>{form.title || 'Untitled blog'}</h3>
                <p>{form.content || 'Start typing to preview your article summary.'}</p>
              </div>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
