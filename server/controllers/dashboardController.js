import { query } from '../config/database.js';

export async function getDashboardStats(req, res) {
  const { rows } = await query(`
    SELECT
      (SELECT COUNT(*)::int FROM blogs) AS total_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE status = 'published') AS published_blogs,
      (SELECT COUNT(*)::int FROM blogs WHERE status = 'draft') AS draft_blogs,
      (SELECT COUNT(*)::int FROM comments) AS total_comments,
      (SELECT COUNT(*)::int FROM comments WHERE status = 'pending') AS pending_comments
  `);

  res.json({ stats: rows[0] });
}
