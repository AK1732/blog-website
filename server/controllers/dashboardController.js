import { query } from '../config/database.js';

export async function getAdminDashboardStats(req, res) {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM blogs) AS total_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE status = 'published') AS published_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE approval_status = 'pending') AS pending_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE status = 'draft') AS draft_blogs,
      (SELECT COUNT(*)::int FROM users WHERE role = 'writer') AS total_writers,
      (SELECT COUNT(*)::int FROM comments) AS total_comments,
      (SELECT COUNT(*)::int FROM comments WHERE status = 'pending') AS pending_comments
  `);

  res.json({ stats: rows[0] });
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
