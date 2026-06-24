import { Router } from 'express';

import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/categoryController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { CACHE_TTL, cacheResponse } from '../middleware/cache.js';

const router = Router();

router.get('/categories', cacheResponse('categories:list', CACHE_TTL.CATEGORIES), getCategories);
router.post('/categories', authenticateUser, requireAdmin, createCategory);
router.put('/categories/:id', authenticateUser, requireAdmin, updateCategory);
router.delete('/categories/:id', authenticateUser, requireAdmin, deleteCategory);

export default router;

