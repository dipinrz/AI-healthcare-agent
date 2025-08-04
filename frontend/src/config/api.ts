// API Configuration
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://ff8caf788ad5.ngrok-free.app/api',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    PROFILE: '/auth/profile',
    VERIFY: '/auth/verify',
    CHANGE_PASSWORD: '/auth/change-password',
    RESET_PASSWORD_REQUEST: '/auth/reset-password-request',
    RESET_PASSWORD_CONFIRM: '/auth/reset-password-confirm',
  },
  
  // Medications
  MEDICATIONS: {
    GET_ALL: '/medications',
    GET_BY_ID: (id: string) => `/medications/${id}`,
    CREATE: '/medications',
    UPDATE: (id: string) => `/medications/${id}`,
    DELETE: (id: string) => `/medications/${id}`,
  },
  
  // Prescriptions
  PRESCRIPTIONS: {
    GET_ALL: '/prescriptions',
    GET_BY_ID: (id: string) => `/prescriptions/${id}`,
    CREATE: '/prescriptions',
    UPDATE: (id: string) => `/prescriptions/${id}`,
    DELETE: (id: string) => `/prescriptions/${id}`,
  },
  
  // Patients
  PATIENTS: {
    GET_ALL: '/patients',
    GET_BY_ID: (id: string) => `/patients/${id}`,
    CREATE: '/patients',
    UPDATE: (id: string) => `/patients/${id}`,
    DELETE: (id: string) => `/patients/${id}`,
  },
  
  // Doctors
  DOCTORS: {
    GET_ALL: '/doctors',
    GET_BY_ID: (id: string) => `/doctors/${id}`,
    CREATE: '/doctors',
    UPDATE: (id: string) => `/doctors/${id}`,
    DELETE: (id: string) => `/doctors/${id}`,
  },
  
  // Appointments
  APPOINTMENTS: {
    GET_ALL: '/appointments',
    GET_BY_ID: (id: string) => `/appointments/${id}`,
    CREATE: '/appointments',
    UPDATE: (id: string) => `/appointments/${id}`,
    DELETE: (id: string) => `/appointments/${id}`,
  },
  
  // Chat
  CHAT: {
    SEND_MESSAGE: '/chat/message',
    GET_HISTORY: '/chat/history',
    GET_SESSIONS: '/chat/sessions',
    GET_SESSION: (id: string) => `/chat/sessions/${id}`,
  },
  
  // Health Records
  HEALTH_RECORDS: {
    GET_ALL: '/health-records',
    GET_BY_ID: (id: string) => `/health-records/${id}`,
    CREATE: '/health-records',
    UPDATE: (id: string) => `/health-records/${id}`,
    DELETE: (id: string) => `/health-records/${id}`,
  },
} as const;

// Helper function to build full URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Environment information
export const ENV_INFO = {
  API_BASE_URL: API_CONFIG.BASE_URL,
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'AI Healthcare',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  ENABLE_LOGGING: import.meta.env.VITE_ENABLE_LOGGING === 'true',
} as const;

// Log configuration in development
if (ENV_INFO.IS_DEVELOPMENT && ENV_INFO.ENABLE_LOGGING) {
  console.log('🔗 API Configuration:', {
    baseUrl: API_CONFIG.BASE_URL,
    environment: ENV_INFO.IS_DEVELOPMENT ? 'development' : 'production',
    appName: ENV_INFO.APP_NAME,
    version: ENV_INFO.APP_VERSION,
  });
}