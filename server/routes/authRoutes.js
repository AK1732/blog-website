import { Router } from 'express';
import { forgotPassword, login, logout, register, resetPassword, verifyEmail } from '../controllers/authController.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/logout', authenticateUser, logout);
router.get('/auth/verify-email/:token', verifyEmail);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

export default router;

