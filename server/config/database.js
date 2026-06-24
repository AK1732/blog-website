import pg from 'pg';

import { getRequiredEnv } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  host: getRequiredEnv('DB_HOST'),
  port: Number(getRequiredEnv('DB_PORT')),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD'),
  database: getRequiredEnv('DB_NAME'),
});

export async function query(text, params = []) {
  return pool.query(text, params);
}

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function checkPostgresConnection() {
  await pool.query('SELECT 1');
  return true;
}

