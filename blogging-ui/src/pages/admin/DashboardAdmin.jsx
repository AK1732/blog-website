import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import Sidebar from '../../components/dashboard/Sidebar';
import Topbar from '../../components/dashboard/Topbar';
import { getBlogs } from '../../services/blogService';
import { getDashboardStats } from '../../services/dashboardService';
import '../../styles/admin.css';

function MetricCard({ label, value, tone }) {
  return (
    <motion.div
      className="admin-metric-card"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.36, ease: 'easeOut' }}
      whileHover={{ y: -7, scale: 1.025, rotateX: 2.5, rotateY: -1.5 }}
    >
      <span className={tone} />
      <p>{label}</p>
      <strong>{value}</strong>
    </motion.div>
  );
}

export default function DashboardAdmin() {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState({ posts_per_month: [], user_registrations: [], most_viewed_posts: [] });
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [nextStats, nextBlogs] = await Promise.all([
          getDashboardStats().catch(() => null),
          getBlogs({ limit: 5 }),
        ]);
        setStats(nextStats?.stats || nextStats);
        setCharts(nextStats?.charts || { posts_per_month: [], user_registrations: [], most_viewed_posts: [] });
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
          <motion.section
            className="admin-page-heading admin-glass-panel"
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
          >
            <div>
              <p>Overview</p>
              <h1>Dashboard</h1>
              <span>Track publishing activity, drafts, and recent content from one clean workspace.</span>
            </div>
            <Link className="admin-heading-link" to="/dashboard/blogs/add">
              New article
            </Link>
          </motion.section>

          <section className="admin-metric-grid">
            <MetricCard label="Total Blogs" value={loading ? '-' : totalBlogs} tone="tone-blue" />
            <MetricCard label="Published" value={loading ? '-' : publishedBlogs} tone="tone-green" />
            <MetricCard label="Pending Blogs" value={loading ? '-' : stats?.pending_blogs ?? draftBlogs} tone="tone-purple" />
            <MetricCard label="Writers" value={loading ? '-' : stats?.total_writers ?? 0} tone="tone-slate" />
            <MetricCard label="Comments" value={loading ? '-' : stats?.total_comments ?? 0} tone="tone-blue" />
            <MetricCard label="Users" value={loading ? '-' : stats?.total_users ?? 0} tone="tone-green" />
            <MetricCard label="Categories" value={loading ? '-' : stats?.total_categories ?? 0} tone="tone-purple" />
            <MetricCard label="Tags" value={loading ? '-' : stats?.total_tags ?? 0} tone="tone-slate" />
          </section>

          <section className="admin-analytics-grid">
            <div className="admin-table-card">
              <div className="admin-table-header"><h2>Posts per month</h2></div>
              <div className="admin-mini-chart">
                {charts.posts_per_month.map((item) => (
                  <div key={item.month}>
                    <span>{item.month}</span>
                    <strong style={{ width: `${Math.max(item.count * 18, 14)}px` }} />
                    <em>{item.count}</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-table-card">
              <div className="admin-table-header"><h2>User registrations</h2></div>
              <div className="admin-mini-chart">
                {charts.user_registrations.map((item) => (
                  <div key={item.month}>
                    <span>{item.month}</span>
                    <strong style={{ width: `${Math.max(item.count * 18, 14)}px` }} />
                    <em>{item.count}</em>
                  </div>
                ))}
              </div>
            </div>
            <div className="admin-table-card">
              <div className="admin-table-header"><h2>Most viewed posts</h2></div>
              <div className="admin-post-list">
                {charts.most_viewed_posts.map((post) => (
                  <article key={post.id}>
                    <div><h3>{post.title}</h3></div>
                    <span>{post.view_count || 0} views</span>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <motion.section
            className="admin-table-card admin-glass-panel"
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.42, ease: 'easeOut' }}
          >
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
          </motion.section>
        </main>
      </div>
    </div>
  );
}
