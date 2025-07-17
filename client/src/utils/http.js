import axios from 'axios';
import { getApiConfig } from '../config/api';

// Create axios instance with base configuration
const http = axios.create({
  baseURL: 'https://kidora.onrender.com/api',
  // timeout: getApiConfig().timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
http.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// Helper functions for common HTTP methods
export const api = {
  // GET request
  get: (url, config = {}) => http.get(url, config),
  
  // POST request
  post: (url, data = {}, config = {}) => http.post(url, data, config),
  
  // PUT request
  put: (url, data = {}, config = {}) => http.put(url, data, config),
  
  // DELETE request
  delete: (url, config = {}) => http.delete(url, config),
  
  // PATCH request
  patch: (url, data = {}, config = {}) => http.patch(url, data, config),
  
  // File upload with FormData
  upload: (url, formData, config = {}) => {
    return http.post(url, formData, {
      ...config,
      headers: {
        ...config.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Export the axios instance for direct use if needed
export default http;

// Export the base URL for debugging
export { API_BASE_URL } from '../config/api'; 