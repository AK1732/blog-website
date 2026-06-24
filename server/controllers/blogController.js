import { query } from '../config/database.js';
import { invalidateBlogCache } from '../middleware/cache.js';
import { loggerService } from '../services/loggerService.js';
import { databaseError, postNotFoundError, permissionError, validationError } from '../utils/appError.js';

const blogSelect = `
  SELECT
    b.id,
    b.uuid,
    b.title,
    b.slug,
    b.content,
    b.image,
    b.is_featured,
    b.view_count,
    b.category_id,
    c.name AS category_name,
    b.author_id,
    u.name AS author_name,
    COALESCE((
      SELECT json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug) ORDER BY t.name)
      FROM blog_tags bt
      JOIN tags t ON t.id = bt.tag_id
      WHERE bt.blog_id = b.id
    ), '[]'::json) AS tags,
    b.status,
    b.approval_status,
    b.created_at,
    b.updated_at
  FROM blogs b
  LEFT JOIN categories c ON c.id = b.category_id
  LEFT JOIN users u ON u.id = b.author_id
`;

function normalizeStatus(status) {
  const value = String(status || 'draft').toLowerCase();
  return value === 'published' ? 'published' : 'draft';
}

function normalizeApprovalStatus(status) {
  const value = String(status || 'pending').toLowerCase();
  return ['pending', 'approved', 'rejected'].includes(value) ? value : 'pending';
}

