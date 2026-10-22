import axios from 'axios';

const api = axios.create({
  baseURL: '/api'
});

// Attach Authorization header if JWT token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('foodlab_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Global response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear token
      localStorage.removeItem('foodlab_token');
      localStorage.removeItem('foodlab_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
