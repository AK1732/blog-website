import api from './api';

const LOCAL_BLOGS_KEY = 'bluepurple_local_blogs';

function readLocalBlogs() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_BLOGS_KEY) || '[]');
  } catch {
    return [];
  }
}

function writeLocalBlogs(blogs) {
  localStorage.setItem(LOCAL_BLOGS_KEY, JSON.stringify(blogs));
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
  const { data } = await api.get(`/blogs/${id}`);
  return data.blog;
}

export async function createBlog(payload) {
  try {
    const { data } = await api.post('/blogs', payload);
    return data.blog;
  } catch {
    const localBlog = {
      id: crypto.randomUUID(),
      ...payload,
      category_name: payload.category_id || 'General',
      author_name: 'Local Publisher',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    writeLocalBlogs([localBlog, ...readLocalBlogs()]);
    return localBlog;
  }
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
