import api from './api';

export async function getCategories() {
  const { data } = await api.get('/categories');
  return data.categories || [];
}

export async function createCategory(payload) {
  const { data } = await api.post('/categories', payload);
  return data.category;
}

export async function updateCategory(id, payload) {
  const { data } = await api.put(`/categories/${id}`, payload);
  return data.category;
}

export async function deleteCategory(id) {
  const { data } = await api.delete(`/categories/${id}`);
  return data;
}
