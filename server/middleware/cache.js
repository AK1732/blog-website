import { getRedisClient } from '../config/redis.js';

export const CACHE_TTL = {
  BLOG_LIST: 60 * 5,
  BLOG_DETAILS: 60 * 10,
  CATEGORIES: 60 * 30,
  TAGS: 60 * 30,
  ANALYTICS: 60 * 5,
  FEATURED_POSTS: 60 * 5,
  HOMEPAGE_POSTS: 60 * 5,
  TRENDING_BLOGS: 60 * 5,
};

function stableStringify(value) {
  if (!value || typeof value !== 'object') return String(value || '');
  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((acc, key) => {
        if (value[key] !== undefined && value[key] !== '') acc[key] = value[key];
        return acc;
      }, {})
  );
}

export function buildCacheKey(prefix, req) {
  const userScope = req.user
    ? `user:${req.user.id}:role:${req.user.role}`
    : 'public';
  const params = stableStringify(req.params);
  const query = stableStringify(req.query);
  return `${prefix}:${userScope}:params:${params}:query:${query}`;
}

export function cacheResponse(prefix, ttlSeconds) {
  return async function cacheMiddleware(req, res, next) {
    const key = buildCacheKey(prefix, req);

    try {
      const redis = await getRedisClient();
      if (!redis) {
        console.log(`Cache Miss: ${key} (Redis unavailable)`);
        return next();
      }

      const cached = await redis.get(key);
      if (cached) {
        console.log(`Cache Hit: ${key}`);
        return res.json(JSON.parse(cached));
      }

      console.log(`Cache Miss: ${key}`);
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redis
            .setEx(key, ttlSeconds, JSON.stringify(body))
            .catch((error) => console.warn(`Redis cache write failed for ${key}:`, error.message));
        }
        return originalJson(body);
      };
      return next();
    } catch (error) {
      console.warn(`Redis cache read failed for ${key}:`, error.message);
      return next();
    }
  };
}

async function deleteByPattern(redis, pattern) {
  let cursor = '0';
  do {
    const result = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 });
    cursor = String(result.cursor);
    if (result.keys.length) await redis.del(result.keys);
  } while (String(cursor) !== '0');
}

export async function invalidateCachePatterns(patterns = []) {
  try {
    const redis = await getRedisClient();
    if (!redis) return;

    await Promise.all(patterns.map((pattern) => deleteByPattern(redis, pattern)));
    console.log(`Cache invalidated: ${patterns.join(', ')}`);
  } catch (error) {
    console.warn('Redis cache invalidation failed:', error.message);
  }
}

export async function invalidateBlogCache() {
  await invalidateCachePatterns([
    'blogs:list:*',
    'blogs:details:*',
    'blogs:featured:*',
    'blogs:homepage:*',
    'blogs:trending:*',
    'dashboard:analytics:*',
  ]);
}

export async function invalidateTagCache() {
  await invalidateCachePatterns([
    'tags:list:*',
    'blogs:list:*',
    'blogs:details:*',
    'blogs:featured:*',
    'blogs:homepage:*',
    'blogs:trending:*',
  ]);
}

export async function invalidateCategoryCache() {
  await invalidateCachePatterns([
    'categories:list:*',
    'blogs:list:*',
    'blogs:details:*',
    'blogs:featured:*',
    'blogs:homepage:*',
    'blogs:trending:*',
  ]);
}
