import test from 'node:test';
import assert from 'node:assert/strict';

process.env.DB_HOST ||= 'localhost';
process.env.DB_PORT ||= '5432';
process.env.DB_USER ||= 'postgres';
process.env.DB_PASSWORD ||= 'postgres';
process.env.DB_NAME ||= 'blogging_website';
process.env.JWT_SECRET ||= 'test-secret';

function routeMap(router) {
  return new Map(router.stack
    .filter((layer) => layer.route)
    .map((layer) => {
      const method = Object.keys(layer.route.methods)[0].toUpperCase();
      return [`${method} ${layer.route.path}`, layer.route.stack.length];
    }));
}

test('draft API routes include authentication and writer authorization', async () => {
  const router = (await import('../routes/draftRoutes.js')).default;
  const routes = routeMap(router);
  for (const route of [
    'GET /drafts',
    'POST /drafts',
    'PUT /drafts/:id',
    'DELETE /drafts/:id',
    'POST /drafts/:id/publish',
  ]) assert.equal(routes.get(route), 3, route);
});

test('comment API routes expose public reads/creates and protected deletion', async () => {
  const router = (await import('../routes/commentRoutes.js')).default;
  const routes = routeMap(router);
  assert.equal(routes.get('GET /posts/:uuid/comments'), 1);
  assert.equal(routes.get('POST /posts/:uuid/comments'), 2);
  assert.equal(routes.get('DELETE /comments/:id'), 2);
});

test('category mutations are admin-only and reads remain frontend-compatible', async () => {
  const router = (await import('../routes/categoryRoutes.js')).default;
  const routes = routeMap(router);
  assert.equal(routes.get('GET /categories'), 2);
  assert.equal(routes.get('POST /categories'), 3);
  assert.equal(routes.get('PUT /categories/:id'), 3);
  assert.equal(routes.get('DELETE /categories/:id'), 3);
});

test('tag creation is admin-only and tag reads are available', async () => {
  const router = (await import('../routes/tagRoutes.js')).default;
  const routes = routeMap(router);
  assert.equal(routes.get('GET /tags'), 2);
  assert.equal(routes.get('POST /tags'), 3);
});

test('invalid category, comment, and tag filter ids return validation errors before SQL', async () => {
  const { updateCategory } = await import('../controllers/categoryController.js');
  const { deleteComment } = await import('../controllers/commentController.js');
  const { getBlogs } = await import('../controllers/blogController.js');
  const response = {};

  await assert.rejects(updateCategory({ params: { id: 'bad' }, body: { name: 'Tech' } }, response),
    (error) => error.statusCode === 400 && error.field === 'id');
  await assert.rejects(deleteComment({ params: { id: 'bad' }, user: { id: 1 } }, response),
    (error) => error.statusCode === 400 && error.field === 'id');
  await assert.rejects(getBlogs({ query: { tagId: 'bad' } }, response),
    (error) => error.statusCode === 400 && error.field === 'tagId');
});
