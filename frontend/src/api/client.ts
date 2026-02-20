import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';
console.log('[DEBUG] API baseURL:', baseURL);
console.log('[DEBUG] VITE_API_URL env:', import.meta.env.VITE_API_URL);

const client = axios.create({
  baseURL,
});

// Automatically attach JWT token to every request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;