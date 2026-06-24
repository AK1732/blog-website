import api from './api';

const LEGACY_LOCAL_BLOGS_KEY = 'bluepurple_local_blogs';
const LOCAL_BLOGS_KEY = 'insighthub_local_blogs';

function readLocalBlogs() {
  try {
    const current = localStorage.getItem(LOCAL_BLOGS_KEY);
    const legacy = localStorage.getItem(LEGACY_LOCAL_BLOGS_KEY);
    return JSON.parse(current || legacy || '[]');
  } catch {
    return [];
  }
}

export async function getBlogs(params = {}) {
  try {
    const { data } = await api.get('/blogs', { params });
    const rows = data.blogs || [];
    return rows.length ? rows : readLocalBlogs();
  } catch {
    return readLocalBlogs();
  }
}

export async function getBlog(id) {
  const { data } = await api.get(`/posts/${id}`);
  return data.blog;
}

export async function createBlog(payload) {
  const { data } = await api.post('/blogs', payload);
  return data.blog;
}

export async function updateBlog(id, payload) {
  const { data } = await api.put(`/blogs/${id}`, payload);
  return data.blog;
}

export async function deleteBlog(id) {
  const { data } = await api.delete(`/blogs/${id}`);
  return data;
}

export async function publishBlog(id) {
  const { data } = await api.patch(`/blogs/${id}/publish`);
  return data.blog;
}

export async function getBlogsResponse(params = {}) {
  const { data } = await api.get('/blogs', { params });
  return data;
}

export async function getFeaturedBlogs(params = {}) {
  const { data } = await api.get('/blogs/featured', { params });
  return data.blogs || [];
}

export async function unpublishBlog(id) {
  const { data } = await api.patch(`/blogs/${id}/unpublish`);
  return data.blog;
}

export async function submitBlog(id) {
  const { data } = await api.patch(`/blogs/${id}/submit`);
  return data.blog;
}

export async function approveBlog(id) {
  const { data } = await api.patch(`/blogs/${id}/approve`);
  return data.blog;
}

export async function rejectBlog(id) {
  const { data } = await api.patch(`/blogs/${id}/reject`);
  return data.blog;
}

export async function setFeaturedBlog(id, featured) {
  const { data } = await api.patch(`/blogs/${id}/featured`, { featured });
  return data.blog;
}
