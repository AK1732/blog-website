import { query } from '../config/database.js';
import { invalidateTagCache } from '../middleware/cache.js';
import { loggerService } from '../services/loggerService.js';
import { validationError } from '../utils/appError.js';

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export async function getTags(req, res) {
  const { rows } = await query('SELECT * FROM tags ORDER BY name ASC');
  return res.json({ tags: rows });
}

export async function createTag(req, res) {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    throw validationError('name is required', 'name');
  }

  const cleanName = String(name).trim();
  if (cleanName.length > 80) throw validationError('name must be 80 characters or fewer', 'name');
  const slug = slugify(cleanName);
  if (!slug) throw validationError('name must contain letters or numbers', 'name');
  const { rows } = await query(
    `INSERT INTO tags (name, slug)
     VALUES ($1, $2)
     ON CONFLICT (slug)
     DO UPDATE SET name = EXCLUDED.name
     RETURNING *`,
    [cleanName, slug]
  );

  await loggerService.logActivity({
    userId: req.user.id,
    action: 'TAG_CREATE',
    details: { tagId: rows[0].id },
    ipAddress: req.ip,
  });
  await invalidateTagCache();
  return res.status(201).json({ tag: rows[0] });
}
