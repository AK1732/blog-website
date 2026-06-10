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

