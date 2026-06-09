import { Router } from 'express';

import {
  addComment,
  approveComment,
  deleteComment,
  getAllComments,
  getCommentsForBlog,
  rejectComment,
} from '../controllers/commentController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/comments', addComment);
router.get('/comments/blog/:blogId', getCommentsForBlog);

router.get('/comments', requireAuth, getAllComments);
router.patch('/comments/:id/approve', requireAuth, approveComment);
router.patch('/comments/:id/reject', requireAuth, rejectComment);
router.delete('/comments/:id', requireAuth, deleteComment);

export default router;

