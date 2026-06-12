import bcrypt from 'bcryptjs';

import { query } from '../config/database.js';

function normalizeRole(role) {
  return role === 'admin' ? 'admin' : 'writer';
}

export async function getUsers(req, res) {
  const { rows } = await query(
    `SELECT id, name, email, role, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  return res.json({ users: rows });
}

export async function createUser(req, res) {
  const { name, email, password, role } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(String(password), 12);
  const result = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, role, created_at`,
    [String(name).trim(), normalizedEmail, passwordHash, normalizeRole(role)]
  );

  return res.status(201).json({ user: result.rows[0] });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password, role } = req.body || {};

  const current = await query('SELECT * FROM users WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) return res.status(404).json({ message: 'User not found' });

  const passwordHash = password ? await bcrypt.hash(String(password), 12) : existing.password;
  const result = await query(
    `UPDATE users
     SET name = $2, email = $3, password = $4, role = $5
     WHERE id = $1
     RETURNING id, name, email, role, created_at`,
    [
      id,
      name !== undefined ? String(name).trim() : existing.name,
      email !== undefined ? String(email).trim().toLowerCase() : existing.email,
      passwordHash,
      role !== undefined ? normalizeRole(role) : existing.role,
    ]
  );

  return res.json({ user: result.rows[0] });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  if (Number(id) === Number(req.user?.id)) {
    return res.status(400).json({ message: 'Admins cannot delete their own account' });
  }

  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (!result.rowCount) return res.status(404).json({ message: 'User not found' });
  return res.json({ message: 'User deleted' });
}

export async function getProfile(req, res) {
  const { rows } = await query(
    `SELECT id, name, email, role, created_at
     FROM users
     WHERE id = $1`,
    [req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ message: 'User not found' });
  return res.json({ user: rows[0] });
}

export async function updateProfile(req, res) {
  const { name, email, password } = req.body || {};
  const current = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const existing = current.rows[0];
  if (!existing) return res.status(404).json({ message: 'User not found' });

  const passwordHash = password ? await bcrypt.hash(String(password), 12) : existing.password;
  const result = await query(
    `UPDATE users
     SET name = $2, email = $3, password = $4
     WHERE id = $1
     RETURNING id, name, email, role, created_at`,
    [
      req.user.id,
      name !== undefined ? String(name).trim() : existing.name,
      email !== undefined ? String(email).trim().toLowerCase() : existing.email,
      passwordHash,
    ]
  );

  return res.json({ user: result.rows[0] });
}
