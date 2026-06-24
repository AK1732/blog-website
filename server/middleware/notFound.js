import { notFoundError } from '../utils/appError.js';

export function notFound(req, res, next) {
  next(notFoundError('Route not found'));
}

