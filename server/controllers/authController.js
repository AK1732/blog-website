import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { query } from '../config/database.js';
import { sendEmail } from '../services/emailService.js';
import { generateToken } from '../utils/generateToken.js';
import { loggerService } from '../services/loggerService.js';
import { authError, validationError } from '../utils/appError.js';

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function getVerificationExpires() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000);
}

export async function register(req, res) {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    throw validationError('name, email, and password are required');
  }

  if (!isValidEmail(email)) {
    throw validationError('valid email is required', 'email');
  }

  if (password.length < 8) {
    throw validationError('Password must be at least 8 characters', 'password');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const { rows } = await query('SELECT id, name, email FROM users WHERE email = $1', [normalizedEmail]);
  if (rows.length) throw validationError('Email already registered', 'email');

  const passwordHash = await bcrypt.hash(String(password), 12);
  const verificationToken = crypto.randomBytes(32).toString('hex');
  const verificationExpires = getVerificationExpires();
  console.log('[email-verification:register] generated token', {
    email: normalizedEmail,
    verificationToken,
    verificationExpires: verificationExpires.toISOString(),
  });
  const insert = await query(
    `INSERT INTO users (name, email, password, role, email_verified, verification_token, verification_token_expires)
     VALUES ($1, $2, $3, 'writer', FALSE, $4, $5)
     RETURNING id, name, email, role, email_verified, verification_token, verification_token_expires`,
    [String(name).trim(), normalizedEmail, passwordHash, verificationToken, verificationExpires]
  );

  const user = insert.rows[0];
  console.log('[email-verification:register] stored token', {
    email: user.email,
    storedToken: user.verification_token,
    verificationExpires: user.verification_token_expires,
  });
  const verifyUrl = `${process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${verificationToken}`;
  await sendEmail({
    to: user.email,
    subject: 'Verify your blog account',
    text: `Verify your email using this link: ${verifyUrl}`,
  });
  await loggerService.logActivity({
    userId: user.id,
    action: 'USER_REGISTRATION',
    details: { role: user.role, verificationToken },
    ipAddress: req.ip,
  });
  return res.status(201).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
    },
    message: 'Registration successful. Please verify your email before login.',
  });

}

export async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    throw validationError('email and password are required');
  }

  if (!isValidEmail(email)) {
    throw validationError('valid email is required', 'email');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const { rows } = await query(
    'SELECT id, name, email, password, role, email_verified FROM users WHERE email = $1',
    [normalizedEmail]
  );
  const user = rows[0];
  if (!user) {
    await loggerService.logLogin({
      email: normalizedEmail,
      status: 'FAILED_ACCOUNT_NOT_FOUND',
      ipAddress: req.ip,
    });
    throw authError('Email does not exist');
  }

  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) {
    await loggerService.logLogin({
      email: normalizedEmail,
      status: 'FAILED_INCORRECT_PASSWORD',
      ipAddress: req.ip,
    });
    throw authError('Incorrect password');
  }

  if (!user.email_verified) {
    throw authError('Please verify your email before login');
  }

  const token = generateToken(user);
  await loggerService.logLogin({
    email: user.email,
    status: 'SUCCESS',
    ipAddress: req.ip,
  });
  await loggerService.logActivity({
    userId: user.id,
    action: 'USER_LOGIN',
    details: {},
    ipAddress: req.ip,
  });
  return res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
}

