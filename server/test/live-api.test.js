import test from 'node:test';
import assert from 'node:assert/strict';

const enabled = process.env.LIVE_API_TEST === '1';
const baseUrl = process.env.API_TEST_BASE_URL || 'http://127.0.0.1:5000/api';

async function request(path, { token, method = 'GET', body, expected = 200 } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  assert.equal(response.status, expected, `${method} ${path}: ${JSON.stringify(data)}`);
  return data;
}

test('live draft, comment, category, and tag APIs', { skip: !enabled, timeout: 60_000 }, async () => {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const categoryName = `API Test ${suffix}`;
  const tagName = `Tag ${suffix}`;
  const writerEmail = `api-test-${suffix}@example.com`;
  const createdBlogUuids = [];
  let categoryId;
  let tagId;
  let writerId;
  let adminToken;

  try {
    const login = await request('/auth/login', {
      method: 'POST',
      body: { email: 'admin@blog.com', password: 'admin123' },
    });
    adminToken = login.token;

    await request('/categories', { token: adminToken });
    await request('/categories', { method: 'POST', body: { name: categoryName }, expected: 401 });

    const writer = await request('/users', {
      method: 'POST', token: adminToken, expected: 201,
      body: { name: 'API Test Writer', email: writerEmail, password: 'password123', role: 'writer' },
    });
    writerId = writer.user.id;
    const writerLogin = await request('/auth/login', {
      method: 'POST', body: { email: writerEmail, password: 'password123' },
    });
    const writerToken = writerLogin.token;

    await request('/categories', { token: writerToken });
    await request('/categories', {
      method: 'POST', token: writerToken, body: { name: categoryName }, expected: 403,
    });
    const category = await request('/categories', {
      method: 'POST', token: adminToken, expected: 201, body: { name: categoryName },
    });
    categoryId = category.category.id;
    await request(`/categories/${categoryId}`, {
      method: 'PUT', token: adminToken, body: { name: `${categoryName} Updated` },
    });
    await request('/categories/bad-id', {
      method: 'PUT', token: adminToken, body: { name: categoryName }, expected: 400,
    });

    const tag = await request('/tags', {
      method: 'POST', token: adminToken, expected: 201, body: { name: tagName },
    });
    tagId = tag.tag.id;
    const tags = await request('/tags');
    assert.ok(tags.tags.some((item) => item.id === tagId));

    const draft = await request('/drafts', {
      method: 'POST', token: writerToken, expected: 201,
      body: { title: `Writer Draft ${suffix}`, content: '<p>Writer body</p>', category_id: categoryId, tag_ids: [tagId] },
    });
    const draftId = draft.draft.id;
    const drafts = await request('/drafts', { token: writerToken });
    assert.ok(drafts.drafts.some((item) => item.id === draftId));
    await request(`/drafts/${draftId}`, {
      method: 'PUT', token: writerToken, body: { title: `Writer Draft Updated ${suffix}` },
    });
    const writerPublish = await request(`/drafts/${draftId}/publish`, {
      method: 'POST', token: writerToken, expected: 201,
    });
    assert.equal(writerPublish.blog.status, 'draft');
    assert.equal(writerPublish.blog.approval_status, 'pending');
    createdBlogUuids.push(writerPublish.blog.uuid);
    await request(`/drafts/${draftId}`, { token: writerToken, expected: 404 });

    const throwaway = await request('/drafts', {
      method: 'POST', token: writerToken, expected: 201, body: { title: 'Delete me' },
    });
    await request(`/drafts/${throwaway.draft.id}`, { method: 'DELETE', token: writerToken });

    const adminDraft = await request('/drafts', {
      method: 'POST', token: adminToken, expected: 201,
      body: { title: `Published Draft ${suffix}`, content: '<p>Published body</p>', category_id: categoryId, tag_ids: [tagId] },
    });
    const adminPublish = await request(`/drafts/${adminDraft.draft.id}/publish`, {
      method: 'POST', token: adminToken, expected: 201,
    });
    assert.equal(adminPublish.blog.status, 'published');
    assert.equal(adminPublish.blog.approval_status, 'approved');
    createdBlogUuids.push(adminPublish.blog.uuid);

    const filtered = await request(`/posts?tagId=${tagId}`);
    assert.ok(filtered.blogs.some((item) => item.uuid === adminPublish.blog.uuid));
    const linked = await request(`/posts/${adminPublish.blog.uuid}`);
    assert.equal(linked.blog.category_id, categoryId);
    assert.ok(linked.blog.tags.some((item) => item.id === tagId));
    await request('/posts?tagId=bad', { expected: 400 });

    const ownComment = await request(`/posts/${adminPublish.blog.uuid}/comments`, {
      method: 'POST', token: writerToken, expected: 201,
      body: { name: 'Writer', email: writerEmail, comment: 'Owner deletion test' },
    });
    assert.equal(ownComment.comment.user_id, writerId);
    await request(`/comments/${ownComment.comment.id}`, { method: 'DELETE', token: writerToken });

    const moderatedComment = await request(`/posts/${adminPublish.blog.uuid}/comments`, {
      method: 'POST', token: writerToken, expected: 201,
      body: { name: 'Writer', email: writerEmail, comment: 'Moderation test' },
    });
    await request(`/comments/${moderatedComment.comment.id}/approve`, { method: 'PATCH', token: adminToken });
    const comments = await request(`/posts/${adminPublish.blog.uuid}/comments`);
    assert.ok(comments.comments.some((item) => item.id === moderatedComment.comment.id));
    await request(`/comments/${moderatedComment.comment.id}`, { method: 'DELETE', token: adminToken });
    await request('/comments/not-an-id', { method: 'DELETE', token: adminToken, expected: 400 });

  } finally {
    for (const uuid of createdBlogUuids) {
      try {
        await request(`/posts/${uuid}`, { method: 'DELETE', token: adminToken });
      } catch {}
    }
    if (categoryId && adminToken) {
      try { await request(`/categories/${categoryId}`, { method: 'DELETE', token: adminToken }); } catch {}
    }
    if (writerId && adminToken) {
      try { await request(`/users/${writerId}`, { method: 'DELETE', token: adminToken }); } catch {}
    }
  }
});
