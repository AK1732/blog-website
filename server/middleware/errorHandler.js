import { loggerService } from '../services/loggerService.js';

export async function errorHandler(err, req, res, next) {
  console.error(err);
  await loggerService.logApiError({ req, error: err });

  const statusCode = err.statusCode || (err.code === '23505' ? 409 : 500);
  const message = err.code === '23505' ? 'Resource already exists' : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message,
    // In production, you’d typically omit details.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

