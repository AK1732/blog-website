const ERROR_MESSAGES = {
  UNAUTHORIZED_ACCESS: 'Unauthorized access. Please login with the correct account.',
  POST_NOT_FOUND: 'Post not found.',
  DRAFT_NOT_FOUND: 'Draft not found.',
  COMMENT_NOT_FOUND: 'Comment not found.',
  NOT_FOUND: 'Requested resource not found.',
  DATABASE_CONNECTION_ERROR: 'Database connection error. Please try again later.',
  DATABASE_ERROR: 'Database error. Please try again later.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RESOURCE_ALREADY_EXISTS: 'Resource already exists.',
  RELATED_RESOURCE_NOT_FOUND: 'Related resource not found.',
};

export function getApiErrorMessage(err, fallback = 'Request failed') {
  const data = err?.response?.data;
  const code = data?.code || data?.errorType;

  if (data?.message && data.message !== 'Internal server error') return data.message;
  if (code && ERROR_MESSAGES[code]) return ERROR_MESSAGES[code];

  if (!err?.response && err?.message === 'Network Error') {
    return 'Cannot reach the server. Check that the backend is running.';
  }

  return (
    data?.error ||
    err?.message ||
    fallback
  );
}

export function getApiFieldError(err) {
  const data = err?.response?.data;
  if (!data?.field || !data?.message) return null;
  return {
    field: data.field,
    message: data.message,
    errorType: data.errorType,
    statusCode: data.statusCode,
  };
}

