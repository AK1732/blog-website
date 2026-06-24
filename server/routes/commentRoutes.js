import { Router } from 'express';

import {
  addComment,
  approveComment,
  deleteComment,
  getAllComments,
  getCommentsForBlog,
  rejectComment,
} from '../controllers/commentController.js';
import { authenticateUser, optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/posts/:uuid/comments', getCommentsForBlog);
router.post('/posts/:uuid/comments', optionalAuth, addComment);
router.get('/blogs/:blogId/comments', getCommentsForBlog);
router.post('/blogs/:blogId/comments', optionalAuth, addComment);
router.post('/comments', optionalAuth, addComment);
router.get('/comments/blog/:blogId', getCommentsForBlog);

router.get('/comments', authenticateUser, requireAdmin, getAllComments);
router.patch('/comments/:id/approve', authenticateUser, requireAdmin, approveComment);
router.patch('/comments/:id/reject', authenticateUser, requireAdmin, rejectComment);
router.delete('/comments/:id', authenticateUser, deleteComment);

export default router;