function canManageBlog(user, blog) {
  return user?.role === 'admin' || Number(blog.author_id) === Number(user?.id);
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

function isPublishingStatus(status) {
  return String(status || '').toLowerCase() === 'published';
}

function isNumericIdentifier(value) {
  const numericId = Number(value);
  return Number.isInteger(numericId) && String(numericId) === String(value);
}

function isUuidIdentifier(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function getPublicLookup(identifier, tableAlias = 'b') {
  const prefix = tableAlias ? `${tableAlias}.` : '';
  if (isNumericIdentifier(identifier)) {
    return { column: `${prefix}id`, value: Number(identifier) };
  }
  if (isUuidIdentifier(identifier)) {
    return { column: `${prefix}uuid`, value: identifier };
  }
  return { column: `${prefix}slug`, value: identifier };
}

function validateBlogFields({ title, content, authorId, categoryId, requireCategory = false }) {
  if (!String(title || '').trim()) {
    throw validationError('Blog title is required', 'title');
  }
  if (!stripHtml(content)) {
    throw validationError('Blog content is required', 'content');
  }
  if (!authorId) {
    throw validationError('User information is missing. Please login again', 'author_id');
  }
  if (requireCategory && !categoryId) {
    throw validationError('Blog category is required', 'category_id');
  }
}

async function validateCategoryExists(categoryId) {
  if (!categoryId) return;
  const { rows } = await query('SELECT id FROM categories WHERE id = $1', [categoryId]);
  if (!rows.length) {
    throw validationError('Please select a valid blog category', 'category_id');
  }
}

function normalizeTagIds(tagIds) {
  if (!Array.isArray(tagIds)) throw validationError('tag_ids must be an array', 'tag_ids');
  const ids = tagIds.map(Number);
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw validationError('tag_ids must contain positive integers', 'tag_ids');
  }
  return [...new Set(ids)];
}

async function validateTagsExist(tagIds) {
  const ids = normalizeTagIds(tagIds);
  if (!ids.length) return ids;
  const result = await query('SELECT id FROM tags WHERE id = ANY($1::int[])', [ids]);
  if (result.rowCount !== ids.length) throw validationError('One or more tag_ids are invalid', 'tag_ids');
  return ids;
}

function verifySavedBlog(blog) {
  if (!blog) {
    throw databaseError('Blog publishing failed. Blog was not saved in database');
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 240) || 'blog';
}

async function createUniqueSlug(title, currentId = null) {
  const base = slugify(title);
  let slug = base;
  let suffix = 2;

  while (true) {
    const params = currentId ? [slug, currentId] : [slug];
    const sql = currentId
      ? 'SELECT id FROM blogs WHERE slug = $1 AND id <> $2'
      : 'SELECT id FROM blogs WHERE slug = $1';
    const { rows } = await query(sql, params);
    if (!rows.length) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

async function syncBlogTags(blogId, tagIds = []) {
  await query('DELETE FROM blog_tags WHERE blog_id = $1', [blogId]);
  const ids = await validateTagsExist(tagIds);
  if (!ids.length) return;
  await query(
    `INSERT INTO blog_tags (blog_id, tag_id)
     SELECT $1, UNNEST($2::int[])
     ON CONFLICT DO NOTHING`,
    [blogId, ids]
  );
}

export async function createBlog(req, res) {
  const { title, content, image, category_id, status, approval_status, tag_ids = [], is_featured } = req.body || {};

  const nextStatus = req.user?.role === 'admin' ? normalizeStatus(status) : 'draft';
  const authorId = req.user?.id;
  validateBlogFields({
    title,
    content,
    authorId,
    categoryId: category_id,
    requireCategory: isPublishingStatus(nextStatus),
  });
  await validateCategoryExists(category_id);
  await validateTagsExist(tag_ids);
  const nextApprovalStatus = req.user?.role === 'admin'
    ? normalizeApprovalStatus(approval_status || (nextStatus === 'published' ? 'approved' : 'pending'))
    : normalizeApprovalStatus(approval_status);
  const slug = await createUniqueSlug(title);
  const insert = await query(
    `INSERT INTO blogs (title, slug, content, image, category_id, author_id, status, approval_status, is_featured)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id`,
    [
      String(title).trim(),
      slug,
      String(content).trim(),
      image || '',
      category_id || null,
      authorId || null,
      nextStatus,
      nextApprovalStatus,
      req.user?.role === 'admin' ? Boolean(is_featured) : false,
    ]
  );
  await syncBlogTags(insert.rows[0].id, tag_ids);

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [insert.rows[0].id]);
  verifySavedBlog(rows[0]);
  await loggerService.logBlog({
    userId: authorId || null,
    blogId: rows[0].id,
    action: 'BLOG_CREATION',
  });
  await loggerService.logActivity({
    userId: authorId || null,
    action: 'BLOG_CREATION',
    details: { blogId: rows[0].id, status: rows[0].status },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.status(201).json({
    success: true,
    message: nextStatus === 'published' ? 'Blog published successfully' : 'Blog saved successfully',
    blog: rows[0],
  });

}

export async function getBlogs(req, res) {
  const { status, approvalStatus, q, categoryId, authorId, tagId, featured, limit, page = 1, mine } = req.query || {};

  const where = [];
  const params = [];

  if (!req.user || (req.user.role !== 'admin' && mine !== 'true')) {
    where.push("b.status = 'published'");
    where.push("b.approval_status = 'approved'");
  } else if (mine === 'true') {
    params.push(req.user.id);
    where.push(`b.author_id = $${params.length}`);
  }

  if (status) {
    params.push(String(status).toLowerCase());
    where.push(`b.status = $${params.length}`);
  }

  if (approvalStatus) {
    params.push(String(approvalStatus).toLowerCase());
    where.push(`b.approval_status = $${params.length}`);
  }

  if (categoryId) {
    params.push(Number(categoryId));
    where.push(`b.category_id = $${params.length}`);
  }

  if (authorId) {
    params.push(Number(authorId));
    where.push(`b.author_id = $${params.length}`);
  }

  if (tagId) {
    const normalizedTagId = Number(tagId);
    if (!Number.isInteger(normalizedTagId) || normalizedTagId <= 0) {
      throw validationError('tagId must be a positive integer', 'tagId');
    }
    params.push(normalizedTagId);
    where.push(`EXISTS (SELECT 1 FROM blog_tags bt WHERE bt.blog_id = b.id AND bt.tag_id = $${params.length})`);
  }

  if (featured !== undefined) {
    params.push(String(featured) === 'true');
    where.push(`b.is_featured = $${params.length}`);
  }

  if (q) {
    const query = `%${String(q)}%`;
    params.push(query);
    where.push(
      `(
        b.title ILIKE $${params.length} OR
        b.content ILIKE $${params.length} OR
        c.name ILIKE $${params.length} OR
        u.name ILIKE $${params.length}
      )`
    );
  }

  const whereSql = where.length ? ` WHERE ${where.join(' AND ')}` : '';
  const countResult = await query(`SELECT COUNT(*)::int AS total FROM blogs b LEFT JOIN categories c ON c.id = b.category_id LEFT JOIN users u ON u.id = b.author_id${whereSql}`, params);
  const pageSize = Math.min(Number(limit) || 12, 100);
  const currentPage = Math.max(Number(page) || 1, 1);
  const offset = (currentPage - 1) * pageSize;
  const pageParams = [...params, pageSize, offset];
  const sql = `${blogSelect}${whereSql} ORDER BY b.created_at DESC LIMIT $${pageParams.length - 1} OFFSET $${pageParams.length}`;
  const { rows } = await query(sql, pageParams);
  return res.json({
    blogs: rows,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total: countResult.rows[0]?.total || 0,
      totalPages: Math.ceil((countResult.rows[0]?.total || 0) / pageSize),
    },
  });

}

export async function getTrendingBlogs(req, res) {
  const limit = Math.min(Number(req.query?.limit) || 6, 20);
  const { rows } = await query(
    `${blogSelect}
     WHERE b.status = 'published' AND b.approval_status = 'approved'
     ORDER BY
       (SELECT COUNT(*) FROM comments cm WHERE cm.blog_id = b.id AND cm.status = 'approved') DESC,
       b.created_at DESC
     LIMIT $1`,
    [limit]
  );

  return res.json({ blogs: rows });
}

export async function getFeaturedBlogs(req, res) {
  const limit = Math.min(Number(req.query?.limit) || 4, 20);
  const { rows } = await query(
    `${blogSelect}
     WHERE b.status = 'published' AND b.approval_status = 'approved' AND b.is_featured = TRUE
     ORDER BY b.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.json({ blogs: rows });
}

export async function trackBlogView(req, res, next) {
  if (req.user) return next();
  const identifier = req.params.uuid || req.params.id;
  const lookup = getPublicLookup(identifier, '');
  try {
    await query(
      `UPDATE blogs SET view_count = COALESCE(view_count, 0) + 1
       WHERE ${lookup.column} = $1
       AND status = 'published' AND approval_status = 'approved'`,
      [lookup.value]
    );
  } catch (error) {
    console.warn('View count update failed:', error.message);
  }
  return next();
}

export async function getBlogById(req, res) {
  const identifier = req.params.uuid || req.params.id;
  const lookup = getPublicLookup(identifier);
  const { rows } = await query(
    `${blogSelect} WHERE ${lookup.column} = $1`,
    [lookup.value]
  );
  const blog = rows[0];
  if (!blog) throw postNotFoundError();
  if (!req.user && (blog.status !== 'published' || blog.approval_status !== 'approved')) {
    throw postNotFoundError();
  }
  if (
    req.user?.role !== 'admin' &&
    req.user &&
    Number(blog.author_id) !== Number(req.user.id) &&
    (blog.status !== 'published' || blog.approval_status !== 'approved')
  ) {
    throw permissionError('You can only access your own blogs');
  }

  return res.json({ blog });

}

export async function updateBlog(req, res) {
  const identifier = req.params.uuid || req.params.id;
  const { title, content, image, category_id, status, approval_status, tag_ids, is_featured } = req.body || {};

  const lookup = getPublicLookup(identifier, '');
  const current = await query(`SELECT * FROM blogs WHERE ${lookup.column} = $1`, [lookup.value]);
  const existing = current.rows[0];
  if (!existing) throw postNotFoundError();
  if (!canManageBlog(req.user, existing)) {
    throw permissionError('You do not have permission to perform this action');
  }

  const nextStatus = req.user?.role === 'admin'
    ? (status !== undefined ? normalizeStatus(status) : existing.status)
    : (status === 'draft' ? 'draft' : existing.status);
  const nextApprovalStatus = req.user?.role === 'admin'
    ? (approval_status !== undefined ? normalizeApprovalStatus(approval_status) : existing.approval_status)
    : (status === 'draft' ? 'pending' : existing.approval_status);

  const nextTitle = title !== undefined ? String(title).trim() : existing.title;
  const nextContent = content !== undefined ? String(content).trim() : existing.content;
  const nextCategoryId = category_id !== undefined ? category_id || null : existing.category_id;
  validateBlogFields({
    title: nextTitle,
    content: nextContent,
    authorId: existing.author_id || req.user?.id,
    categoryId: nextCategoryId,
    requireCategory: isPublishingStatus(nextStatus),
  });
  await validateCategoryExists(nextCategoryId);
  const nextSlug = title !== undefined && nextTitle !== existing.title
    ? await createUniqueSlug(nextTitle, existing.id)
    : existing.slug || await createUniqueSlug(nextTitle, existing.id);

  await query(
    `UPDATE blogs
     SET title = $2, slug = $3, content = $4, image = $5, category_id = $6, status = $7, approval_status = $8, is_featured = $9, updated_at = NOW()
     WHERE id = $1`,
    [
      existing.id,
      nextTitle,
      nextSlug,
      nextContent,
      image !== undefined ? image : existing.image,
      nextCategoryId,
      nextStatus,
      nextApprovalStatus,
      req.user?.role === 'admin' && is_featured !== undefined ? Boolean(is_featured) : existing.is_featured,
    ]
  );
  if (tag_ids !== undefined) await syncBlogTags(existing.id, tag_ids);

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [existing.id]);
  verifySavedBlog(rows[0]);
  await loggerService.logBlog({
    userId: req.user?.id || null,
    blogId: rows[0].id,
    action: 'BLOG_UPDATE',
  });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'BLOG_UPDATE',
    details: { blogId: rows[0].id, status: rows[0].status, approvalStatus: rows[0].approval_status },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({
    success: true,
    message: nextStatus === 'published' ? 'Blog published successfully' : 'Blog saved successfully',
    blog: rows[0],
  });

}

export async function deleteBlog(req, res) {
  const identifier = req.params.uuid || req.params.id;

  const lookup = getPublicLookup(identifier, '');
  const current = await query(`SELECT * FROM blogs WHERE ${lookup.column} = $1`, [lookup.value]);
  const existing = current.rows[0];
  if (!existing) throw postNotFoundError();
  if (!canManageBlog(req.user, existing)) {
    throw permissionError('You can only delete your own blogs');
  }

  const del = await query('DELETE FROM blogs WHERE id = $1 RETURNING id', [existing.id]);
  await loggerService.logBlog({
    userId: req.user?.id || null,
    blogId: del.rows[0].id,
    action: 'BLOG_DELETE',
  });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'BLOG_DELETE',
    details: { blogId: del.rows[0].id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();

  return res.json({ message: 'Blog deleted' });

}

export async function publishBlog(req, res) {
  const { id } = req.params;
  const current = await query('SELECT * FROM blogs WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) throw postNotFoundError();
  validateBlogFields({
    title: existing.title,
    content: existing.content,
    authorId: existing.author_id,
    categoryId: existing.category_id,
    requireCategory: true,
  });
  await validateCategoryExists(existing.category_id);

  const result = await query(
    `UPDATE blogs
     SET status = 'published', approval_status = 'approved', updated_at = NOW()
     , uuid = COALESCE(uuid, gen_random_uuid())
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) throw postNotFoundError();

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  verifySavedBlog(rows[0]);
  await loggerService.logBlog({
    userId: req.user?.id || null,
    blogId: rows[0].id,
    action: 'BLOG_PUBLISH',
  });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'BLOG_PUBLISH',
    details: { blogId: rows[0].id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({ success: true, message: 'Blog published successfully', blog: rows[0] });
}

export async function unpublishBlog(req, res) {
  const { id } = req.params;
  const result = await query(
    `UPDATE blogs
     SET status = 'draft', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) throw postNotFoundError();

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  await loggerService.logBlog({
    userId: req.user?.id || null,
    blogId: rows[0].id,
    action: 'BLOG_UNPUBLISH',
  });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'BLOG_UNPUBLISH',
    details: { blogId: rows[0].id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({ blog: rows[0] });
}

export async function submitBlogForReview(req, res) {
  const { id } = req.params;
  const current = await query('SELECT id, title, content, author_id, category_id FROM blogs WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) throw postNotFoundError();
  if (!canManageBlog(req.user, existing)) {
    throw permissionError('You do not have permission to perform this action');
  }
  validateBlogFields({
    title: existing.title,
    content: existing.content,
    authorId: existing.author_id,
    categoryId: existing.category_id,
    requireCategory: true,
  });
  await validateCategoryExists(existing.category_id);

  const result = await query(
    `UPDATE blogs
     SET status = 'draft', approval_status = 'pending', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) throw postNotFoundError();

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  verifySavedBlog(rows[0]);
  await loggerService.logBlog({
    userId: req.user?.id || null,
    blogId: rows[0].id,
    action: 'BLOG_SUBMIT_REVIEW',
  });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'BLOG_SUBMIT_REVIEW',
    details: { blogId: rows[0].id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({ blog: rows[0] });
}

export async function approveBlog(req, res) {
  const { id } = req.params;
  const current = await query('SELECT * FROM blogs WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) throw postNotFoundError();
  validateBlogFields({
    title: existing.title,
    content: existing.content,
    authorId: existing.author_id,
    categoryId: existing.category_id,
    requireCategory: true,
  });
  await validateCategoryExists(existing.category_id);

  const result = await query(
    `UPDATE blogs
     SET status = 'published', approval_status = 'approved', updated_at = NOW()
     , uuid = COALESCE(uuid, gen_random_uuid())
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) throw postNotFoundError();

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  verifySavedBlog(rows[0]);
  await loggerService.logBlog({
    userId: req.user?.id || null,
    blogId: rows[0].id,
    action: 'BLOG_APPROVAL',
  });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'BLOG_APPROVAL',
    details: { blogId: rows[0].id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({ success: true, message: 'Blog published successfully', blog: rows[0] });
}

export async function rejectBlog(req, res) {
  const { id } = req.params;
  const result = await query(
    `UPDATE blogs
     SET status = 'draft', approval_status = 'rejected', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) throw postNotFoundError();

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  await loggerService.logBlog({
    userId: req.user?.id || null,
    blogId: rows[0].id,
    action: 'BLOG_REJECTION',
  });
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'BLOG_REJECTION',
    details: { blogId: rows[0].id },
    ipAddress: req.ip,
  });
  await invalidateBlogCache();
  return res.json({ blog: rows[0] });
}

export async function setFeaturedBlog(req, res) {
  const { id } = req.params;
  const { featured = true } = req.body || {};
  const result = await query(
    `UPDATE blogs SET is_featured = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id, Boolean(featured)]
  );
  if (!result.rowCount) throw postNotFoundError();
  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  await invalidateBlogCache();
  return res.json({ blog: rows[0] });
}

