import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  department: string;
  phone: string;
  email: string;
  rating?: number;
}

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
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
  createdAt: Date;
  updatedAt: Date;
  patient: Patient;
  doctor: Doctor;
}

export interface CreateAppointmentData {
  doctorId: string;
  appointmentDate: string | Date;
  duration?: number;
  type?: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason: string;
  symptoms?: string;
}

export interface UpdateAppointmentData {
  appointmentDate?: string | Date;
  duration?: number;
  type?: 'consultation' | 'follow_up' | 'emergency' | 'routine_checkup';
  reason?: string;
  symptoms?: string;
  notes?: string;
  diagnosis?: string;
  treatment?: string;
  followUpInstructions?: string;
}

export interface AppointmentResponse {
  success: boolean;
  message: string;
  data?: Appointment | Appointment[];
}

export interface AvailableSlot {
  time: Date;
  displayTime: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  message?: string;
  data?: AvailableSlot[];
}

class AppointmentService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAppointments(): Promise<AppointmentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = result.data.map((apt: any) => ({
          ...apt,
          appointmentDate: new Date(apt.appointmentDate),
          createdAt: new Date(apt.createdAt),
          updatedAt: new Date(apt.updatedAt),
        }));
      }

      return result;
    } catch (error) {
      console.error('Get appointments error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getAppointment(id: string): Promise<AppointmentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          appointmentDate: new Date(result.data.appointmentDate),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Get appointment error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async createAppointment(appointmentData: CreateAppointmentData): Promise<AppointmentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          appointmentDate: new Date(result.data.appointmentDate),
          createdAt: result.data.createdAt ? new Date(result.data.createdAt) : new Date(),
          updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : new Date(),
        };
      }

      return result;
    } catch (error) {
      console.error('Create appointment error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async updateAppointment(id: string, appointmentData: UpdateAppointmentData): Promise<AppointmentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(appointmentData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          appointmentDate: new Date(result.data.appointmentDate),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Update appointment error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async rescheduleAppointment(id: string, newDate: string | Date): Promise<AppointmentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/reschedule`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ appointmentDate: newDate }),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          appointmentDate: new Date(result.data.appointmentDate),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Reschedule appointment error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async cancelAppointment(id: string): Promise<AppointmentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          appointmentDate: new Date(result.data.appointmentDate),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Cancel appointment error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async completeAppointment(
    id: string, 
    completionData: {
      diagnosis?: string;
      treatment?: string;
      followUpInstructions?: string;
      notes?: string;
    }
  ): Promise<AppointmentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/${id}/complete`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(completionData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          appointmentDate: new Date(result.data.appointmentDate),
          createdAt: new Date(result.data.createdAt),
          updatedAt: new Date(result.data.updatedAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Complete appointment error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getAvailableSlots(doctorId: string, date: string): Promise<AvailableSlotsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/appointments/available-slots/${doctorId}?date=${date}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = result.data.map((slot: any) => ({
          ...slot,
          time: new Date(slot.time),
        }));
      }

      return result;
    } catch (error) {
      console.error('Get available slots error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getDoctors(): Promise<{ success: boolean; message?: string; data?: Doctor[] }> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get doctors error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  formatAppointmentDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  formatAppointmentTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  formatAppointmentDateTime(date: Date): string {
    return `${this.formatAppointmentDate(date)} at ${this.formatAppointmentTime(date)}`;
  }

  getStatusColor(status: string): 'success' | 'error' | 'primary' | 'warning' | 'default' {
    switch (status) {
      case 'completed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'scheduled':
        return 'primary';
      case 'confirmed':
        return 'primary';
      case 'no_show':
        return 'warning';
      default:
        return 'default';
    }
  }

  isUpcoming(appointmentDate: Date): boolean {
    return new Date(appointmentDate) > new Date();
  }

  canReschedule(appointment: Appointment): boolean {
    return appointment.status === 'scheduled' && this.isUpcoming(appointment.appointmentDate);
  }

  canCancel(appointment: Appointment): boolean {
    return (appointment.status === 'scheduled' || appointment.status === 'confirmed') && 
           this.isUpcoming(appointment.appointmentDate);
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;

