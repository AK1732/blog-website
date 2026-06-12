import { Router } from 'express';

import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/categories', getCategories);
router.post('/categories', authenticateUser, requireAdmin, createCategory);
router.put('/categories/:id', authenticateUser, requireAdmin, updateCategory);
router.delete('/categories/:id', authenticateUser, requireAdmin, deleteCategory);

export default router;

