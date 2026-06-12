import { Router } from 'express';

import { getAdminDashboardStats, getWriterDashboardStats } from '../controllers/dashboardController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/dashboard/stats', authenticateUser, requireAdmin, getAdminDashboardStats);
router.get('/writer/dashboard/stats', authenticateUser, getWriterDashboardStats);

export default router;
