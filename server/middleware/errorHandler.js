export function errorHandler(err, req, res, next) {
  console.error(err);

  const statusCode = err.statusCode || (err.code === '23505' ? 409 : 500);
  const message = err.code === '23505' ? 'Resource already exists' : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    message,
    // In production, you’d typically omit details.
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
}

