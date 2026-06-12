import api from './api';

export async function getDashboardStats() {
  const { data } = await api.get('/dashboard/stats');
  return data.stats;
}

export async function getWriterDashboardStats() {
  const { data } = await api.get('/writer/dashboard/stats');
  return data.stats;
}
