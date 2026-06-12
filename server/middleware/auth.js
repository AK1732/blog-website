import jwt from 'jsonwebtoken';

function verifyToken(token) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    const error = new Error('Server misconfigured');
    error.statusCode = 500;
    throw error;
  }

  return jwt.verify(token, jwtSecret);
}

export function authenticateUser(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      return res.status(401).json({ message: 'Missing token' });
    }

    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return res.status(err.statusCode || 401).json({ message: err.statusCode === 500 ? err.message : 'Invalid or expired token' });
  }
}

export function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');
    if (token) req.user = verifyToken(token);
  } catch {
    req.user = null;
  }
  return next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  return next();
}

export function requireWriter(req, res, next) {
  if (!['writer', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Writer access required' });
  }
  return next();
}

export const requireAuth = authenticateUser;

