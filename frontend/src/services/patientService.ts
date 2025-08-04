import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  address: string;
  allergies: string[];
  emergencyContact: string;
  isActive: boolean;
  createdAt: Date;
  appointmentsCount?: number;
  prescriptionsCount?: number;
  chatLogsCount?: number;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  dateOfBirth: string | Date;
  gender: 'male' | 'female' | 'other';
  address?: string;
  allergies?: string[];
  emergencyContact?: string;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string | Date;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  allergies?: string[];
  emergencyContact?: string;
  isActive?: boolean;
}

export interface PatientResponse {
  success: boolean;
  message: string;
  data?: Patient | Patient[];
}

class PatientService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getPatients(filters?: {
    search?: string;
    gender?: string;
    ageMin?: number;
    ageMax?: number;
  }): Promise<PatientResponse> {
    try {
      let url = `${API_BASE_URL}/patients`;
      
      if (filters) {
        const params = new URLSearchParams();
        if (filters.search) params.append('search', filters.search);
        if (filters.gender) params.append('gender', filters.gender);
        if (filters.ageMin) params.append('ageMin', filters.ageMin.toString());
        if (filters.ageMax) params.append('ageMax', filters.ageMax.toString());
        
        const paramString = params.toString();
        if (paramString) url += `?${paramString}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = result.data.map((patient: any) => ({
          ...patient,
          dateOfBirth: new Date(patient.dateOfBirth),
          createdAt: new Date(patient.createdAt),
        }));
      }

      return result;
    } catch (error) {
      console.error('Get patients error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getPatient(id: string): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          dateOfBirth: new Date(result.data.dateOfBirth),
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Get patient error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async createPatient(patientData: CreatePatientData): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(patientData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          dateOfBirth: new Date(result.data.dateOfBirth),
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Create patient error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async updatePatient(id: string, patientData: UpdatePatientData): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(patientData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          dateOfBirth: new Date(result.data.dateOfBirth),
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Update patient error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async deletePatient(id: string): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete patient error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getPatientAppointments(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}/appointments`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = result.data.map((appointment: any) => ({
          ...appointment,
          appointmentDate: new Date(appointment.appointmentDate),
          createdAt: new Date(appointment.createdAt),
          updatedAt: new Date(appointment.updatedAt),
        }));
      }

      return result;
    } catch (error) {
      console.error('Get patient appointments error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getPatientPrescriptions(id: string): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}/prescriptions`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = result.data.map((prescription: any) => ({
          ...prescription,
          prescribedDate: prescription.prescribedDate ? new Date(prescription.prescribedDate) : null,
          startDate: prescription.startDate ? new Date(prescription.startDate) : null,
          endDate: prescription.endDate ? new Date(prescription.endDate) : null,
          createdAt: new Date(prescription.createdAt),
          updatedAt: new Date(prescription.updatedAt),
        }));
      }

      return result;
    } catch (error) {
      console.error('Get patient prescriptions error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Helper methods
  formatPatientName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birth = new Date(dateOfBirth);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  formatAge(dateOfBirth: Date): string {
    const age = this.calculateAge(dateOfBirth);
    return `${age} years old`;
  }

  formatGender(gender: string): string {
    return gender.charAt(0).toUpperCase() + gender.slice(1);
  }

  formatPhoneNumber(phone: string): string {
    // Basic phone number formatting for US numbers
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
}

export const patientService = new PatientService();
export default patientService;