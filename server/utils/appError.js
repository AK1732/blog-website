export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_ERROR: 'AUTH_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
};

const STATUS_BY_TYPE = {
  [ERROR_TYPES.VALIDATION_ERROR]: 400,
  [ERROR_TYPES.AUTH_ERROR]: 401,
  [ERROR_TYPES.PERMISSION_ERROR]: 403,
  [ERROR_TYPES.NOT_FOUND_ERROR]: 404,
  [ERROR_TYPES.DATABASE_ERROR]: 500,
  [ERROR_TYPES.DATABASE_CONNECTION_ERROR]: 503,
  [ERROR_TYPES.SERVER_ERROR]: 500,
};

export class AppError extends Error {
  constructor(message, { statusCode, errorType = ERROR_TYPES.SERVER_ERROR, field, code } = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode || STATUS_BY_TYPE[errorType] || 500;
    this.errorType = errorType;
    this.field = field;
    this.code = code || errorType;
    this.isOperational = true;
  }
}

export function validationError(message, field) {
  return new AppError(message, {
    errorType: ERROR_TYPES.VALIDATION_ERROR,
    field,
  });
}

export function authError(message) {
  return new AppError(message, {
    errorType: ERROR_TYPES.AUTH_ERROR,
    code: 'UNAUTHORIZED_ACCESS',
  });
}

export function permissionError(message = 'You do not have permission to perform this action') {
  return new AppError(message, {
    errorType: ERROR_TYPES.PERMISSION_ERROR,
    code: 'UNAUTHORIZED_ACCESS',
  });
}

export function notFoundError(message = 'Resource not found', code = 'NOT_FOUND') {
  return new AppError(message, {
    errorType: ERROR_TYPES.NOT_FOUND_ERROR,
    code,
  });
}

export function databaseError(message) {
  return new AppError(message, {
    errorType: ERROR_TYPES.DATABASE_ERROR,
    code: 'DATABASE_ERROR',
  });
}

export function databaseConnectionError(message = 'Database connection error') {
  return new AppError(message, {
    errorType: ERROR_TYPES.DATABASE_CONNECTION_ERROR,
    code: 'DATABASE_CONNECTION_ERROR',
  });
}

export function postNotFoundError(message = 'Post not found') {
  return notFoundError(message, 'POST_NOT_FOUND');
}

export function draftNotFoundError(message = 'Draft not found') {
  return notFoundError(message, 'DRAFT_NOT_FOUND');
}

export function commentNotFoundError(message = 'Comment not found') {
  return notFoundError(message, 'COMMENT_NOT_FOUND');
}
