import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import heroImage from '../assets/hero.png';
import { getBlog, getBlogs } from '../services/blogService';
import { addComment, getBlogComments } from '../services/commentService';
import { useToast } from '../components/ToastProvider';
import { getApiErrorMessage } from '../utils/apiError';

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
        const [commentRows, relatedRows] = await Promise.all([
          getBlogComments(id),
          getBlogs({ status: 'published', categoryId: current.category_id || undefined, limit: 4 }),
        ]);
        setComments(commentRows);
        setRelated(relatedRows.filter((item) => String(item.id) !== String(id)).slice(0, 3));
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
      await addComment({ blog_id: id, ...form });
      setForm({ name: '', email: '', comment: '' });
      showToast('Comment submitted for moderation.');
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Failed to submit comment'), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><div className="h-[520px] animate-pulse rounded-lg bg-slate-100" /></div>;
  }

  if (error) {
    return <div className="mx-auto max-w-7xl px-4 py-10"><div className="rounded-lg bg-rose-50 p-6 text-rose-700">{error}</div></div>;
  }

  if (!blog) return null;

  return (
    <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 lg:grid-cols-[1fr_360px]">
      <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <img src={blog.image || heroImage} alt="" className="h-72 w-full object-cover md:h-[420px]" />
        <div className="p-6 md:p-10">
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="rounded-full bg-blue-50 px-3 py-1 font-bold text-brand-blue">
              {blog.category_name || 'General'}
            </span>
            <span>By {blog.author_name || 'Admin'}</span>
            <span>{formatDate(blog.created_at)}</span>
          </div>
          <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">{blog.title}</h1>
          <div className="mt-8 whitespace-pre-wrap text-base leading-8 text-slate-700">{blog.content}</div>
        </div>
      </article>

      <aside className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Related Posts</h2>
          <div className="mt-4 space-y-3">
            {related.map((post) => (
              <Link key={post.id} to={`/blogs/${post.id}`} className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50">
                <p className="text-xs font-bold text-brand-purple">{post.category_name || 'General'}</p>
                <p className="mt-2 font-bold text-slate-950">{post.title}</p>
                <p className="mt-1 text-xs text-slate-500">{formatDate(post.created_at)}</p>
              </Link>
            ))}
            {!related.length && <p className="text-sm text-slate-500">No related posts yet.</p>}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-slate-950">Comments</h2>
          <div className="mt-4 space-y-3">
            {comments.map((item) => (
              <div key={item.id} className="rounded-lg bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-bold text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">{formatDate(item.created_at)}</p>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.comment}</p>
              </div>
            ))}
            {!comments.length && <p className="text-sm text-slate-500">No approved comments yet.</p>}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              placeholder="Name"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
            <input
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              required
              type="email"
              placeholder="Email"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
            <textarea
              value={form.comment}
              onChange={(event) => setForm((current) => ({ ...current, comment: event.target.value }))}
              required
              rows={4}
              placeholder="Comment"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-4 focus:ring-blue-100"
            />
            <button
              disabled={submitting}
              className="w-full rounded-lg bg-gradient-to-r from-brand-blue to-brand-purple px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
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
