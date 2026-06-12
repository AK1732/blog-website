const TOKEN_KEY = 'jwt_token';

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function isTokenUsable(token = getToken()) {
  if (!token) return false;

  try {
    const [, payload] = token.split('.');
    if (!payload) return false;
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (!decoded?.id || !decoded?.email || !decoded?.role) return false;
    if (decoded.exp && decoded.exp * 1000 <= Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

