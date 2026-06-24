import { Router } from 'express';

import { getAdminDashboardStats, getWriterDashboardStats } from '../controllers/dashboardController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';
import { CACHE_TTL, cacheResponse } from '../middleware/cache.js';

const router = Router();

router.get('/dashboard/stats', authenticateUser, requireAdmin, cacheResponse('dashboard:analytics', CACHE_TTL.ANALYTICS), getAdminDashboardStats);
router.get('/writer/dashboard/stats', authenticateUser, cacheResponse('dashboard:analytics', CACHE_TTL.ANALYTICS), getWriterDashboardStats);

export default router;
