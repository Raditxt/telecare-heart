import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor untuk attach token
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

// Response interceptor untuk handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Patients API
export const patientsApi = {
  getAll: (params) => api.get('/patients', { params }),
  getById: (patientId) => api.get(`/patients/${patientId}`),
  create: (data) => api.post('/patients', data),
  update: (patientId, data) => api.put(`/patients/${patientId}`, data),
  delete: (patientId) => api.delete(`/patients/${patientId}`),
  search: (query) => api.get(`/patients/search/quick?q=${query}`),
  getStats: (patientId, period) => api.get(`/patients/${patientId}/stats?period=${period}`),
  exportData: (patientId, format) => api.get(`/patients/${patientId}/export?format=${format}`),
};

// Vitals API
export const vitalsApi = {
  getPatientVitals: (patientId, params) => api.get(`/vitals/patient/${patientId}`, { params }),
  getLatestVital: (patientId) => api.get(`/vitals/patient/${patientId}/latest`),
  getCriticalAlerts: (limit) => api.get(`/vitals/alerts/critical?limit=${limit}`),
  getStatistics: (patientId, period) => api.get(`/vitals/patient/${patientId}/statistics?period=${period}`),
};

// Dashboard API
export const dashboardApi = {
  getDoctorOverview: () => api.get('/dashboard/doctor/overview'),
  getFamilyOverview: () => api.get('/dashboard/family/overview'),
  getPatientDashboard: (patientId) => api.get(`/dashboard/patient/${patientId}`),
  getActivityLog: (limit) => api.get(`/dashboard/activity/log?limit=${limit}`),
  getMetricsSummary: (period) => api.get(`/dashboard/metrics/summary?period=${period}`),
};

// Assignments API
export const assignmentsApi = {
  assignDoctor: (data) => api.post('/assignments/doctor', data),
  assignFamily: (data) => api.post('/assignments/family', data),
  getPatientAssignments: (patientId) => api.get(`/assignments/patient/${patientId}`),
  removeDoctor: (doctorId, patientId) => api.delete(`/assignments/doctor/${doctorId}/patient/${patientId}`),
  updateFamilyAssignment: (familyId, patientId, data) => 
    api.put(`/assignments/family/${familyId}/patient/${patientId}`, data),
  getAvailableDoctors: (search) => api.get(`/assignments/available/doctors?search=${search || ''}`),
  getAvailableFamily: (search) => api.get(`/assignments/available/family?search=${search || ''}`),
};

// Auth API
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout'),
  updateProfile: (userId, data) => api.put(`/auth/profile/${userId}`, data),
};

export default api;