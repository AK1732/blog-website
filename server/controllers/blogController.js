import { query } from '../config/database.js';

const blogSelect = `
  SELECT
    b.id,
    b.title,
    b.content,
    b.image,
    b.category_id,
    c.name AS category_name,
    b.author_id,
    u.name AS author_name,
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

export async function createBlog(req, res) {
  const { title, content, image, category_id, status, approval_status } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }

  const nextStatus = req.user?.role === 'admin' ? normalizeStatus(status) : 'draft';
  const nextApprovalStatus = req.user?.role === 'admin'
    ? normalizeApprovalStatus(approval_status || (nextStatus === 'published' ? 'approved' : 'pending'))
    : normalizeApprovalStatus(approval_status);
  const authorId = req.user?.id;
  const insert = await query(
    `INSERT INTO blogs (title, content, image, category_id, author_id, status, approval_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [
      String(title).trim(),
      String(content).trim(),
      image || '',
      category_id || null,
      authorId || null,
      nextStatus,
      nextApprovalStatus,
    ]
  );

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [insert.rows[0].id]);
  return res.status(201).json({ blog: rows[0] });

}

export async function getBlogs(req, res) {
  const { status, approvalStatus, q, categoryId, limit, mine } = req.query || {};

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

  let sql = `${blogSelect}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY b.created_at DESC`;
  if (limit) {
    params.push(Math.min(Number(limit) || 20, 100));
    sql += ` LIMIT $${params.length}`;
  }
  const { rows } = await query(sql, params);
  return res.json({ blogs: rows });

}

export async function getBlogById(req, res) {
  const { id } = req.params;

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  const blog = rows[0];
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  if (!req.user && (blog.status !== 'published' || blog.approval_status !== 'approved')) {
    return res.status(404).json({ message: 'Blog not found' });
  }
  if (
    req.user?.role !== 'admin' &&
    req.user &&
    Number(blog.author_id) !== Number(req.user.id) &&
    (blog.status !== 'published' || blog.approval_status !== 'approved')
  ) {
    return res.status(403).json({ message: 'You can only access your own blogs' });
  }

  return res.json({ blog });

}

export async function updateBlog(req, res) {
  const { id } = req.params;
  const { title, content, image, category_id, status, approval_status } = req.body || {};

  const current = await query('SELECT * FROM blogs WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) return res.status(404).json({ message: 'Blog not found' });
  if (!canManageBlog(req.user, existing)) {
    return res.status(403).json({ message: 'You can only edit your own blogs' });
  }

  const nextStatus = req.user?.role === 'admin'
    ? (status !== undefined ? normalizeStatus(status) : existing.status)
    : (status === 'draft' ? 'draft' : existing.status);
  const nextApprovalStatus = req.user?.role === 'admin'
    ? (approval_status !== undefined ? normalizeApprovalStatus(approval_status) : existing.approval_status)
    : (status === 'draft' ? 'pending' : existing.approval_status);

  await query(
    `UPDATE blogs
     SET title = $2, content = $3, image = $4, category_id = $5, status = $6, approval_status = $7, updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      title !== undefined ? String(title).trim() : existing.title,
      content !== undefined ? String(content).trim() : existing.content,
      image !== undefined ? image : existing.image,
      category_id !== undefined ? category_id || null : existing.category_id,
      nextStatus,
      nextApprovalStatus,
    ]
  );

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });

}

export async function deleteBlog(req, res) {
  const { id } = req.params;

  const current = await query('SELECT id, author_id FROM blogs WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) return res.status(404).json({ message: 'Blog not found' });
  if (!canManageBlog(req.user, existing)) {
    return res.status(403).json({ message: 'You can only delete your own blogs' });
  }

  const del = await query('DELETE FROM blogs WHERE id = $1 RETURNING id', [id]);

  return res.json({ message: 'Blog deleted' });

}

export async function publishBlog(req, res) {
  const { id } = req.params;
  const result = await query(
    `UPDATE blogs
     SET status = 'published', approval_status = 'approved', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Blog not found' });

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });
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
  if (!result.rowCount) return res.status(404).json({ message: 'Blog not found' });

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });
}

export async function submitBlogForReview(req, res) {
  const { id } = req.params;
  const current = await query('SELECT id, author_id FROM blogs WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) return res.status(404).json({ message: 'Blog not found' });
  if (!canManageBlog(req.user, existing)) {
    return res.status(403).json({ message: 'You can only submit your own blogs' });
  }

  const result = await query(
    `UPDATE blogs
     SET status = 'draft', approval_status = 'pending', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Blog not found' });

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });
}

export async function approveBlog(req, res) {
  const { id } = req.params;
  const result = await query(
    `UPDATE blogs
     SET status = 'published', approval_status = 'approved', updated_at = NOW()
     WHERE id = $1
     RETURNING id`,
    [id]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Blog not found' });

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });
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
  if (!result.rowCount) return res.status(404).json({ message: 'Blog not found' });

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });
}

