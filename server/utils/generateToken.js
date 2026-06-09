import jwt from 'jsonwebtoken';

export function generateToken(user) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('Missing JWT_SECRET in environment variables');
  }

  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role },
    jwtSecret,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}
