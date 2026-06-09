import { query } from '../config/database.js';

export async function createCategory(req, res) {
  const { name } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  const result = await query(
    'INSERT INTO categories (name) VALUES ($1) RETURNING *',
    [String(name).trim()]
  );
  return res.status(201).json({ category: result.rows[0] });
}

export async function getCategories(req, res) {
  const { rows } = await query('SELECT * FROM categories ORDER BY created_at DESC');
  return res.json({ categories: rows });
}

export async function updateCategory(req, res) {
  const { id } = req.params;
  const { name } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'name is required' });
  }

  const result = await query(
    'UPDATE categories SET name = $2 WHERE id = $1 RETURNING *',
    [id, String(name).trim()]
  );
  if (!result.rowCount) return res.status(404).json({ message: 'Category not found' });

  return res.json({ category: result.rows[0] });
}

export async function deleteCategory(req, res) {
  const { id } = req.params;

  const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
  if (!result.rowCount) return res.status(404).json({ message: 'Category not found' });

  return res.json({ message: 'Category deleted' });
}

