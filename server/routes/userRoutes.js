import { Router } from 'express';

import {
  createUser,
  deleteUser,
  getProfile,
  getUsers,
  updateProfile,
  updateUser,
} from '../controllers/userController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/users/profile', authenticateUser, getProfile);
router.put('/users/profile', authenticateUser, updateProfile);

router.get('/users', authenticateUser, requireAdmin, getUsers);
router.post('/users', authenticateUser, requireAdmin, createUser);
router.put('/users/:id', authenticateUser, requireAdmin, updateUser);
router.delete('/users/:id', authenticateUser, requireAdmin, deleteUser);

export default router;
