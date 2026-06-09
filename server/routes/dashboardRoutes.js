import { Router } from 'express';

import { getDashboardStats } from '../controllers/dashboardController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard/stats', requireAuth, getDashboardStats);

export default router;
