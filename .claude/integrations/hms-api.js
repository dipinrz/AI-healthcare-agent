// .claude/integrations/hms-api.js
const axios = require('axios');

class HMSApiIntegration {
  constructor(baseUrl = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
    this.authToken = null;
    
    // Create axios instance with default config
    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config) => {
      if (this.authToken) {
        config.headers.Authorization = `Bearer ${this.authToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('HMS API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  setAuthToken(token) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  async login(email, password) {
    try {
      const response = await this.api.post('/auth/login', { email, password });
      if (response.data.success && response.data.data?.token) {
        this.setAuthToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Appointment Methods
  async bookAppointment(doctorId, appointmentDate, patientId = null, options = {}) {
    try {
      const appointmentData = {
        doctorId,
        appointmentDate,
        duration: options.duration || 30,
        type: options.type || 'consultation',
        reason: options.reason || 'Medical consultation',
        symptoms: options.symptoms,
        ...options
      };

      const response = await this.api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAppointments(userId = null) {
    try {
      const params = userId ? { userId } : {};
      const response = await this.api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctorAvailability(doctorId, date = null) {
    try {
      const dateParam = date || new Date().toISOString().split('T')[0];
      const response = await this.api.get(`/appointments/doctors/${doctorId}/available-slots`, {
        params: { date: dateParam }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelAppointment(appointmentId) {
    try {
      const response = await this.api.delete(`/appointments/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rescheduleAppointment(appointmentId, newDateTime) {
    try {
      const response = await this.api.post(`/appointments/${appointmentId}/reschedule`, {
        appointmentDate: newDateTime
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async completeAppointment(appointmentId, completionData = {}) {
    try {
      const response = await this.api.post(`/appointments/${appointmentId}/complete`, completionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Doctor Methods
  async getDoctors(specialization = null) {
    try {
      const params = specialization ? { specialization } : {};
      const response = await this.api.get('/doctors', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctorById(doctorId) {
    try {
      const response = await this.api.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Patient Methods
  async getPatientProfile(patientId = null) {
    try {
      const url = patientId ? `/patients/${patientId}` : '/patients/profile';
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePatientProfile(patientData) {
    try {
      const response = await this.api.put('/patients/profile', patientData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPatientHistory(patientId = null) {
    try {
      const url = patientId ? `/health-records/${patientId}` : '/health-records';
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Medication Methods
  async getPrescriptions(patientId = null) {
    try {
      const params = patientId ? { patientId } : {};
      const response = await this.api.get('/medications/prescriptions', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createPrescription(prescriptionData) {
    try {
      const response = await this.api.post('/medications/prescriptions', prescriptionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMedications(category = null) {
    try {
      const params = category ? { category } : {};
      const response = await this.api.get('/medications', { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchMedications(query) {
    try {
      const response = await this.api.get('/medications/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Chat/AI Methods
  async sendChatMessage(message, context = {}) {
    try {
      const response = await this.api.post('/chat/message', { 
        message, 
        context 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await axios.get(`${this.baseUrl}/health`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling helper
  handleError(error) {
    if (error.response) {
      const message = error.response.data?.message || `HTTP ${error.response.status}: ${error.response.statusText}`;
      return new Error(message);
    } else if (error.request) {
      return new Error('Network error: No response received from server');
    } else {
      return new Error(`Request error: ${error.message}`);
    }
  }

  // Utility Methods
  async uploadDocument(file, type, metadata = {}) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      // Add metadata
      Object.keys(metadata).forEach(key => {
        formData.append(key, metadata[key]);
      });

      const response = await this.api.post('/health-records/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Batch operations for efficiency
  async batchGetPatientData(patientId = null) {
    try {
      const promises = [
        this.getAppointments(patientId),
        this.getPrescriptions(patientId),
        this.getPatientHistory(patientId)
      ];

      const [appointmentsRes, prescriptionsRes, healthRecordRes] = await Promise.all(promises);

      return {
        appointments: appointmentsRes.data || [],
        prescriptions: prescriptionsRes.data || [],
        healthRecord: healthRecordRes.data || {}
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Specialized methods for HMS agents
  
  // For appointment-scheduler agent
  async getAppointmentSlots(doctorId, date, duration = 30) {
    try {
      const response = await this.getDoctorAvailability(doctorId, date);
      if (response.success && response.data) {
        // Filter slots based on duration if needed
        return response.data.filter(slot => {
          // Add logic to check if slot can accommodate the duration
          return true; // Simplified for now
        });
      }
      return [];
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // For prescription-helper agent
  async getMedicationInfo(medicationId) {
    try {
      const response = await this.api.get(`/medications/${medicationId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // For patient-assistant agent
  async getPatientSummary(patientId = null) {
    try {
      const data = await this.batchGetPatientData(patientId);
      
      // Create a summary for easy consumption
      const summary = {
        patientInfo: data.healthRecord.profile || {},
        recentAppointments: data.appointments.slice(0, 5),
        activePrescriptions: data.prescriptions.filter(p => p.status === 'active'),
        recentVitals: data.healthRecord.vitals?.slice(0, 3) || [],
        chronicConditions: data.healthRecord.chronicConditions || [],
        allergies: data.healthRecord.allergies || []
      };

      return { success: true, data: summary };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // For hospital-faq agent
  async getSystemStatus() {
    try {
      const health = await this.healthCheck();
      const [doctorsRes, medicationsRes] = await Promise.all([
        this.getDoctors().catch(() => ({ data: [] })),
        this.getMedications().catch(() => ({ data: [] }))
      ]);

      return {
        success: true,
        data: {
          systemHealth: health,
          availableDoctors: doctorsRes.data?.length || 0,
          medicationDatabase: medicationsRes.data?.length || 0,
          lastChecked: new Date().toISOString()
        }
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Export the class
module.exports = HMSApiIntegration;

// Also export a singleton instance for convenience
module.exports.hmsApi = new HMSApiIntegration();