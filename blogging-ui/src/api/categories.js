import { apiClient } from './client';

export async function fetchCategories() {
  const res = await apiClient.get('/categories');
  return res.data; // { categories: [] }
}

export async function createCategory({ name }) {
  const res = await apiClient.post('/categories', { name });
  return res.data; // { category }
}

export async function updateCategory(id, { name }) {
  const res = await apiClient.put(`/categories/${id}`, { name });
  return res.data; // { category }
}

export async function deleteCategory(id) {
  const res = await apiClient.delete(`/categories/${id}`);
  return res.data; // { message }
}

