import { Router } from 'express';

import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/categories', getCategories);
router.post('/categories', requireAuth, createCategory);
router.put('/categories/:id', requireAuth, updateCategory);
router.delete('/categories/:id', requireAuth, deleteCategory);

export default router;

