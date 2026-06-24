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

export async function verifyEmail(token) {
  const { data } = await api.get(`/auth/verify-email/${token}`);
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(token, password) {
  const { data } = await api.post('/auth/reset-password', { token, password });
  return data;
}

export function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem('auth_user') || 'null');
  } catch {
    return null;
  }
}

export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // The client session should still be cleared if the server is unreachable.
  }
  clearToken();
  localStorage.removeItem('auth_user');
}
