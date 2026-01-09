// API Service Layer
// Centralized API client with axios for Janus Backend

import axios from 'axios';

// Base URL - for Wails app, this can be configured
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://janus-interaction-api.onrender.com/';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

// Token management
const TOKEN_KEY = 'janus_auth_token';
const USER_KEY = 'janus_user';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = () => localStorage.removeItem(TOKEN_KEY);

export const getStoredUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};
export const setStoredUser = (user) => localStorage.setItem(USER_KEY, JSON.stringify(user));
export const removeStoredUser = () => localStorage.removeItem(USER_KEY);

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - clear auth
      removeToken();
      removeStoredUser();
      // Redirect to login if not already there
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== AUTH API ==========

export const authAPI = {
  register: async (name, email, password) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.success && response.data.data?.token) {
      setToken(response.data.data.token);
      setStoredUser(response.data.data.user);
    }
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  logout: () => {
    removeToken();
    removeStoredUser();
  },
};

// ========== JOB SUBMISSION API ==========

export const submitAPI = {
  submitJob: async (jobData) => {
    const response = await api.post('/submit/job', jobData);
    return response.data;
  },

  submitBatch: async (batchData) => {
    const response = await api.post('/submit/batch', batchData);
    return response.data;
  },

  submitAtomicBatch: async (batchData) => {
    const response = await api.post('/submit/batch/atomic', batchData);
    return response.data;
  },
};

// ========== CONFIG API ==========

export const configAPI = {
  listConfigs: async () => {
    const response = await api.get('/configs');
    return response.data;
  },

  getActiveConfig: async () => {
    const response = await api.get('/configs/active');
    return response.data;
  },

  getConfig: async (id) => {
    const response = await api.get(`/configs/${id}`);
    return response.data;
  },

  createConfig: async (configData) => {
    const response = await api.post('/configs', configData);
    return response.data;
  },

  updateConfig: async (id, configData) => {
    const response = await api.put(`/configs/${id}`, configData);
    return response.data;
  },

  deleteConfig: async (id) => {
    const response = await api.delete(`/configs/${id}`);
    return response.data;
  },

  activateConfig: async (id) => {
    const response = await api.post(`/configs/${id}/activate`);
    return response.data;
  },

  deactivateConfig: async (id) => {
    const response = await api.post(`/configs/${id}/deactivate`);
    return response.data;
  },
};

// ========== JOBS API ==========

export const jobsAPI = {
  listJobs: async (params = {}) => {
    const response = await api.get('/jobs', { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/jobs/stats');
    return response.data;
  },

  getJob: async (id) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data;
  },
};

// ========== BATCHES API ==========

export const batchesAPI = {
  listBatches: async (params = {}) => {
    const response = await api.get('/batches', { params });
    return response.data;
  },

  getBatch: async (id) => {
    const response = await api.get(`/batches/${id}`);
    return response.data;
  },

  getBatchJobs: async (id, params = {}) => {
    const response = await api.get(`/batches/${id}/jobs`, { params });
    return response.data;
  },
};

// ========== HEALTH API ==========

export const healthAPI = {
  check: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  status: async () => {
    const response = await api.get('/status');
    return response.data;
  },
};

export default api;
