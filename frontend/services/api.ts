import axios from 'axios';

const api = axios.create({
  // In Docker, we need to use the service name instead of localhost
  baseURL: 'http://backend:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
