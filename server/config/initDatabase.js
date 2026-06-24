import bcrypt from 'bcryptjs';

import { query } from './database.js';

const defaultAdmin = {
  name: 'Admin User',
  email: 'admin@blog.com',
  password: 'admin123',
  role: 'admin',
};

const defaultCategories = [
  'General',
  'Technology',
  'AI',
  'Web Development',
  'Programming',
  'Education',
];

const defaultTags = [
  'AI',
  'React',
  'Node.js',
  'PostgreSQL',
  'Web Development',
  'Tutorial',
];

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

export async function initializeDatabase() {
  await query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(20) DEFAULT 'writer',
      bio TEXT DEFAULT '',
      profile_image VARCHAR(2000) DEFAULT '',
      email_verified BOOLEAN DEFAULT FALSE,
      verification_token VARCHAR(255),
      verification_token_expires TIMESTAMP,
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'writer'");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT ''");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image VARCHAR(2000) DEFAULT ''");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255)");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)");
  await query("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP");
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS blogs (
      id SERIAL PRIMARY KEY,
      uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      title VARCHAR(255) NOT NULL,
      slug VARCHAR(280) UNIQUE,
      content TEXT NOT NULL,
      image TEXT,
      is_featured BOOLEAN DEFAULT FALSE,
      view_count INTEGER DEFAULT 0,
      category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      author_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      status VARCHAR(20) DEFAULT 'draft',
      approval_status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      comment TEXT NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query("ALTER TABLE blogs ADD COLUMN IF NOT EXISTS slug VARCHAR(280)");
  await query("ALTER TABLE blogs ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid()");
  await query("UPDATE blogs SET uuid = gen_random_uuid() WHERE uuid IS NULL");
  await query("ALTER TABLE blogs ALTER COLUMN uuid SET DEFAULT gen_random_uuid()");
  await query("ALTER TABLE blogs ALTER COLUMN uuid SET NOT NULL");
  await query("ALTER TABLE blogs ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'pending'");
  await query("ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE");
  await query("ALTER TABLE blogs ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0");
  await query("ALTER TABLE blogs ALTER COLUMN image TYPE TEXT");
  await query("ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL");
  await query("CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_slug_unique ON blogs(slug) WHERE slug IS NOT NULL");
  await query("CREATE UNIQUE INDEX IF NOT EXISTS idx_blogs_uuid_unique ON blogs(uuid)");
  await query("CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status)");
  await query("CREATE INDEX IF NOT EXISTS idx_blogs_approval_status ON blogs(approval_status)");
  await query("CREATE INDEX IF NOT EXISTS idx_blogs_author_id ON blogs(author_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_blogs_category_id ON blogs(category_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at DESC)");
  await query("CREATE INDEX IF NOT EXISTS idx_comments_blog_id ON comments(blog_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)");
  await query(`
    CREATE TABLE IF NOT EXISTS tags (
      id SERIAL PRIMARY KEY,
      name VARCHAR(80) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS blog_tags (
      blog_id INTEGER REFERENCES blogs(id) ON DELETE CASCADE,
      tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (blog_id, tag_id)
    )
  `);
  await query("CREATE INDEX IF NOT EXISTS idx_blog_tags_blog_id ON blog_tags(blog_id)");
  await query("CREATE INDEX IF NOT EXISTS idx_blog_tags_tag_id ON blog_tags(tag_id)");

  for (const name of defaultCategories) {
    await query(
      `INSERT INTO categories (name)
       VALUES ($1)
       ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }

  for (const name of defaultTags) {
    await query(
      `INSERT INTO tags (name, slug)
       VALUES ($1, $2)
       ON CONFLICT (slug)
       DO UPDATE SET name = EXCLUDED.name`,
      [name, slugify(name)]
    );
  }

  const passwordHash = await bcrypt.hash(defaultAdmin.password, 12);
  await query(
    `INSERT INTO users (name, email, password, role, email_verified)
     VALUES ($1, $2, $3, $4, TRUE)
     ON CONFLICT (email)
     DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, email_verified = TRUE`,
    [defaultAdmin.name, defaultAdmin.email, passwordHash, defaultAdmin.role]
  );
}
