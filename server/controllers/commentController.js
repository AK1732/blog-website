import { query } from '../config/database.js';
import { invalidateBlogCache } from '../middleware/cache.js';
import { loggerService } from '../services/loggerService.js';
import { commentNotFoundError, permissionError, postNotFoundError, validationError } from '../utils/appError.js';

function isNumericIdentifier(value) {
  const numericId = Number(value);
  return Number.isInteger(numericId) && String(numericId) === String(value);
}

function isUuidIdentifier(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function commentId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw validationError('Comment id must be a positive integer', 'id');
  return id;
}

async function resolveBlogIdentifier(identifier) {
  if (!identifier) throw validationError('blogId is required', 'blog_id');

  const column = isNumericIdentifier(identifier)
    ? 'id'
    : isUuidIdentifier(identifier)
      ? 'uuid'
      : 'slug';
  const value = column === 'id' ? Number(identifier) : identifier;
  const result = await query(`SELECT id, uuid FROM blogs WHERE ${column} = $1`, [value]);
  if (!result.rowCount) throw postNotFoundError('Post not found for this comment');
  return result.rows[0];
}

export async function addComment(req, res) {
  const blogIdentifier = req.params.uuid || req.params.blogId || req.body?.blog_id || req.body?.blogId;
  const { name, email, comment } = req.body || {};

  if (!name || !String(name).trim()) {
    throw validationError('name is required', 'name');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    throw validationError('valid email is required', 'email');
  }
  if (!comment || !String(comment).trim()) throw validationError('comment is required', 'comment');
  if (String(name).trim().length > 100) throw validationError('name must be 100 characters or fewer', 'name');
  if (String(email).trim().length > 100) throw validationError('email must be 100 characters or fewer', 'email');
  if (String(comment).trim().length > 10000) throw validationError('comment must be 10000 characters or fewer', 'comment');

  const blog = await resolveBlogIdentifier(blogIdentifier);

  const result = await query(
    `INSERT INTO comments (blog_id, user_id, name, email, comment, status)
     VALUES ($1, $2, $3, $4, $5, 'pending')
     RETURNING *`,
    [
      blog.id,
      req.user?.id || null,
      String(name).trim(),
      String(email).trim().toLowerCase(),
      String(comment).trim(),
    ]
  );

  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'COMMENT_CREATE',
    details: { commentId: result.rows[0].id, blogId: blog.id, blogUuid: blog.uuid },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.status(201).json({ comment: result.rows[0] });
}

export async function getCommentsForBlog(req, res) {
  const blogIdentifier = req.params.uuid || req.params.blogId;
  const blog = await resolveBlogIdentifier(blogIdentifier);

  const { rows } = await query(
    `SELECT * FROM comments
     WHERE blog_id = $1 AND status = 'approved'
     ORDER BY created_at DESC
     LIMIT 200`,
    [blog.id]
  );

  return res.json({ comments: rows });
}

export async function getAllComments(req, res) {
  const { status } = req.query || {};
  const params = [];
  let where = '';
  if (status) {
    const normalizedStatus = String(status).toLowerCase();
    if (!['pending', 'approved', 'rejected'].includes(normalizedStatus)) {
      throw validationError('status must be pending, approved, or rejected', 'status');
    }
    params.push(normalizedStatus);
    where = `WHERE co.status = $${params.length}`;
  }

  const { rows } = await query(
    `SELECT co.*, b.title AS blog_title, b.uuid AS blog_uuid
     FROM comments co
     LEFT JOIN blogs b ON b.id = co.blog_id
     ${where}
     ORDER BY co.created_at DESC`,
    params
  );
  return res.json({ comments: rows });
}

export async function approveComment(req, res) {
  const id = commentId(req.params.id);
  const result = await query("UPDATE comments SET status = 'approved' WHERE id = $1 RETURNING *", [id]);
  if (!result.rowCount) throw commentNotFoundError();
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'COMMENT_APPROVAL',
    details: { commentId: result.rows[0].id, blogId: result.rows[0].blog_id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({ comment: result.rows[0] });
}

export async function rejectComment(req, res) {
  const id = commentId(req.params.id);
  const result = await query("UPDATE comments SET status = 'rejected' WHERE id = $1 RETURNING *", [id]);
  if (!result.rowCount) throw commentNotFoundError();
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'COMMENT_REJECTION',
    details: { commentId: result.rows[0].id, blogId: result.rows[0].blog_id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({ comment: result.rows[0] });
}

export async function deleteComment(req, res) {
  const id = commentId(req.params.id);

  const current = await query('SELECT id, blog_id, user_id FROM comments WHERE id = $1', [id]);
  const comment = current.rows[0];
  if (!comment) throw commentNotFoundError();

  const canDelete = req.user?.role === 'admin' || Number(comment.user_id) === Number(req.user?.id);
  if (!canDelete) {
    throw permissionError('You can only delete your own comments');
  }

  const result = await query('DELETE FROM comments WHERE id = $1 RETURNING id, blog_id, user_id', [id]);

  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'COMMENT_DELETE',
    details: { commentId: result.rows[0].id, blogId: result.rows[0].blog_id },
    ipAddress: req.ip,
  });

  await invalidateBlogCache();
  return res.json({ message: 'Comment deleted' });
}

