import api from './api';

export async function getUsers() {
  const { data } = await api.get('/users');
  return data.users || [];
}

export async function createUser(payload) {
  const { data } = await api.post('/users', payload);
  return data.user;
}

export async function updateUser(id, payload) {
  const { data } = await api.put(`/users/${id}`, payload);
  return data.user;
}

export async function deleteUser(id) {
  const { data } = await api.delete(`/users/${id}`);
  return data;
}

export async function getProfile() {
  const { data } = await api.get('/users/profile');
  return data.user;
}

export async function updateProfile(payload) {
  const { data } = await api.put('/users/profile', payload);
  return data.user;
}
