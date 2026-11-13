import axios from 'axios';
import { getReporterId } from '../utils/session';

// The backend endpoints are mounted at /api in FastAPI.
// In dev Vite proxies /api -> http://localhost:8000/api
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const reporterId = getReporterId();
  if (reporterId) {
    config.headers['X-Reporter-Token'] = reporterId;
  }
  return config;
});

export default api;
