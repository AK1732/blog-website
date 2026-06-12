import bcrypt from 'bcryptjs';

import { query } from './database.js';

const defaultAdmin = {
  name: 'Admin User',
  email: 'admin@blog.com',
  password: 'admin123',
  role: 'admin',
};

export async function initializeDatabase() {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'writer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'writer'");

  const passwordHash = await bcrypt.hash(defaultAdmin.password, 12);
  await query(
    `INSERT INTO users (name, email, password, role)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email)
     DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role`,
    [defaultAdmin.name, defaultAdmin.email, passwordHash, defaultAdmin.role]
  );
}
