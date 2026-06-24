import { apiClient } from './client';

export async function fetchBlogs({ status, q } = {}) {
  const res = await apiClient.get('/blogs', { params: { status, q } });
  return res.data; // { blogs: [] }
}

export async function fetchBlog(id) {
  const res = await apiClient.get(`/posts/${id}`);
  return res.data; // { blog }
}

export async function createBlog(payload) {
  const res = await apiClient.post('/blogs', payload);
  return res.data; // blog
}

export async function updateBlog(id, payload) {
  const res = await apiClient.put(`/blogs/${id}`, payload);
  return res.data; // { blog }
}

export async function deleteBlog(id) {
  const res = await apiClient.delete(`/blogs/${id}`);
  return res.data; // { message }
}

