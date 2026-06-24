import { loggerService } from '../services/loggerService.js';
import { ERROR_TYPES } from '../utils/appError.js';

const DATABASE_CONNECTION_CODES = new Set([
  '08000',
  '08001',
  '08003',
  '08004',
  '08006',
  '08007',
  '57P01',
  '57P02',
  '57P03',
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
]);

function isPgError(err) {
  return typeof err.code === 'string' && /^\d{5}$/.test(err.code);
}

function isDatabaseConnectionError(err) {
  return DATABASE_CONNECTION_CODES.has(err.code) ||
    /connection|connect|timeout|terminated|ECONNREFUSED|ENOTFOUND|server selection/i.test(err.message || '');
}

function normalizeError(err) {
  const duplicate = err.code === '23505';
  const foreignKey = err.code === '23503';
  const dbConnection = isDatabaseConnectionError(err);
  const pgError = isPgError(err);

  if (err.statusCode && err.errorType) {
    return {
      statusCode: err.statusCode,
      errorType: err.errorType,
      code: err.code || err.errorType,
      message: err.message,
      field: err.field,
    };
  }

  if (duplicate) {
    return {
      statusCode: 409,
      errorType: ERROR_TYPES.VALIDATION_ERROR,
      code: 'RESOURCE_ALREADY_EXISTS',
      message: 'Resource already exists',
    };
  }

  if (foreignKey) {
    return {
      statusCode: 404,
      errorType: ERROR_TYPES.NOT_FOUND_ERROR,
      code: 'RELATED_RESOURCE_NOT_FOUND',
      message: 'Related resource not found',
    };
  }

  if (dbConnection) {
    return {
      statusCode: 503,
      errorType: ERROR_TYPES.DATABASE_CONNECTION_ERROR,
      code: 'DATABASE_CONNECTION_ERROR',
      message: 'Database connection error. Please try again later.',
    };
  }

  if (pgError) {
    return {
      statusCode: 500,
      errorType: ERROR_TYPES.DATABASE_ERROR,
      code: 'DATABASE_ERROR',
      message: 'Database error. Please try again later.',
    };
  }

  return {
    statusCode: 500,
    errorType: ERROR_TYPES.SERVER_ERROR,
    code: 'SERVER_ERROR',
    message: 'Server error. Please try again later.',
  };
}

export async function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  console.error(err);
  const normalized = normalizeError(err);

  try {
    await loggerService.logApiError({ req, error: err, normalized });
  } catch (logError) {
    console.error('Error logging failed:', logError.message);
  }

  return res.status(normalized.statusCode).json({
    success: false,
    statusCode: normalized.statusCode,
    errorType: normalized.errorType,
    code: normalized.code,
    field: normalized.field,
    message: normalized.message,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}
