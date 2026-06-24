import axios from 'axios';

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') ||
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000';

export async function loginRequest({ email, password }) {
  const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { email, password });
  return res.data; // expected: { token }
}

