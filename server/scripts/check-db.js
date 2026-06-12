import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const config = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

const pool = new Pool(config);

try {
  const { rows } = await pool.query('SELECT current_database() AS database, current_user AS user');
  console.log(`Connected to PostgreSQL database "${rows[0].database}" as "${rows[0].user}".`);
} catch (err) {
  console.error(`Could not connect to PostgreSQL at ${config.host}:${config.port} as "${config.user}".`);
  console.error(err.message);
  process.exitCode = 1;
} finally {
  await pool.end().catch(() => {});
}
