import { query } from '../config/database.js';
import { invalidateCategoryCache } from '../middleware/cache.js';
import { loggerService } from '../services/loggerService.js';
import { notFoundError, validationError } from '../utils/appError.js';

function categoryId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) throw validationError('Category id must be a positive integer', 'id');
  return id;
}

function categoryName(value) {
  const name = String(value || '').trim();
  if (!name) throw validationError('Category name is required', 'name');
  if (name.length > 100) throw validationError('Category name must be 100 characters or fewer', 'name');
  return name;
}

export async function createCategory(req, res) {
  const name = categoryName(req.body?.name);

  const result = await query(
    'INSERT INTO categories (name) VALUES ($1) RETURNING *',
    [name]
  );
  await loggerService.logActivity({ userId: req.user.id, action: 'CATEGORY_CREATE', details: { categoryId: result.rows[0].id }, ipAddress: req.ip });
  await invalidateCategoryCache();
  return res.status(201).json({ category: result.rows[0] });
}

export async function getCategories(req, res) {
  const { rows } = await query('SELECT * FROM categories ORDER BY created_at DESC');
  return res.json({ categories: rows });
}

export async function updateCategory(req, res) {
  const id = categoryId(req.params.id);
  const name = categoryName(req.body?.name);

  const result = await query(
    'UPDATE categories SET name = $2 WHERE id = $1 RETURNING *',
    [id, name]
  );
  if (!result.rowCount) throw notFoundError('Category not found');

  await loggerService.logActivity({ userId: req.user.id, action: 'CATEGORY_UPDATE', details: { categoryId: id }, ipAddress: req.ip });
  await invalidateCategoryCache();
  return res.json({ category: result.rows[0] });
}

export async function deleteCategory(req, res) {
  const id = categoryId(req.params.id);

  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (!result.rowCount) throw notFoundError('Category not found');

  await loggerService.logActivity({ userId: req.user.id, action: 'CATEGORY_DELETE', details: { categoryId: id }, ipAddress: req.ip });
  await invalidateCategoryCache();
  return res.json({ message: 'Category deleted' });
}

