import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401s
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/* Auth endpoints */
export const register = (data) => {
  return api.post('/auth/register', data);
};

export const login = (email, password) => {
  return api.post('/auth/login', { email, password });
};

export const updateProfile = (data) => {
  return api.put('/auth/profile', data);
};

/* Setu endpoints */
export const createConsent = () => {
  return api.post('/setu/create-consent');
};

export const getConsentStatus = (consentId) => {
  return api.get(`/setu/status/${consentId}`);
};

export const fetchDashboard = () => {
  return api.get('/insights/dashboard');
};

export const fetchMonthlyTrend = () => {
  return api.get('/insights/monthly-trend');
};

export const fetchRisk = () => {
  return api.get('/insights/risk');
};

export const fetchQuarter = (quarterFile) => {
  return api.get(`/insights/quarter/${quarterFile}`);
};

/* Subscription endpoints */
export const cancelSubscriptions = (names) => {
  return api.post('/subscriptions/cancel', { subscription_names: names });
};

export const fetchSubscriptions = () => {
  return api.get('/insights/subscriptions');
};

/* Card Wins endpoints */
export const fetchCardWinsSummary = () => {
  return api.get('/insights/card-wins/summary');
};

/* Demo endpoints */
export const loadDemoProfile = (profile) => api.post(`/demo/load/${profile}`, {}, { timeout: 120000 });
export const listDemoProfiles = () => api.get('/demo/profiles');

export default api;
