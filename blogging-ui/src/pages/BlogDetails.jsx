import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import heroImage from '../assets/hero.png';
import { getBlog, getBlogs } from '../services/blogService';
import { addComment, getBlogComments } from '../services/commentService';
import { useToast } from '../components/useToast';
import { getApiErrorMessage } from '../utils/apiError';
import { getBlogPublicPath } from '../utils/blogUrls';
import '../styles/homepage.css';

function formatDate(value) {
  if (!value) return 'Unpublished';
  return new Date(value).toLocaleDateString();
}

export default function BlogDetails() {
  const { id } = useParams();
  const { showToast } = useToast();
  const [blog, setBlog] = useState(null);
  const [related, setRelated] = useState([]);
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', comment: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const current = await getBlog(id);
        setBlog(current);
        const publicIdentifier = current.uuid || current.id;
        const [commentRows, relatedRows] = await Promise.all([
          getBlogComments(publicIdentifier),
          getBlogs({ status: 'published', categoryId: current.category_id || undefined, limit: 4 }),
        ]);
        setComments(commentRows);
        setRelated(relatedRows.filter((item) => String(item.id) !== String(current.id)).slice(0, 3));
      } catch (err) {
        setError(getApiErrorMessage(err, 'Failed to load blog'));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await addComment({ blog_id: blog.id, blog_uuid: blog.uuid, ...form }, blog.uuid || blog.id);
      setForm({ name: '', email: '', comment: '' });
      showToast('Comment submitted for moderation.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to submit comment'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="bp-blog-detail"><div className="bp-blog-loading" /></div>;
  }

  if (error) {
    return <div className="bp-blog-detail"><div className="bp-blog-error">{error}</div></div>;
  }

  if (!blog) return null;

  return (
    <section className="bp-blog-detail">
      <article className="bp-blog-article">
        <img src={blog.image || heroImage} alt="" className="bp-blog-cover" />
        <div className="bp-blog-body">
          <div className="bp-blog-meta">
            <span className="bp-blog-category">
              {blog.category_name || 'General'}
            </span>
            <span>By {blog.author_name || 'Admin'}</span>
            <span>{formatDate(blog.created_at)}</span>
          </div>
          <h1>{blog.title}</h1>
          <div className="rich-blog-content" dangerouslySetInnerHTML={{ __html: blog.content }} />
        </div>
      </article>

      <aside className="bp-blog-sidebar">
        <div className="bp-blog-panel">
          <h2>Related Posts</h2>
          <div className="bp-related-list">
            {related.map((post) => (
              <Link key={post.id} to={getBlogPublicPath(post)} className="bp-related-card">
                <p>{post.category_name || 'General'}</p>
                <strong>{post.title}</strong>
                <span>{formatDate(post.created_at)}</span>
              </Link>
            ))}
            {!related.length && <p className="bp-blog-muted">No related posts yet.</p>}
          </div>
        </div>

        <div className="bp-blog-panel">
          <h2>Comments</h2>
          <div className="bp-comment-list">
            {comments.map((item) => (
              <div key={item.id} className="bp-comment-card">
                <div>
                  <strong>{item.name}</strong>
                  <span>{formatDate(item.created_at)}</span>
                </div>
                <p>{item.comment}</p>
              </div>
            ))}
            {!comments.length && <p className="bp-blog-muted">No approved comments yet.</p>}
          </div>

          <form onSubmit={handleSubmit} className="bp-comment-form">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              placeholder="Name"
            />
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              type="email"
              placeholder="Email"
            />
            <textarea
              value={form.comment}
              onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              required
              rows={4}
              placeholder="Comment"
            />
            <button
              disabled={submitting}
              type="submit"
            >
              {submitting ? 'Submitting...' : 'Submit Comment'}
            </button>
          </form>
        </div>
      </aside>
    </section>
  );
}
