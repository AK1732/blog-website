import { Router } from 'express';
import {
  debugVerification,
  forgotPassword,
  login,
  logout,
  register,
  resetPassword,
  verifyEmail,
} from '../controllers/authController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', authenticateUser, logout);
router.get('/auth/verify-email/:token', verifyEmail);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);
router.get('/debug/verification/:email', authenticateUser, requireAdmin, debugVerification);

export default router;

