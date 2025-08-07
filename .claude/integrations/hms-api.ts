// .claude/integrations/hms-api.ts
import axios, { AxiosInstance, AxiosError } from 'axios';

// Type definitions based on your backend entities
interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialization: string;
  qualification: string;
  department: string;
  experience: number;
}

interface Appointment {
  id: string;
  appointmentDate: Date;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  type: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason: string;
  notes?: string;
  symptoms?: string;
  diagnosis?: string;
  treatment?: string;
  followUpInstructions?: string;
  patient: Patient;
  doctor: Doctor;
}

interface AvailableSlot {
  time: Date;
  displayTime: string;
}

interface Prescription {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  quantity: number;
  refills: number;
  status: 'active' | 'completed' | 'discontinued' | 'on_hold';
  startDate: Date;
  endDate?: Date;
  notes: string;
  medication: {
    id: string;
    name: string;
    genericName: string;
    brandName: string;
    form: string;
    strength: string;
  };
}

interface HealthRecord {
  id: string;
  patientId: string;
  vitals: Array<{
    id: string;
    date: Date;
    bloodPressure?: { systolic: number; diastolic: number };
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
    oxygenSaturation?: number;
  }>;
  labResults: Array<{
    id: string;
    testName: string;
    value: string;
    unit?: string;
    referenceRange: string;
    status: 'normal' | 'high' | 'low' | 'critical';
    date: Date;
    orderedBy: string;
    notes?: string;
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: 'prescription' | 'lab_result' | 'imaging' | 'report' | 'other';
    date: Date;
    doctor: string;
    url: string;
    uploadDate: Date;
    size: string;
  }>;
  allergies: string[];
  chronicConditions: string[];
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
  prescriptions: Prescription[];
  appointments: Appointment[];
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

interface ChatResponse {
  message: string;
  timestamp: string;
  type: 'assistant';
  actions?: Array<{
    type: string;
    data: any;
  }>;
}

export class HMSApiIntegration {
  private api: AxiosInstance;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
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
      (error: AxiosError) => {
        console.error('HMS API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // Authentication Methods
  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
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
  async bookAppointment(appointmentData: {
    doctorId: string;
    appointmentDate: string | Date;
    duration?: number;
    type?: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
    reason: string;
    symptoms?: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      const response = await this.api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAppointments(): Promise<ApiResponse<Appointment[]>> {
    try {
      const response = await this.api.get('/appointments');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctorAvailability(doctorId: string, date: string): Promise<ApiResponse<AvailableSlot[]>> {
    try {
      const response = await this.api.get(`/appointments/doctors/${doctorId}/available-slots`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelAppointment(appointmentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.delete(`/appointments/${appointmentId}/cancel`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rescheduleAppointment(appointmentId: string, newDateTime: Date): Promise<ApiResponse<Appointment>> {
    try {
      const response = await this.api.post(`/appointments/${appointmentId}/reschedule`, {
        appointmentDate: newDateTime
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async completeAppointment(appointmentId: string, completionData: {
    diagnosis?: string;
    treatment?: string;
    followUpInstructions?: string;
    notes?: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      const response = await this.api.post(`/appointments/${appointmentId}/complete`, completionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Doctor Methods
  async getDoctors(): Promise<ApiResponse<Doctor[]>> {
    try {
      const response = await this.api.get('/doctors');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctorById(doctorId: string): Promise<ApiResponse<Doctor>> {
    try {
      const response = await this.api.get(`/doctors/${doctorId}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Patient Methods
  async getPatientProfile(): Promise<ApiResponse<Patient>> {
    try {
      const response = await this.api.get('/patients/profile');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updatePatientProfile(patientData: Partial<Patient>): Promise<ApiResponse<Patient>> {
    try {
      const response = await this.api.put('/patients/profile', patientData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPatientHistory(patientId?: string): Promise<ApiResponse<HealthRecord>> {
    try {
      const url = patientId ? `/health-records/${patientId}` : '/health-records';
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Medication Methods
  async getPrescriptions(): Promise<ApiResponse<Prescription[]>> {
    try {
      const response = await this.api.get('/medications/prescriptions');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async createPrescription(prescriptionData: {
    patientId: string;
    medicationId: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
    quantity: number;
    refills: number;
    notes?: string;
    startDate: Date;
  }): Promise<ApiResponse<Prescription>> {
    try {
      const response = await this.api.post('/medications/prescriptions', prescriptionData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMedications(): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.api.get('/medications');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchMedications(query: string): Promise<ApiResponse<any[]>> {
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
  async sendChatMessage(message: string): Promise<ApiResponse<ChatResponse>> {
    try {
      const response = await this.api.post('/chat/message', { message });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    try {
      const response = await this.api.get('/health', {
        headers: {} // No auth needed for health check
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Error handling helper
  private handleError(error: any): Error {
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
  async uploadDocument(file: File, type: string): Promise<ApiResponse<any>> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

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
  async batchGetData(): Promise<{
    appointments: Appointment[];
    prescriptions: Prescription[];
    healthRecord: HealthRecord;
  }> {
    try {
      const [appointmentsRes, prescriptionsRes, healthRecordRes] = await Promise.all([
        this.getAppointments(),
        this.getPrescriptions(),
        this.getPatientHistory()
      ]);

      return {
        appointments: appointmentsRes.data || [],
        prescriptions: prescriptionsRes.data || [],
        healthRecord: healthRecordRes.data || {} as HealthRecord
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

// Export singleton instance
export const hmsApi = new HMSApiIntegration();

// Export types for use in other files
export type {
  Patient,
  Doctor,
  Appointment,
  AvailableSlot,
  Prescription,
  HealthRecord,
  ApiResponse,
  ChatResponse
};