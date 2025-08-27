import axios from 'axios';
import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

// Types matching the backend
export interface CreatePrescriptionItemData {
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills: number;
  notes?: string;
}

export interface CreatePrescriptionData {
  patientId: string;
  doctorId: string;
  startDate: string;
  endDate?: string;
  prescriptionNotes?: string;
  medications: CreatePrescriptionItemData[];
}

export interface PrescriptionItem {
  id: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills: number;
  notes?: string;
  medication: {
    id: string;
    name: string;
    category: string;
    description?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Prescription {
  id: string;
  prescriptionNotes?: string;
  status: 'active' | 'completed' | 'discontinued' | 'on_hold';
  startDate: string;
  endDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  prescriptionItems: PrescriptionItem[];
}

export interface PrescriptionFilters {
  status?: string;
  patientId?: string;
  doctorId?: string;
  medicationId?: string;
  startDate?: string;
  endDate?: string;
}

class PrescriptionsService {
  private getAuthHeader() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getAllPrescriptions(
    filters: PrescriptionFilters = {},
    page: number = 1,
    limit: number = 10
  ) {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response = await axios.get(
        `${API_BASE_URL}/prescriptions?${params.toString()}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      throw error;
    }
  }

  async getPrescriptionById(id: string) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/prescriptions/${id}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription:', error);
      throw error;
    }
  }

  async createPrescription(prescriptionData: CreatePrescriptionData) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/prescriptions`,
        prescriptionData,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  async updatePrescription(id: string, updateData: Partial<CreatePrescriptionData>) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/prescriptions/${id}`,
        updateData,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error updating prescription:', error);
      throw error;
    }
  }

  async discontinuePrescription(id: string, reason: string) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/prescriptions/${id}/discontinue`,
        { reason },
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error discontinuing prescription:', error);
      throw error;
    }
  }

  async completePrescription(id: string) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/prescriptions/${id}/complete`,
        {},
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error completing prescription:', error);
      throw error;
    }
  }

  async getActivePrescriptions() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/prescriptions/active`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching active prescriptions:', error);
      throw error;
    }
  }

  async searchPrescriptions(searchTerm: string) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/prescriptions/search?q=${encodeURIComponent(searchTerm)}`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching prescriptions:', error);
      throw error;
    }
  }

  async getPrescriptionStats() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/prescriptions/stats`,
        { headers: this.getAuthHeader() }
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching prescription stats:', error);
      throw error;
    }
  }
}

export default new PrescriptionsService();