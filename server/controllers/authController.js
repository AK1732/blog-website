import bcrypt from 'bcryptjs';

import { query } from '../config/database.js';
import { generateToken } from '../utils/generateToken.js';
import { loggerService } from '../services/loggerService.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

export async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'valid email is required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const { rows } = await query('SELECT id, name, email FROM users WHERE email = $1', [normalizedEmail]);
  if (rows.length) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(String(password), 12);
  const insert = await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, 'writer')
     RETURNING id, name, email, role`,
    [String(name).trim(), normalizedEmail, passwordHash]
  );

  const user = insert.rows[0];
  const token = generateToken(user);
  await loggerService.logActivity({
    userId: user.id,
    action: 'USER_REGISTRATION',
    details: { role: user.role },
    ipAddress: req.ip,
  });
  return res.status(201).json({ token, user });

}

export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ message: 'valid email is required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const { rows } = await query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [normalizedEmail]
  );
  const user = rows[0];
  if (!user) {
    await loggerService.logLogin({
      email: normalizedEmail,
      status: 'FAILED_ACCOUNT_NOT_FOUND',
      ipAddress: req.ip,
    });
    return res.status(401).json({ message: 'Account does not exist' });
  }

  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) {
    await loggerService.logLogin({
      email: normalizedEmail,
      status: 'FAILED_INCORRECT_PASSWORD',
      ipAddress: req.ip,
    });
    return res.status(401).json({ message: 'Incorrect password' });
  }

  const token = generateToken(user);
  await loggerService.logLogin({
    email: user.email,
    status: 'SUCCESS',
    ipAddress: req.ip,
  });
  await loggerService.logActivity({
    userId: user.id,
    action: 'USER_LOGIN',
    details: {},
    ipAddress: req.ip,
  });
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function logout(req, res) {
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'USER_LOGOUT',
    details: {},
    ipAddress: req.ip,
  });

  return res.json({ message: 'Logged out' });
}

