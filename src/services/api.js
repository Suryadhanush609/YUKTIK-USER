import axios from 'axios';

// The backend endpoints are mounted at /api in FastAPI.
// In dev Vite proxies /api -> http://localhost:8000/api
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export default api;
