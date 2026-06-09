import bcrypt from 'bcryptjs';

import { query } from '../config/database.js';
import { generateToken } from '../utils/generateToken.js';


export async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'name, email, and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const { rows } = await query('SELECT id, name, email FROM users WHERE email = $1', [normalizedEmail]);
  if (rows.length) return res.status(409).json({ message: 'Email already registered' });

  const passwordHash = await bcrypt.hash(String(password), 12);
  const insert = await query(
    'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, role',
    [String(name).trim(), normalizedEmail, passwordHash]
  );

  const user = insert.rows[0];
  return res.status(201).json({ user });

}

export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'email and password are required' });
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const { rows } = await query(
    'SELECT id, name, email, password, role FROM users WHERE email = $1',
    [normalizedEmail]
  );
  const user = rows[0];
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = generateToken(user);
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

