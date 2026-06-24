import api from './api';

export async function autosaveDraft(id, payload) {
  const { data } = await api.post(`/drafts/${id || 'session'}/autosave`, payload);
  return data.autosave;
}
