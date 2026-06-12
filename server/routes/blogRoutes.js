import { Router } from 'express';

import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  approveBlog,
  publishBlog,
  rejectBlog,
  submitBlogForReview,
  unpublishBlog,
  updateBlog,
} from '../controllers/blogController.js';
import { authenticateUser, optionalAuth, requireAdmin, requireWriter } from '../middleware/auth.js';

const router = Router();

router.get('/blogs', optionalAuth, getBlogs);
router.get('/blogs/:id', optionalAuth, getBlogById);
router.post('/blogs', authenticateUser, requireWriter, createBlog);
router.put('/blogs/:id', authenticateUser, requireWriter, updateBlog);
router.delete('/blogs/:id', authenticateUser, requireWriter, deleteBlog);
router.patch('/blogs/:id/submit', authenticateUser, requireWriter, submitBlogForReview);
router.patch('/blogs/:id/publish', authenticateUser, requireAdmin, publishBlog);
router.patch('/blogs/:id/unpublish', authenticateUser, requireAdmin, unpublishBlog);
router.patch('/blogs/:id/approve', authenticateUser, requireAdmin, approveBlog);
router.patch('/blogs/:id/reject', authenticateUser, requireAdmin, rejectBlog);

export default router;

