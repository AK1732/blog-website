import { getMongoLogDb, isMongoLoggingConfigured } from '../config/mongo.js';

const COLLECTIONS = {
  activity: 'activity_logs',
  error: 'error_logs',
  login: 'login_logs',
  blog: 'blog_logs',
};

function getTimestamp(timestamp) {
  return timestamp ? new Date(timestamp) : new Date();
}

function serializeError(error) {
  if (!error) return undefined;

  return {
    message: error.message,
    name: error.name,
    code: error.code,
    errorType: error.errorType,
    statusCode: error.statusCode,
    field: error.field,
    stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
  };
}

async function insertLog(collectionName, document) {
  if (!isMongoLoggingConfigured()) {
    return;
  }

  try {
    const db = await getMongoLogDb();
    await db.collection(collectionName).insertOne(document);
  } catch (error) {
    console.error('MongoDB log write failed:', error.message);
  }
}

export async function logActivity({ userId = null, action, details = {}, ipAddress = null, timestamp } = {}) {
  return insertLog(COLLECTIONS.activity, {
    userId,
    action,
    details,
    timestamp: getTimestamp(timestamp),
    ipAddress,
  });
}

export async function logLogin({ email, status, ipAddress = null, timestamp } = {}) {
  return insertLog(COLLECTIONS.login, {
    email,
    status,
    timestamp: getTimestamp(timestamp),
    ipAddress,
  });
}

export async function logBlog({ userId = null, blogId, action, timestamp } = {}) {
  return insertLog(COLLECTIONS.blog, {
    userId,
    blogId,
    action,
    timestamp: getTimestamp(timestamp),
  });
}

export async function logApiError({ req, error, normalized } = {}) {
  const document = {
    userId: req?.user?.id || null,
    action: 'API_ERROR',
    details: {
      method: req?.method,
      path: req?.originalUrl,
      statusCode: normalized?.statusCode || error?.statusCode || 500,
      errorType: normalized?.errorType || error?.errorType,
      code: normalized?.code || error?.code,
      message: normalized?.message || error?.message,
      error: serializeError(error),
    },
    ipAddress: req?.ip || null,
    timestamp: getTimestamp(),
  };

  await Promise.all([
    insertLog(COLLECTIONS.activity, document),
    insertLog(COLLECTIONS.error, document),
  ]);
}

export const loggerService = {
  logActivity,
  logLogin,
  logBlog,
  logApiError,
};
