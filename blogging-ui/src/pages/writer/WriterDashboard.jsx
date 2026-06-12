import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import Topbar from '../../components/dashboard/Topbar';
import WriterSidebar from '../../components/dashboard/WriterSidebar';
import { getBlogs } from '../../services/blogService';
import { getWriterDashboardStats } from '../../services/dashboardService';
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

export default function WriterDashboard() {
  const [stats, setStats] = useState(null);
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [nextStats, nextBlogs] = await Promise.all([
          getWriterDashboardStats().catch(() => null),
          getBlogs({ mine: true, limit: 5 }),
        ]);
        setStats(nextStats);
        setBlogs(nextBlogs);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="admin-shell">
      <WriterSidebar />
      <div className="admin-main">
        <Topbar />
        <main className="admin-content">
          <section className="admin-page-heading">
            <div>
              <p>Writer workspace</p>
              <h1>Dashboard</h1>
              <span>Track your drafts, published work, and articles waiting for review.</span>
            </div>
            <Link className="admin-heading-link" to="/writer/blogs/add">Create blog</Link>
          </section>

          <section className="admin-metric-grid">
            <MetricCard label="Total Blogs" value={loading ? '-' : stats?.total_blogs ?? 0} tone="tone-blue" />
            <MetricCard label="Published" value={loading ? '-' : stats?.published_blogs ?? 0} tone="tone-green" />
            <MetricCard label="Draft Blogs" value={loading ? '-' : stats?.draft_blogs ?? 0} tone="tone-purple" />
            <MetricCard label="Pending Review" value={loading ? '-' : stats?.pending_review ?? 0} tone="tone-slate" />
          </section>

          <section className="admin-table-card">
            <div className="admin-table-header">
              <div>
                <h2>Recent Work</h2>
                <p>Your newest drafts and submitted posts.</p>
              </div>
              <Link to="/writer/blogs">Manage all</Link>
            </div>
            <div className="admin-post-list">
              {blogs.map((blog) => (
                <article key={blog.id}>
                  <div>
                    <h3>{blog.title}</h3>
                    <p>{blog.category_name || 'General'} / {blog.approval_status || 'pending'}</p>
                  </div>
                  <span>{blog.status || 'draft'}</span>
                </article>
              ))}
              {!blogs.length && !loading && <div className="admin-empty">No blogs yet. Start a new draft.</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