export async function verifyEmail(req, res) {
  const { token } = req.params;
  console.log('[email-verification:verify] received token', { token });

  const lookup = await query(
    `SELECT id, name, email, role, email_verified, verification_token, verification_token_expires
     FROM users
     WHERE verification_token = $1`,
    [token]
  );
  const user = lookup.rows[0];
  console.log('[email-verification:verify] DB query result', {
    rowCount: lookup.rowCount,
    email: user?.email,
    isVerified: user?.email_verified,
    storedToken: user?.verification_token,
    verificationExpires: user?.verification_token_expires,
  });

  if (!user) throw validationError('Invalid verification token', 'token');

  const expiresAt = user.verification_token_expires ? new Date(user.verification_token_expires) : null;
  if (expiresAt && expiresAt.getTime() <= Date.now()) {
    throw validationError('Verification token expired', 'token');
  }

  if (user.email_verified) {
    return res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, email_verified: true },
      message: 'Email verified. You can now login.',
    });
  }

  const result = await query(
    `UPDATE users
     SET email_verified = TRUE
     WHERE id = $1
     RETURNING id, name, email, role, email_verified, verification_token, verification_token_expires`,
    [user.id]
  );
  console.log('[email-verification:verify] update result', {
    rowCount: result.rowCount,
    email: result.rows[0]?.email,
    isVerified: result.rows[0]?.email_verified,
    storedToken: result.rows[0]?.verification_token,
    verificationExpires: result.rows[0]?.verification_token_expires,
  });

  await loggerService.logActivity({
    userId: result.rows[0].id,
    action: 'EMAIL_VERIFIED',
    details: {},
    ipAddress: req.ip,
  });
  return res.json({
    user: {
      id: result.rows[0].id,
      name: result.rows[0].name,
      email: result.rows[0].email,
      role: result.rows[0].role,
      email_verified: result.rows[0].email_verified,
    },
    message: 'Email verified. You can now login.',
  });
}

export async function debugVerification(req, res) {
  const normalizedEmail = String(req.params.email || '').trim().toLowerCase();
  if (!isValidEmail(normalizedEmail)) {
    throw validationError('valid email is required', 'email');
  }

  const { rows } = await query(
    `SELECT email, email_verified, verification_token, verification_token_expires
     FROM users
     WHERE email = $1`,
    [normalizedEmail]
  );
  const user = rows[0];

  return res.json({
    email: normalizedEmail,
    isVerified: user?.email_verified ?? null,
    verificationToken: user?.verification_token ?? null,
    verificationExpires: user?.verification_token_expires ?? null,
  });
}

export async function forgotPassword(req, res) {
  const { email } = req.body || {};
  if (!email || !isValidEmail(email)) {
    throw validationError('valid email is required', 'email');
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000);
  const result = await query(
    `UPDATE users
     SET reset_token = $2, reset_token_expires = $3
     WHERE email = $1
     RETURNING id, email`,
    [normalizedEmail, token, expires]
  );

  if (result.rowCount) {
    const resetUrl = `${process.env.APP_URL || process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${token}`;
    await sendEmail({
      to: normalizedEmail,
      subject: 'Reset your blog password',
      text: `Reset your password using this link: ${resetUrl}`,
    });
    await loggerService.logActivity({
      userId: result.rows[0].id,
      action: 'PASSWORD_RESET_REQUEST',
      details: { resetToken: token },
      ipAddress: req.ip,
    });
  }

  return res.json({ message: 'If that email exists, a password reset link has been sent.' });
}

export async function resetPassword(req, res) {
  const { token, password } = req.body || {};
  if (!token || !password) throw validationError('token and password are required');
  if (String(password).length < 8) throw validationError('Password must be at least 8 characters', 'password');

  const passwordHash = await bcrypt.hash(String(password), 12);
  const result = await query(
    `UPDATE users
     SET password = $2, reset_token = NULL, reset_token_expires = NULL
     WHERE reset_token = $1 AND reset_token_expires > NOW()
     RETURNING id, email`,
    [token, passwordHash]
  );
  if (!result.rowCount) throw validationError('Invalid or expired reset token', 'token');

  await loggerService.logActivity({
    userId: result.rows[0].id,
    action: 'PASSWORD_RESET_COMPLETE',
    details: {},
    ipAddress: req.ip,
  });
  return res.json({ message: 'Password reset successful. You can now login.' });
}

export async function logout(req, res) {
  await loggerService.logActivity({
    userId: req.user?.id || null,
    action: 'USER_LOGOUT',
    details: {},
    ipAddress: req.ip,
  });

  return res.json({ message: 'Logged out' });
}

