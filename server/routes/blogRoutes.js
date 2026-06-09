import { Router } from 'express';

import {
  createBlog,
  deleteBlog,
  getBlogById,
  getBlogs,
  publishBlog,
  updateBlog,
} from '../controllers/blogController.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/blogs', getBlogs);
router.get('/blogs/:id', getBlogById);
router.post('/blogs', requireAuth, createBlog);
router.put('/blogs/:id', requireAuth, updateBlog);
router.delete('/blogs/:id', requireAuth, deleteBlog);
router.patch('/blogs/:id/publish', requireAuth, publishBlog);

export default router;

