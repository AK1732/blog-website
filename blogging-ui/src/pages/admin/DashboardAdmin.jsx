import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { getBlogs } from '../../services/blogService';
import { getDashboardStats } from '../../services/dashboardService';
import '../../styles/admin.css';

function MetricCard({ label, value, tone }) {
  return (
    <div className="admin-metric-card">
      <span className={tone} />
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [nextStats, nextBlogs] = await Promise.all([
          getDashboardStats().catch(() => null),
          getBlogs({ limit: 5 }),
        ]);
        setStats(nextStats);
        setBlogs(nextBlogs);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalBlogs = stats?.total_blogs ?? blogs.length;
  const publishedBlogs = stats?.published_blogs ?? blogs.filter((blog) => blog.status === 'published').length;
  const draftBlogs = stats?.draft_blogs ?? blogs.filter((blog) => blog.status !== 'published').length;

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>Overview</p>
              <h1>Dashboard</h1>
              <span>Track publishing activity, drafts, and recent content from one clean workspace.</span>
            </div>
            <Link className="admin-heading-link" to="/dashboard/blogs/add">
              New article
            </Link>
          </section>

          <section className="admin-metric-grid">
            <MetricCard label="Total Blogs" value={loading ? '-' : totalBlogs} tone="tone-blue" />
            <MetricCard label="Published" value={loading ? '-' : publishedBlogs} tone="tone-green" />
            <MetricCard label="Drafts" value={loading ? '-' : draftBlogs} tone="tone-purple" />
            <MetricCard label="Comments" value={loading ? '-' : stats?.total_comments ?? 0} tone="tone-slate" />
          </section>

          <section className="admin-table-card">
            <div className="admin-table-header">
              <div>
                <h2>Recent Posts</h2>
                <p>Newest content across local drafts and backend posts.</p>
              </div>
              <Link to="/dashboard/blogs">Manage all</Link>
            </div>

            <div className="admin-post-list">
              {blogs.map((blog) => (
                <article key={blog.id}>
                  <div>
                    <h3>{blog.title}</h3>
                    <p>{blog.category_name || 'General'} / {blog.author_name || 'Admin'}</p>
                  </div>
                  <span>{blog.status || 'draft'}</span>
                </article>
              ))}
              {!blogs.length && !loading && (
                <div className="admin-empty">
                  No posts yet. Create your first article from the Add Blog page.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
