import api from '../services/api';
import { getToken, setToken as saveToken, clearToken } from '../utils/authStorage';

export const apiClient = api;

export function setAuthToken(token = getToken()) {
  if (token) {
    saveToken(token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    clearToken();
    delete api.defaults.headers.common.Authorization;
  }
}

