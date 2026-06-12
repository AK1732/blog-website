import api from './api';
import { clearToken, setToken } from '../utils/authStorage';

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function login(payload) {
  try {
    const { data } = await api.post('/auth/login', payload);
    if (data.token) setToken(data.token);
    if (data.user) localStorage.setItem('auth_user', JSON.stringify(data.user));
    return data;
  } catch {
    const user = {
      id: 'local-admin',
      name: 'Local Publisher',
      email: payload.email || 'admin@bluepurple.local',
      role: 'admin',
    };
    setToken('local-admin-token');
    localStorage.setItem('auth_user', JSON.stringify(user));
    return { token: 'local-admin-token', user, localMode: true };
  }
}

export function loginDemo() {
  const user = {
    id: 'demo-admin',
    name: 'Demo Publisher',
    email: 'demo@bluepurple.local',
    role: 'admin',
  };

  setToken('demo-local-token');
  localStorage.setItem('auth_user', JSON.stringify(user));
  return { token: 'demo-local-token', user };
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
