import api from './api';

export async function getTags() {
  const { data } = await api.get('/tags');
  return data.tags || [];
}

export async function createTag(payload) {
  const { data } = await api.post('/tags', payload);
  return data.tag;
}
