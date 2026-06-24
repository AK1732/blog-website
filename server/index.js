import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';

import { validateServerEnv } from './config/env.js';
import { initializeDatabase } from './config/initDatabase.js';
import { checkPostgresConnection } from './config/database.js';
import { initializeMongoLogs } from './config/mongo.js';
import { initializeRedis } from './config/redis.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { getHealth } from './controllers/healthController.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import draftRoutes from './routes/draftRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import userRoutes from './routes/userRoutes.js';

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

try {
  validateServerEnv();
  await checkPostgresConnection();
  console.log('PostgreSQL connected');
  await initializeDatabase();
  await initializeMongoLogs();
  await initializeRedis();
} catch (error) {
  const postgresStartupError = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'].some((name) =>
    String(error.message || '').includes(name)
  );
  if (postgresStartupError || error.code || /database|postgres|password|credential|connect/i.test(error.message || '')) {
    console.error('PostgreSQL connection failed. Check DB credentials.');
  }
  console.error(error.message);
  process.exit(1);
}

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const devOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+):5173$/;

app.use(helmet());
app.use(cors({
  origin(origin, callback) {
    if (
      !origin ||
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      (process.env.NODE_ENV !== 'production' && devOriginPattern.test(origin))
    ) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({
    message: 'InsightHub API is running',
    apiBase: '/api',
    health: '/api/health',
    frontend: process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173',
  });
});

app.get('/health', getHealth);

app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', blogRoutes);
app.use('/api', categoryRoutes);
app.use('/api', commentRoutes);
app.use('/api', dashboardRoutes);
app.use('/api', draftRoutes);
app.use('/api', tagRoutes);
app.use('/api', userRoutes);

app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
const host = process.env.HOST || '0.0.0.0';
app.listen(port, host, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Local URL: http://localhost:${port}`);
  console.log(`CORS origin: ${process.env.CORS_ORIGIN || '*'}`);
});
