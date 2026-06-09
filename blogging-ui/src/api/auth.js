import axios from 'axios';

// Change this if your API is running elsewhere
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function loginRequest({ email, password }) {
  const res = await axios.post(`${API_BASE_URL}/api/login`, { email, password });
  return res.data; // expected: { token }
}

