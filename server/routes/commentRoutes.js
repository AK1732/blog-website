import { Router } from 'express';

import {
  addComment,
  approveComment,
  deleteComment,
  getAllComments,
  getCommentsForBlog,
  rejectComment,
} from '../controllers/commentController.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.post('/comments', addComment);
router.get('/comments/blog/:blogId', getCommentsForBlog);

router.get('/comments', authenticateUser, requireAdmin, getAllComments);
router.patch('/comments/:id/approve', authenticateUser, requireAdmin, approveComment);
router.patch('/comments/:id/reject', authenticateUser, requireAdmin, rejectComment);
router.delete('/comments/:id', authenticateUser, requireAdmin, deleteComment);

export default router;

