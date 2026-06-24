import jwt from 'jsonwebtoken';
import { authError, permissionError, AppError, ERROR_TYPES } from '../utils/appError.js';

function verifyToken(token) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    const error = new AppError('Server misconfigured', { errorType: ERROR_TYPES.SERVER_ERROR });
    throw error;
  }

  return jwt.verify(token, jwtSecret);
}

export function authenticateUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');

    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      return next(authError('Please login to continue'));
    }

    req.user = verifyToken(token);
    return next();
  } catch (err) {
    if (err.statusCode === 500) return next(err);
    return next(authError('Invalid session. Please login again'));
  }
}

export function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() === 'bearer' && token) req.user = verifyToken(token);
  } catch {
    req.user = null;
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return next(permissionError());
  }
  return next();
}

export function requireWriter(req, res, next) {
  if (!['writer', 'admin'].includes(req.user?.role)) {
    return next(permissionError());
  }
  return next();
}

export const requireAuth = authenticateUser;

