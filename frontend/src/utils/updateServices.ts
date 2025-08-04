// Utility to show updated API usage pattern for remaining services
// This file shows the pattern to update the remaining service files

/*
For each service file, replace:

1. Import:
   FROM: const API_BASE_URL = 'http://localhost:3001/api';
   TO:   import { API_CONFIG, API_ENDPOINTS, buildApiUrl } from '../config/api';

2. API calls:
   FROM: `${API_BASE_URL}/medications`
   TO:   buildApiUrl(API_ENDPOINTS.MEDICATIONS.GET_ALL)
   
   FROM: `${API_BASE_URL}/patients`
   TO:   buildApiUrl(API_ENDPOINTS.PATIENTS.GET_ALL)
   
   FROM: `${API_BASE_URL}/doctors` 
   TO:   buildApiUrl(API_ENDPOINTS.DOCTORS.GET_ALL)
   
   FROM: `${API_BASE_URL}/appointments`
   TO:   buildApiUrl(API_ENDPOINTS.APPOINTMENTS.GET_ALL)

   And so on for other endpoints...
*/

export const SERVICE_UPDATE_PATTERN = {
  'medications': {
    getAll: 'API_ENDPOINTS.MEDICATIONS.GET_ALL',
    getById: 'API_ENDPOINTS.MEDICATIONS.GET_BY_ID(id)',
    create: 'API_ENDPOINTS.MEDICATIONS.CREATE',
    update: 'API_ENDPOINTS.MEDICATIONS.UPDATE(id)',
    delete: 'API_ENDPOINTS.MEDICATIONS.DELETE(id)',
  },
  'patients': {
    getAll: 'API_ENDPOINTS.PATIENTS.GET_ALL',
    getById: 'API_ENDPOINTS.PATIENTS.GET_BY_ID(id)',
    create: 'API_ENDPOINTS.PATIENTS.CREATE',
    update: 'API_ENDPOINTS.PATIENTS.UPDATE(id)',
    delete: 'API_ENDPOINTS.PATIENTS.DELETE(id)',
  },
  'doctors': {
    getAll: 'API_ENDPOINTS.DOCTORS.GET_ALL',
    getById: 'API_ENDPOINTS.DOCTORS.GET_BY_ID(id)',
    create: 'API_ENDPOINTS.DOCTORS.CREATE',
    update: 'API_ENDPOINTS.DOCTORS.UPDATE(id)',
    delete: 'API_ENDPOINTS.DOCTORS.DELETE(id)',
  },
  'appointments': {
    getAll: 'API_ENDPOINTS.APPOINTMENTS.GET_ALL',
    getById: 'API_ENDPOINTS.APPOINTMENTS.GET_BY_ID(id)',
    create: 'API_ENDPOINTS.APPOINTMENTS.CREATE',
    update: 'API_ENDPOINTS.APPOINTMENTS.UPDATE(id)',
    delete: 'API_ENDPOINTS.APPOINTMENTS.DELETE(id)',
  },
  'prescriptions': {
    getAll: 'API_ENDPOINTS.PRESCRIPTIONS.GET_ALL',
    getById: 'API_ENDPOINTS.PRESCRIPTIONS.GET_BY_ID(id)',
    create: 'API_ENDPOINTS.PRESCRIPTIONS.CREATE',
    update: 'API_ENDPOINTS.PRESCRIPTIONS.UPDATE(id)',
    delete: 'API_ENDPOINTS.PRESCRIPTIONS.DELETE(id)',
  }
} as const;