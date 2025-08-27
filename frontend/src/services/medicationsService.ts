import { authService } from './authService';
import { API_CONFIG } from '../config/api';

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  brandName: string;
  category: string;
  description: string;
  indications: string[];
  contraindications: string[];
  sideEffects: string[];
  interactions: string[];
  warnings: string[];
  dosageInfo: {
    adult: string;
    pediatric?: string;
    elderly?: string;
  };
  strength: string;
  form: string;
  manufacturer: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
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
  createdAt: Date;
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
  medication: {
    id: string;
    name: string;
    genericName: string;
    brandName: string;
    form: string;
    strength: string;
  };
}

export interface CreateMedicationData {
  name: string;
  genericName: string;
  brandName?: string;
  category: string;
  description: string;
  indications?: string[];
  contraindications?: string[];
  sideEffects?: string[];
  interactions?: string[];
  warnings?: string[];
  dosageInfo?: Medication['dosageInfo'];
  strength?: string;
  form: string;
  manufacturer: string;
}

export interface UpdateMedicationData {
  name?: string;
  genericName?: string;
  brandName?: string;
  category?: string;
  description?: string;
  indications?: string[];
  contraindications?: string[];
  sideEffects?: string[];
  interactions?: string[];
  warnings?: string[];
  dosageInfo?: Medication['dosageInfo'];
  strength?: string;
  form?: string;
  manufacturer?: string;
  isActive?: boolean;
}

export interface CreatePrescriptionData {
  patientId: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  notes?: string;
}

export interface UpdatePrescriptionData {
  status?: 'active' | 'completed' | 'discontinued' | 'on_hold';
  notes?: string;
}

export interface MedicationResponse {
  success: boolean;
  message: string;
  data?: Medication | Medication[];
}

export interface PrescriptionResponse {
  success: boolean;
  message: string;
  data?: Prescription | Prescription[];
}

class MedicationsService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  // Medications API
  async getAllMedications(params?: {
    search?: string;
    category?: string;
    form?: string;
    isActive?: boolean;
  }): Promise<MedicationResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append('search', params.search);
      if (params?.category) queryParams.append('category', params.category);
      if (params?.form) queryParams.append('form', params.form);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

      const url = `${API_CONFIG.BASE_URL}/medications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const medicationsArray = Array.isArray(result.data) ? result.data : [result.data];
        result.data = medicationsArray.map((med: any) => ({
          ...med,
          createdAt: med.createdAt ? new Date(med.createdAt) : undefined,
          updatedAt: med.updatedAt ? new Date(med.updatedAt) : undefined,
        }));
      }

      return result;
    } catch (error) {
      console.error('Get medications error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async getMedicationById(id: string): Promise<MedicationResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/medications/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          createdAt: result.data.createdAt ? new Date(result.data.createdAt) : undefined,
          updatedAt: result.data.updatedAt ? new Date(result.data.updatedAt) : undefined,
        };
      }

      return result;
    } catch (error) {
      console.error('Get medication error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async createMedication(medicationData: CreateMedicationData): Promise<MedicationResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/medications`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(medicationData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Create medication error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async updateMedication(id: string, medicationData: UpdateMedicationData): Promise<MedicationResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/medications/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(medicationData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update medication error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async deleteMedication(id: string): Promise<MedicationResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/medications/${id}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete medication error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Prescriptions API
  async getAllPrescriptions(): Promise<PrescriptionResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/medications/prescriptions/all`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        const prescriptionsArray = Array.isArray(result.data) ? result.data : [result.data];
        result.data = prescriptionsArray.map((prescription: any) => ({
          ...prescription,
          startDate: new Date(prescription.startDate),
          endDate: prescription.endDate ? new Date(prescription.endDate) : undefined,
          createdAt: new Date(prescription.createdAt),
        }));
      }

      return result;
    } catch (error) {
      console.error('Get prescriptions error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async createPrescription(prescriptionData: CreatePrescriptionData): Promise<PrescriptionResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/medications/prescriptions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(prescriptionData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          startDate: new Date(result.data.startDate),
          endDate: result.data.endDate ? new Date(result.data.endDate) : undefined,
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Create prescription error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async updatePrescription(id: string, prescriptionData: UpdatePrescriptionData): Promise<PrescriptionResponse> {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/medications/prescriptions/${id}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(prescriptionData),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Update prescription error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Utility methods
  formatMedicationName(medication: Medication): string {
    return medication.brandName && medication.brandName !== medication.genericName
      ? `${medication.brandName} (${medication.genericName})`
      : medication.name;
  }

  getStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
      case 'discontinued':
        return 'error';
      case 'on_hold':
        return 'warning';
      default:
        return 'default';
    }
  }

  formatPrescriptionDuration(prescription: Prescription): string {
    if (prescription.endDate) {
      const endDate = new Date(prescription.endDate);
      const startDate = new Date(prescription.startDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} days`;
    }
    return prescription.duration;
  }

  getMedicationCategories(): string[] {
    return [
      'Analgesics',
      'Antibiotics',
      'Antihistamines',
      'Anti-inflammatory',
      'Cardiovascular',
      'Dermatological',
      'Diabetes',
      'Gastrointestinal',
      'Neurological',
      'Respiratory',
      'Vitamins & Supplements'
    ];
  }

  getMedicationForms(): string[] {
    return [
      'Tablet',
      'Capsule',
      'Liquid',
      'Injection',
      'Cream',
      'Ointment',
      'Drops',
      'Inhaler',
      'Patch',
      'Suppository'
    ];
  }

  getFrequencyOptions(): string[] {
    return [
      'Once daily',
      'Twice daily',
      'Three times daily',
      'Four times daily',
      'Every 4 hours',
      'Every 6 hours',
      'Every 8 hours',
      'Every 12 hours',
      'As needed',
      'Before meals',
      'After meals',
      'At bedtime'
    ];
  }
}

export const medicationsService = new MedicationsService();
export default medicationsService;