import { useEffect, useMemo, useState } from 'react';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { fetchBlogs, deleteBlog, updateBlog } from '../../api/blogs';
import { getApiErrorMessage } from '../../utils/apiError';

function statusPill(status) {
  if (status === 'Published') return 'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20';
  if (status === 'Draft') return 'bg-brand-purple/10 text-brand-purple ring-brand-purple/20';
  return 'bg-blue-500/10 text-blue-700 ring-blue-500/20';
}

function BlogRow({ blog, onDelete, onPublishToggle }) {
  const isPublished = blog.status === 'Published';

  return (
    <tr className="hover:bg-white/50 dark:hover:bg-white/5 transition">
      <td className="py-4 px-4">
        <div className="font-semibold text-slate-900 dark:text-white">{blog.title}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{blog.category || '—'}</div>
      </td>
      <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-200">{blog.author || '—'}</td>
      <td className="py-4 px-4 text-sm">
        <span className={`inline-flex items-center px-3 py-1 rounded-full ring-1 ${statusPill(blog.status)}`}>{blog.status}</span>
      </td>
      <td className="py-4 px-4 text-sm text-slate-700 dark:text-slate-200">{new Date(blog.createdAt).toLocaleDateString()}</td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <button
            className="h-10 px-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-sm hover:shadow-md transition"
            type="button"
            onClick={() => onPublishToggle(blog)}
          >
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>

          <button
            className="h-10 px-3 rounded-xl text-xs font-semibold bg-white/60 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-slate-800 dark:text-white hover:bg-white/90 dark:hover:bg-white/10 transition"
            type="button"
            disabled
            title="Edit UI not wired yet"
          >
            Edit
          </button>

          <button
            className="h-10 px-3 rounded-xl text-xs font-semibold bg-red-500/10 text-red-700 ring-1 ring-red-500/20 hover:bg-red-500/15 transition"
            type="button"
            onClick={() => onDelete(blog._id)}
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function BlogsAdmin() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState('');

  const params = useMemo(() => ({
    q: q.trim() ? q.trim() : undefined,
    status: status || undefined,
  }), [q, status]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchBlogs(params);
        if (!mounted) return;
        setBlogs(data?.blogs || []);
      } catch (err) {
        if (mounted) setError(getApiErrorMessage(err, 'Failed to fetch blogs'));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [params]);

  const onDelete = async (id) => {
    const ok = window.confirm('Delete this blog?');
    if (!ok) return;

    setDeletingId(id);
    setError('');
    try {
      await deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Delete failed'));
    } finally {
      setDeletingId('');
    }
  };

  const onPublishToggle = async (blog) => {
    setError('');
    const nextStatus = blog.status === 'Published' ? 'Draft' : 'Published';
    const confirmMsg = blog.status === 'Published' ? 'Unpublish this blog?' : 'Publish this blog?';
    const ok = window.confirm(confirmMsg);
    if (!ok) return;

    try {
      const updated = await updateBlog(blog._id, { status: nextStatus });
      setBlogs((prev) => prev.map((b) => (b._id === blog._id ? updated.blog : b)));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Publish toggle failed'));
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar />
      <Topbar />

      <div className="md:ml-64 pt-16 md:pt-0">
        <div className="px-4 md:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Blogs</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Manage your posts with backend CRUD.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                className="h-11 w-full sm:w-72 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 px-4 outline-none focus:ring-2 focus:ring-brand-purple/30"
                placeholder="Search blogs…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select
                className="hidden sm:block h-11 rounded-xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-white/5 px-3 outline-none"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="Published">Published</option>
                <option value="Draft">Draft</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200/60 bg-red-50/60 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          ) : null}

          <div className="mt-6 rounded-3xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="text-sm text-slate-600 dark:text-slate-300">
                {loading ? 'Loading…' : `${blogs.length} post(s)`}
              </div>
            </div>

            <div className="overflow-auto rounded-2xl ring-1 ring-slate-200/70 dark:ring-white/10">
              <table className="min-w-full">
                <thead className="bg-slate-50/70 dark:bg-white/5">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">Blog</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">Author</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-600 dark:text-slate-300">Created</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="py-6 px-4" colSpan={5}>
                        <div className="text-sm text-slate-600 dark:text-slate-300">Fetching blogs…</div>
                      </td>
                    </tr>
                  ) : blogs.length === 0 ? (
                    <tr>
                      <td className="py-6 px-4" colSpan={5}>
                        <div className="text-sm text-slate-600 dark:text-slate-300">No blogs found.</div>
                      </td>
                    </tr>
                  ) : (
                    blogs.map((blog) => (
                      <BlogRow
                        key={blog._id}
                        blog={blog}
                        onDelete={(id) => onDelete(id)}
                        onPublishToggle={onPublishToggle}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {deletingId ? (
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Deleting…</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}


