import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { useToast } from '../../components/useToast';
import { deleteBlog, getBlogs, publishBlog } from '../../services/blogService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

export default function BlogManagementAdmin() {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async function load() {
    setLoading(true);
    try {
      setBlogs(await getBlogs({ q: q || undefined, status: status || undefined }));
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load blogs'), 'error');
    } finally {
      setLoading(false);
    }
  }, [q, showToast, status]);

  useEffect(() => {
    load();
  }, [load]);

  async function handlePublish(id) {
    try {
      await publishBlog(id);
      showToast('Blog published.');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to publish blog'), 'error');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this blog?')) return;
    try {
      await deleteBlog(id);
      showToast('Blog deleted.');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to delete blog'), 'error');
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
              <p>Content operations</p>
              <h1>Blog Management</h1>
              <span>Create, edit, publish, draft, and delete posts from a polished workspace.</span>
            </div>
            <Link className="admin-heading-link" to="/dashboard/blogs/add">New Blog</Link>
          </section>

          <section className="admin-table-card">
            <div className="admin-controls">
              <input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search posts..." />
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="admin-post-list">
              {blogs.map((blog) => (
                <article key={blog.id}>
                  <div>
                    <h3>{blog.title}</h3>
                    <p>{blog.category_name || 'General'} / {blog.author_name || 'Admin'} / {new Date(blog.created_at).toLocaleDateString()}</p>
                  </div>
                  <span>{blog.status || 'draft'}</span>
                  <div className="admin-row-actions">
                    <Link to={`/dashboard/blogs/${blog.id}/edit`}>Edit</Link>
                    {blog.status !== 'published' && <button onClick={() => handlePublish(blog.id)}>Publish</button>}
                    <button onClick={() => handleDelete(blog.id)}>Delete</button>
                  </div>
                </article>
              ))}
              {!blogs.length && !loading && <div className="admin-empty">No blogs found. Create your first article.</div>}
              {loading && <div className="admin-empty">Loading blogs...</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
