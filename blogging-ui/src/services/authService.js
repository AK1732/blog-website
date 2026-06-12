import api from './api';
import { clearToken, setToken } from '../utils/authStorage';

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  if (data.token) setToken(data.token);
  if (data.user) localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  if (data.token) setToken(data.token);
  if (data.user) localStorage.setItem('auth_user', JSON.stringify(data.user));
  return data;
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('auth_user') || 'null');
  } catch {
    return null;
  }
}

export function logout() {
  clearToken();
  localStorage.removeItem('auth_user');
}
