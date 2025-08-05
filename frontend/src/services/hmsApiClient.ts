// Frontend HMS API Client - Simplified version for frontend use
import axios from 'axios';
import { API_ENDPOINTS, buildApiUrl } from '../config/api';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface Doctor {
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

export interface Appointment {
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
  patient: any;
  doctor: Doctor;
}

export interface AvailableSlot {
  time: Date;
  displayTime: string;
}

export interface Prescription {
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

class HMSApiClient {
  private api: any;
  private authToken: string | null = null;

  constructor() {
    this.api = axios.create({
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use((config: any) => {
      const token = this.getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response: any) => response,
      (error: any) => {
        console.error('HMS API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('token') || 
           localStorage.getItem('auth_token') || 
           localStorage.getItem('authToken') ||
           this.authToken;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = null;
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    try {
      const response = await this.api.post(buildApiUrl(API_ENDPOINTS.AUTH.LOGIN), { 
        email, 
        password 
      });
      
      if (response.data.success && response.data.data?.token) {
        this.setAuthToken(response.data.data.token);
      }
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Appointment Methods
  async getDoctors(specialization?: string): Promise<ApiResponse<Doctor[]>> {
    try {
      const params = specialization ? { specialization } : {};
      const response = await this.api.get(buildApiUrl(API_ENDPOINTS.DOCTORS.GET_ALL), { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctorById(doctorId: string): Promise<ApiResponse<Doctor>> {
    try {
      const response = await this.api.get(buildApiUrl(API_ENDPOINTS.DOCTORS.GET_BY_ID(doctorId)));
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getDoctorAvailability(doctorId: string, date: string): Promise<ApiResponse<AvailableSlot[]>> {
    try {
      // Use the correct endpoint from your backend
      const response = await this.api.get(
        buildApiUrl(`/appointments/available-slots/${doctorId}`),
        { params: { date } }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async bookAppointment(appointmentData: {
    doctorId: string;
    appointmentDate: string | Date;
    duration?: number;
    type?: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
    reason: string;
    symptoms?: string;
  }): Promise<ApiResponse<Appointment>> {
    try {
      const response = await this.api.post(buildApiUrl(API_ENDPOINTS.APPOINTMENTS.CREATE), appointmentData);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getAppointments(userId?: string): Promise<ApiResponse<Appointment[]>> {
    try {
      const params = userId ? { userId } : {};
      const response = await this.api.get(buildApiUrl(API_ENDPOINTS.APPOINTMENTS.GET_ALL), { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async cancelAppointment(appointmentId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.api.put(
        buildApiUrl(`/appointments/${appointmentId}/cancel`)
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async rescheduleAppointment(appointmentId: string, newDateTime: Date): Promise<ApiResponse<Appointment>> {
    try {
      const response = await this.api.put(
        buildApiUrl(`/appointments/${appointmentId}/reschedule`),
        { appointmentDate: newDateTime }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Medication Methods
  async getPrescriptions(patientId?: string): Promise<ApiResponse<Prescription[]>> {
    try {
      const params = patientId ? { patientId } : {};
      const response = await this.api.get(buildApiUrl(API_ENDPOINTS.PRESCRIPTIONS.GET_ALL), { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getMedications(category?: string): Promise<ApiResponse<any[]>> {
    try {
      const params = category ? { category } : {};
      const response = await this.api.get(buildApiUrl(API_ENDPOINTS.MEDICATIONS.GET_ALL), { params });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async searchMedications(query: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.api.get(buildApiUrl('/medications/search'), {
        params: { q: query }
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Patient Methods
  async getPatientProfile(patientId?: string): Promise<ApiResponse<any>> {
    try {
      const url = patientId 
        ? buildApiUrl(API_ENDPOINTS.PATIENTS.GET_BY_ID(patientId))
        : buildApiUrl('/patients/profile');
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getPatientHistory(patientId?: string): Promise<ApiResponse<any>> {
    try {
      const url = patientId 
        ? buildApiUrl(`/health-records/${patientId}`)
        : buildApiUrl(API_ENDPOINTS.HEALTH_RECORDS.GET_ALL);
      const response = await this.api.get(url);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health Check
  async healthCheck(): Promise<{ status: string; timestamp: string; service: string }> {
    try {
      const response = await this.api.get('/health');
      return response.data;
    } catch (error: any) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        service: 'HMS API Client'
      };
    }
  }

  // Chat/AI Methods
  async sendChatMessage(message: string, context?: any): Promise<ApiResponse<any>> {
    try {
      const response = await this.api.post(buildApiUrl(API_ENDPOINTS.CHAT.SEND_MESSAGE), { 
        message, 
        context 
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Batch operations for efficiency
  async batchGetPatientData(patientId?: string): Promise<{
    appointments: Appointment[];
    prescriptions: Prescription[];
    healthRecord: any;
  }> {
    try {
      const [appointmentsRes, prescriptionsRes, healthRecordRes] = await Promise.all([
        this.getAppointments(patientId).catch(() => ({ success: false, data: [] })),
        this.getPrescriptions(patientId).catch(() => ({ success: false, data: [] })),
        this.getPatientHistory(patientId).catch(() => ({ success: false, data: {} }))
      ]);

      return {
        appointments: appointmentsRes.data || [],
        prescriptions: prescriptionsRes.data || [],
        healthRecord: healthRecordRes.data || {}
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Specialized methods for agents
  async getPatientSummary(patientId?: string): Promise<ApiResponse<any>> {
    try {
      const data = await this.batchGetPatientData(patientId);
      
      const summary = {
        patientInfo: data.healthRecord.profile || {},
        recentAppointments: data.appointments.slice(0, 5),
        activePrescriptions: data.prescriptions.filter((p: any) => p.status === 'active'),
        recentVitals: data.healthRecord.vitals?.slice(0, 3) || [],
        chronicConditions: data.healthRecord.chronicConditions || [],
        allergies: data.healthRecord.allergies || []
      };

      return { success: true, data: summary };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async getSystemStatus(): Promise<ApiResponse<any>> {
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

  // Error handling helper
  private handleError(error: any): Error {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.response.statusText;
      
      // Handle authentication errors specifically
      if (status === 401 || status === 403) {
        // Clear invalid token
        this.clearAuthToken();
        localStorage.removeItem('token');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('authToken');
        
        return new Error('authentication_expired');
      }
      
      return new Error(message || `HTTP ${status}: ${error.response.statusText}`);
    } else if (error.request) {
      return new Error('Network error: No response received from server');
    } else {
      return new Error(`Request error: ${error.message}`);
    }
  }
}

export const hmsApiClient = new HMSApiClient();
export default hmsApiClient;