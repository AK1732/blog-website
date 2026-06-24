import { Router } from 'express';

import {
  createBlog,
  deleteBlog,
  getFeaturedBlogs,
  getBlogById,
  getBlogs,
  getTrendingBlogs,
  trackBlogView,
  approveBlog,
  publishBlog,
  rejectBlog,
  submitBlogForReview,
  setFeaturedBlog,
  unpublishBlog,
  updateBlog,
} from '../controllers/blogController.js';
import { authenticateUser, optionalAuth, requireAdmin, requireWriter } from '../middleware/auth.js';
import { CACHE_TTL, cacheResponse } from '../middleware/cache.js';

const router = Router();

router.get('/blogs', optionalAuth, cacheResponse('blogs:list', CACHE_TTL.BLOG_LIST), getBlogs);
router.get('/posts', optionalAuth, cacheResponse('blogs:list', CACHE_TTL.BLOG_LIST), getBlogs);
router.get('/posts/homepage', optionalAuth, cacheResponse('blogs:homepage', CACHE_TTL.HOMEPAGE_POSTS), getBlogs);
router.get('/posts/:uuid', optionalAuth, trackBlogView, cacheResponse('blogs:details', CACHE_TTL.BLOG_DETAILS), getBlogById);
router.get('/blogs/trending', cacheResponse('blogs:trending', CACHE_TTL.TRENDING_BLOGS), getTrendingBlogs);
router.get('/blogs/featured', cacheResponse('blogs:featured', CACHE_TTL.FEATURED_POSTS), getFeaturedBlogs);
router.get('/blogs/:id', optionalAuth, trackBlogView, cacheResponse('blogs:details', CACHE_TTL.BLOG_DETAILS), getBlogById);
router.post('/blogs', authenticateUser, requireWriter, createBlog);
router.post('/posts', authenticateUser, requireWriter, createBlog);
router.put('/posts/:uuid', authenticateUser, requireWriter, updateBlog);
router.delete('/posts/:uuid', authenticateUser, requireWriter, deleteBlog);
router.put('/blogs/:id', authenticateUser, requireWriter, updateBlog);
router.delete('/blogs/:id', authenticateUser, requireWriter, deleteBlog);
router.patch('/blogs/:id/submit', authenticateUser, requireWriter, submitBlogForReview);
router.patch('/blogs/:id/featured', authenticateUser, requireAdmin, setFeaturedBlog);
router.patch('/blogs/:id/publish', authenticateUser, requireAdmin, publishBlog);
router.patch('/blogs/:id/unpublish', authenticateUser, requireAdmin, unpublishBlog);
router.patch('/blogs/:id/approve', authenticateUser, requireAdmin, approveBlog);
router.patch('/blogs/:id/reject', authenticateUser, requireAdmin, rejectBlog);

export default router;

