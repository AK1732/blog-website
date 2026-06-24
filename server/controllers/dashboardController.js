import { query } from '../config/database.js';

export async function getAdminDashboardStats(req, res) {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM blogs) AS total_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE status = 'published') AS published_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE approval_status = 'pending') AS pending_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE status = 'draft') AS draft_blogs,
      (SELECT COUNT(*)::int FROM users) AS total_users,
      (SELECT COUNT(*)::int FROM users WHERE role = 'writer') AS total_writers,
      (SELECT COUNT(*)::int FROM comments) AS total_comments,
      (SELECT COUNT(*)::int FROM comments WHERE status = 'pending') AS pending_comments,
      (SELECT COUNT(*)::int FROM categories) AS total_categories,
      (SELECT COUNT(*)::int FROM tags) AS total_tags
  `);

  const [postsPerMonth, registrations, mostViewed] = await Promise.all([
    query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM blogs
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `),
    query(`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS month, COUNT(*)::int AS count
      FROM users
      GROUP BY month
      ORDER BY month DESC
      LIMIT 12
    `),
    query(`
      SELECT id, title, slug, view_count
      FROM blogs
      ORDER BY view_count DESC, created_at DESC
      LIMIT 5
    `),
  ]);

  res.json({
    stats: rows[0],
    charts: {
      posts_per_month: postsPerMonth.rows.reverse(),
      user_registrations: registrations.rows.reverse(),
      most_viewed_posts: mostViewed.rows,
    },
  });
}

export async function getWriterDashboardStats(req, res) {
  const { rows } = await query(
    `
      SELECT
        (SELECT COUNT(*)::int FROM blogs WHERE author_id = $1) AS total_blogs,
        (SELECT COUNT(*)::int FROM blogs WHERE author_id = $1 AND status = 'published') AS published_blogs,
        (SELECT COUNT(*)::int FROM blogs WHERE author_id = $1 AND status = 'draft') AS draft_blogs,
        (SELECT COUNT(*)::int FROM blogs WHERE author_id = $1 AND approval_status = 'pending') AS pending_review
    `,
    [req.user.id]
  );

  res.json({ stats: rows[0] });
}
