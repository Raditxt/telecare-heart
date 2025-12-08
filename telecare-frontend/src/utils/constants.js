// Vital thresholds
export const VITAL_THRESHOLDS = {
  heart_rate: {
    normal: { min: 60, max: 100 },
    warning: { min: 50, max: 120 },
    critical: { min: 40, max: 140 }
  },
  spo2: {
    normal: { min: 95, max: 100 },
    warning: { min: 90, max: 95 },
    critical: { min: 0, max: 90 }
  },
  temperature: {
    normal: { min: 36.0, max: 37.5 },
    warning: { min: 35.0, max: 39.0 },
    critical: { min: 0, max: 45.0 }
  }
};

// User roles
export const USER_ROLES = {
  DOCTOR: 'doctor',
  FAMILY: 'family'
};

// Patient status colors
export const STATUS_COLORS = {
  critical: {
    bg: 'bg-red-100',
    text: 'text-red-800',
    border: 'border-red-200'
  },
  warning: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-800',
    border: 'border-yellow-200'
  },
  normal: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-200'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    VERIFY: '/auth/verify',
    LOGOUT: '/auth/logout'
  },
  PATIENTS: {
    BASE: '/patients',
    SEARCH: '/patients/search/quick',
    EXPORT: '/patients/:id/export'
  },
  VITALS: {
    PATIENT: '/vitals/patient/:id',
    LATEST: '/vitals/patient/:id/latest',
    ALERTS: '/vitals/alerts/critical'
  }
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  THEME: 'theme',
  LAST_PATIENT: 'last_patient_id'
};

// WebSocket event types
export const WS_EVENTS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CRITICAL_ALERT: 'critical_alert',
  VITAL_READING: 'vital_reading',
  PATIENT_STATUS_CHANGE: 'patient_status_change',
  DOCTOR_STATUS: 'doctor_status'
};