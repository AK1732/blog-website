import { Router } from 'express';

import { createTag, getTags } from '../controllers/tagController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { CACHE_TTL, cacheResponse } from '../middleware/cache.js';

const router = Router();

router.get('/tags', cacheResponse('tags:list', CACHE_TTL.TAGS), getTags);
router.post('/tags', authenticateUser, requireAdmin, createTag);

export default router;
