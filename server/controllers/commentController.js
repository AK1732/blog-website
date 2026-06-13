import { query } from '../config/database.js';
import { loggerService } from '../services/loggerService.js';

export async function addComment(req, res) {
  const blogId = req.params.blogId || req.body?.blog_id || req.body?.blogId;
  const { name, email, comment } = req.body || {};

  if (!blogId) return res.status(400).json({ message: 'blogId is required' });
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'name is required' });
  }
  if (!email || !String(email).includes('@')) {
    return res.status(400).json({ message: 'valid email is required' });
  }
  if (!comment || !String(comment).trim()) return res.status(400).json({ message: 'comment is required' });

  const result = await query(
    `INSERT INTO comments (blog_id, name, email, comment, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [blogId, String(name).trim(), String(email).trim().toLowerCase(), String(comment).trim()]
  );

  return res.status(201).json({ comment: result.rows[0] });
}

export async function getCommentsForBlog(req, res) {
  const { blogId } = req.params;

  const { rows } = await query(
    `SELECT * FROM comments
     WHERE blog_id = $1 AND status = 'approved'
     ORDER BY created_at DESC
     LIMIT 200`,
    [blogId]
  );

  return res.json({ comments: rows });
}

export async function getAllComments(req, res) {
  const { status } = req.query || {};
  const params = [];
  let where = '';
  if (status) {
    params.push(String(status).toLowerCase());
    where = `WHERE co.status = $${params.length}`;
  }

  const { rows } = await query(
    `SELECT co.*, b.title AS blog_title
     FROM comments co
     LEFT JOIN blogs b ON b.id = co.blog_id
     ${where}
     ORDER BY co.created_at DESC`,
    params
  );
  return res.json({ comments: rows });
}

export async function approveComment(req, res) {
  const { id } = req.params;
  const result = await query("UPDATE comments SET status = 'approved' WHERE id = $1 RETURNING *", [id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Comment not found' });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'COMMENT_APPROVAL',
    details: { commentId: result.rows[0].id, blogId: result.rows[0].blog_id },
    ipAddress: req.ip,
  });
  return res.json({ comment: result.rows[0] });
}

export async function rejectComment(req, res) {
  const { id } = req.params;
  const result = await query("UPDATE comments SET status = 'rejected' WHERE id = $1 RETURNING *", [id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Comment not found' });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'COMMENT_REJECTION',
    details: { commentId: result.rows[0].id, blogId: result.rows[0].blog_id },
    ipAddress: req.ip,
  });
  return res.json({ comment: result.rows[0] });
}

export async function deleteComment(req, res) {
  const { id } = req.params;

  const result = await query('DELETE FROM comments WHERE id = $1 RETURNING id', [id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Comment not found' });

  return res.json({ message: 'Comment deleted' });
}

