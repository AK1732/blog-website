import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Topbar from '../../components/dashboard/Topbar';
import WriterSidebar from '../../components/dashboard/WriterSidebar';
import { useToast } from '../../components/useToast';
import { deleteBlog, getBlogs, submitBlog } from '../../services/blogService';
import { getApiErrorMessage } from '../../utils/apiError';
import '../../styles/admin.css';

export default function WriterBlogs({ draftsOnly = false }) {
  const { showToast } = useToast();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async function load() {
    setLoading(true);
    try {
      setBlogs(await getBlogs({ mine: true, status: draftsOnly ? 'draft' : undefined }));
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to load blogs'), 'error');
    } finally {
      setLoading(false);
    }
  }, [draftsOnly, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSubmitReview(id) {
    try {
      await submitBlog(id);
      showToast('Blog submitted for review.');
      load();
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to submit blog'), 'error');
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
      <WriterSidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>{draftsOnly ? 'Draft management' : 'Writing queue'}</p>
              <h1>{draftsOnly ? 'Drafts' : 'My Blogs'}</h1>
              <span>Manage your articles, drafts, and review submissions.</span>
            </div>
            <Link className="admin-heading-link" to="/writer/blogs/add">Create Blog</Link>
          </section>

          <section className="admin-table-card">
            <div className="admin-post-list">
              {blogs.map((blog) => (
                <article key={blog.id}>
                  <div>
                    <h3>{blog.title}</h3>
                    <p>{blog.category_name || 'General'} / {new Date(blog.created_at).toLocaleDateString()}</p>
                  </div>
                  <span>{blog.approval_status || 'pending'}</span>
                  <div className="admin-row-actions">
                    <Link to={`/writer/blogs/${blog.id}/edit`}>Edit</Link>
                    {blog.approval_status !== 'approved' && <button onClick={() => handleSubmitReview(blog.id)}>Submit</button>}
                    <button onClick={() => handleDelete(blog.id)}>Delete</button>
                  </div>
                </article>
              ))}
              {!blogs.length && !loading && <div className="admin-empty">No blogs found.</div>}
              {loading && <div className="admin-empty">Loading blogs...</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
