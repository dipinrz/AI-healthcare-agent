import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

export interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualification: string;
  experience: number;
  department: string;
  phone: string;
  email: string;
  bio: string;
  rating: number;
  isAvailable: boolean;
  availability?: {
    [key: string]: {
      start: string;
      end: string;
      slots: string[];
    }
  };
}

export interface CreateDoctorData {
  firstName: string;
  lastName: string;
  specialization: string;
  qualification?: string;
  experience?: number;
  department?: string;
  phone: string;
  email: string;
  bio?: string;
  availability?: Doctor['availability'];
}

export interface UpdateDoctorData {
  firstName?: string;
  lastName?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  department?: string;
  phone?: string;
  bio?: string;
  availability?: Doctor['availability'];
  isAvailable?: boolean;
}

export interface DoctorResponse {
  success: boolean;
  message: string;
  data?: Doctor | Doctor[];
}

class DoctorsService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAllDoctors(params?: {
    search?: string;
    specialization?: string;
    department?: string;
    available?: boolean;
  }): Promise<DoctorResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.specialization) queryParams.append('specialization', params.specialization);
      if (params?.department) queryParams.append('department', params.department);
      if (params?.available !== undefined) queryParams.append('available', params.available.toString());

      const url = `${API_BASE_URL}/doctors${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
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

  async getDoctorById(id: string): Promise<DoctorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get doctor error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async createDoctor(doctorData: CreateDoctorData): Promise<DoctorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(doctorData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Create doctor error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async updateDoctor(id: string, doctorData: UpdateDoctorData): Promise<DoctorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(doctorData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update doctor error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async deleteDoctor(id: string): Promise<DoctorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete doctor error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getDoctorAppointments(id: string): Promise<DoctorResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/doctors/${id}/appointments`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Get doctor appointments error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  formatDoctorName(doctor: Doctor): string {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  }

  getSpecializations(): string[] {
    return [
      'Cardiology',
      'Dermatology',
      'Endocrinology',
      'Gastroenterology',
      'General Medicine',
      'Neurology',
      'Oncology',
      'Orthopedics',
      'Pediatrics',
      'Psychiatry',
      'Radiology',
      'Surgery',
      'Urology'
    ];
  }

  getDepartments(): string[] {
    return [
      'Emergency',
      'ICU',
      'Outpatient',
      'Surgery',
      'Pediatrics',
      'Obstetrics',
      'Cardiology',
      'Neurology',
      'Oncology',
      'Radiology'
    ];
  }
}

export const doctorsService = new DoctorsService();
export default doctorsService;