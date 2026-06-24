import bcrypt from 'bcryptjs';

import { query } from '../config/database.js';
import { loggerService } from '../services/loggerService.js';
import { notFoundError, validationError } from '../utils/appError.js';

function normalizeRole(role) {
  return role === 'admin' ? 'admin' : 'writer';
}

export async function getUsers(req, res) {
  const { rows } = await query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.role,
       u.bio,
       u.profile_image,
       u.created_at,
       COUNT(b.id)::int AS total_blogs,
       COUNT(b.id) FILTER (WHERE b.status = 'published' AND b.approval_status = 'approved')::int AS published_blogs
     FROM users
     LEFT JOIN blogs b ON b.author_id = u.id
     WHERE u.role = 'writer'
     GROUP BY u.id
     ORDER BY u.created_at DESC`
  );
  return res.json({ users: rows });
}

export async function createUser(req, res) {
  const { name, email, password, role, bio, profile_image } = req.body || {};

  if (!name || !email || !password) {
    throw validationError('name, email, and password are required');
  }
  if (String(password).length < 8) {
    throw validationError('Password must be at least 8 characters', 'password');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(String(password), 12);
  const result = await query(
    `INSERT INTO users (name, email, password, role, bio, profile_image, email_verified)
     VALUES ($1, $2, $3, $4, $5, $6, TRUE)
     RETURNING id, name, email, role, bio, profile_image, created_at`,
    [String(name).trim(), normalizedEmail, passwordHash, normalizeRole(role), bio || '', profile_image || '']
  );
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'WRITER_CREATE',
    details: { userId: result.rows[0].id, role: result.rows[0].role },
    ipAddress: req.ip,
  });

  return res.status(201).json({ user: result.rows[0] });
}

export async function updateUser(req, res) {
  const { id } = req.params;
  const { name, email, password, role, bio, profile_image } = req.body || {};

  const current = await query('SELECT * FROM users WHERE id = $1', [id]);
  const existing = current.rows[0];
  if (!existing) throw notFoundError('User not found', 'USER_NOT_FOUND');

  const passwordHash = password ? await bcrypt.hash(String(password), 12) : existing.password;
  const result = await query(
    `UPDATE users
     SET name = $2, email = $3, password = $4, role = $5, bio = $6, profile_image = $7
     WHERE id = $1
     RETURNING id, name, email, role, bio, profile_image, created_at`,
    [
      id,
      name !== undefined ? String(name).trim() : existing.name,
      email !== undefined ? String(email).trim().toLowerCase() : existing.email,
      passwordHash,
      role !== undefined ? normalizeRole(role) : existing.role,
      bio !== undefined ? String(bio) : existing.bio,
      profile_image !== undefined ? String(profile_image) : existing.profile_image,
    ]
  );
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'WRITER_UPDATE',
    details: { userId: result.rows[0].id, role: result.rows[0].role },
    ipAddress: req.ip,
  });

  return res.json({ user: result.rows[0] });
}

export async function deleteUser(req, res) {
  const { id } = req.params;
  if (Number(id) === Number(req.user?.id)) {
    throw validationError('Admins cannot delete their own account');
  }

  const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  if (!result.rowCount) throw notFoundError('User not found', 'USER_NOT_FOUND');
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'WRITER_DELETE',
    details: { userId: result.rows[0].id },
    ipAddress: req.ip,
  });
  return res.json({ message: 'User deleted' });
}

export async function getProfile(req, res) {
  const { rows } = await query(
    `SELECT
       u.id,
       u.name,
       u.email,
       u.role,
       u.bio,
       u.profile_image,
       u.created_at,
       COUNT(b.id)::int AS total_blogs,
       COUNT(b.id) FILTER (WHERE b.status = 'published' AND b.approval_status = 'approved')::int AS published_blogs
     FROM users u
     LEFT JOIN blogs b ON b.author_id = u.id
     WHERE u.id = $1
     GROUP BY u.id`,
    [req.user.id]
  );
  if (!rows[0]) throw notFoundError('User not found', 'USER_NOT_FOUND');
  return res.json({ user: rows[0] });
}

export async function updateProfile(req, res) {
  const { name, email, password, bio, profile_image } = req.body || {};
  const current = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  const existing = current.rows[0];
  if (!existing) throw notFoundError('User not found', 'USER_NOT_FOUND');

  const passwordHash = password ? await bcrypt.hash(String(password), 12) : existing.password;
  const result = await query(
    `UPDATE users
     SET name = $2, email = $3, password = $4, bio = $5, profile_image = $6
     WHERE id = $1
     RETURNING id, name, email, role, bio, profile_image, created_at`,
    [
      req.user.id,
      name !== undefined ? String(name).trim() : existing.name,
      email !== undefined ? String(email).trim().toLowerCase() : existing.email,
      passwordHash,
      bio !== undefined ? String(bio) : existing.bio,
      profile_image !== undefined ? String(profile_image) : existing.profile_image,
    ]
  );
  await loggerService.logActivity({
    userId: req.user.id,
    action: 'PROFILE_UPDATE',
    details: { emailChanged: email !== undefined && email !== existing.email },
    ipAddress: req.ip,
  });

  return res.json({ user: result.rows[0] });
}
