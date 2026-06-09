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

export async function createBlog(req, res) {
  const { title, content, image, category_id, status } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ message: 'title and content are required' });
  }

  const authorId = req.user?.id;
  const insert = await query(
    `INSERT INTO blogs (title, content, image, category_id, author_id, status)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      String(title).trim(),
      String(content).trim(),
      image || '',
      category_id || null,
      authorId || null,
      normalizeStatus(status),
    ]
  );

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [insert.rows[0].id]);
  return res.status(201).json({ blog: rows[0] });

}

export async function getBlogs(req, res) {
  const { status, q, categoryId, limit } = req.query || {};

  const where = [];
  const params = [];

  if (status) {
    params.push(String(status).toLowerCase());
    where.push(`status = $${params.length}`);
  }

  if (categoryId) {
    params.push(Number(categoryId));
    where.push(`category_id = $${params.length}`);
  }

  if (q) {
    const query = `%${String(q)}%`;
    params.push(query);
    where.push(
      `(
        title ILIKE $${params.length} OR
        content ILIKE $${params.length} OR
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

  return res.json({ blog });

}

export async function updateBlog(req, res) {
  const { id } = req.params;
  const { title, content, image, category_id, status } = req.body || {};

  const current = await query('SELECT * FROM blogs WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) return res.status(404).json({ message: 'Blog not found' });

  await query(
    `UPDATE blogs
     SET title = $2, content = $3, image = $4, category_id = $5, status = $6, updated_at = NOW()
     WHERE id = $1`,
    [
      id,
      title !== undefined ? String(title).trim() : existing.title,
      content !== undefined ? String(content).trim() : existing.content,
      image !== undefined ? image : existing.image,
      category_id !== undefined ? category_id || null : existing.category_id,
      status !== undefined ? normalizeStatus(status) : existing.status,
    ]
  );

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });

}

export async function deleteBlog(req, res) {
  const { id } = req.params;

  const del = await query('DELETE FROM blogs WHERE id = $1 RETURNING id', [id]);
  if (!del.rowCount) return res.status(404).json({ message: 'Blog not found' });

  return res.json({ message: 'Blog deleted' });

}

export async function publishBlog(req, res) {
  const { id } = req.params;
  const result = await query(
    `UPDATE blogs SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING id`,
    [id]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Blog not found' });

  const { rows } = await query(`${blogSelect} WHERE b.id = $1`, [id]);
  return res.json({ blog: rows[0] });
}

