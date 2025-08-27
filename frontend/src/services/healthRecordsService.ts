import { authService } from './authService';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL||'http://localhost:3001/api';

export interface VitalSigns {
  id: string;
  recordedDate: Date;
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  notes?: string;
  recordedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  createdAt: Date;
}

export interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status: 'normal' | 'abnormal' | 'critical' | 'low' | 'high' | 'pending';
  testDate: Date;
  resultDate?: Date;
  notes?: string;
  labFacility?: string;
  interpretation?: string;
  orderedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  createdAt: Date;
}

export interface MedicalDocument {
  id: string;
  name: string;
  type: 'lab_result' | 'imaging' | 'physical_exam' | 'prescription' | 'consultation_note' | 'discharge_summary' | 'referral' | 'other';
  description?: string;
  documentDate: Date;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  notes?: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  createdAt: Date;
}

export interface HealthRecord {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date;
    gender: string;
    address: string;
    allergies: string[];
    emergencyContact: string;
  };
  vitalSigns: VitalSigns[];
  labResults: LabResult[];
  documents: MedicalDocument[];
}

export interface CreateVitalSignsData {
  recordedDate?: string | Date;
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  notes?: string;
}

export interface CreateLabResultData {
  testName: string;
  value: string;
  unit?: string;
  referenceRange?: string;
  status?: 'normal' | 'abnormal' | 'critical' | 'low' | 'high' | 'pending';
  testDate?: string | Date;
  resultDate?: string | Date;
  notes?: string;
  labFacility?: string;
  interpretation?: string;
}

export interface CreateMedicalDocumentData {
  name: string;
  type?: 'lab_result' | 'imaging' | 'physical_exam' | 'prescription' | 'consultation_note' | 'discharge_summary' | 'referral' | 'other';
  description?: string;
  documentDate?: string | Date;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  notes?: string;
}

export interface HealthRecordResponse {
  success: boolean;
  message?: string;
  data?: HealthRecord;
}

export interface VitalSignsResponse {
  success: boolean;
  message?: string;
  data?: VitalSigns;
}

export interface LabResultResponse {
  success: boolean;
  message?: string;
  data?: LabResult;
}

export interface MedicalDocumentResponse {
  success: boolean;
  message?: string;
  data?: MedicalDocument;
}

class HealthRecordsService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  async getHealthRecord(patientId: string): Promise<HealthRecordResponse> {
    try {
      console.log('Making health records API call for patient:', patientId);
      console.log('API URL:', `${API_BASE_URL}/health-records/${patientId}`);
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });
      console.log('Health records API response status:', response.status);

      const result = await response.json();
      
      if (result.success && result.data) {
        // Convert date strings to Date objects
        result.data.patient.dateOfBirth = new Date(result.data.patient.dateOfBirth);
        
        result.data.vitalSigns = result.data.vitalSigns.map((vital: any) => ({
          ...vital,
          recordedDate: new Date(vital.recordedDate),
          createdAt: new Date(vital.createdAt),
        }));
        
        result.data.labResults = result.data.labResults.map((lab: any) => ({
          ...lab,
          testDate: new Date(lab.testDate),
          resultDate: lab.resultDate ? new Date(lab.resultDate) : undefined,
          createdAt: new Date(lab.createdAt),
        }));
        
        result.data.documents = result.data.documents.map((doc: any) => ({
          ...doc,
          documentDate: new Date(doc.documentDate),
          createdAt: new Date(doc.createdAt),
        }));
      }

      return result;
    } catch (error) {
      console.error('Get health record error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async addVitalSigns(patientId: string, vitalSignsData: CreateVitalSignsData): Promise<VitalSignsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/vitals`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(vitalSignsData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          recordedDate: new Date(result.data.recordedDate),
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Add vital signs error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async addLabResult(patientId: string, labResultData: CreateLabResultData): Promise<LabResultResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/lab-results`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(labResultData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          testDate: new Date(result.data.testDate),
          resultDate: result.data.resultDate ? new Date(result.data.resultDate) : undefined,
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Add lab result error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async addMedicalDocument(patientId: string, documentData: CreateMedicalDocumentData): Promise<MedicalDocumentResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/documents`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(documentData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          documentDate: new Date(result.data.documentDate),
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Add medical document error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async uploadDocument(
    patientId: string, 
    file: File, 
    documentData: Omit<CreateMedicalDocumentData, 'fileName' | 'fileType' | 'fileSize'>
  ): Promise<MedicalDocumentResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', documentData.name || file.name);
      formData.append('type', documentData.type || 'other');
      
      if (documentData.description) {
        formData.append('description', documentData.description);
      }
      if (documentData.notes) {
        formData.append('notes', documentData.notes);
      }
      if (documentData.documentDate) {
        formData.append('documentDate', new Date(documentData.documentDate).toISOString());
      }

      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/documents`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          documentDate: new Date(result.data.documentDate),
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Upload document error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async downloadDocument(patientId: string, documentId: string): Promise<{ success: boolean; blob?: Blob; filename?: string; message?: string }> {
    try {
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/documents/${documentId}/download`, {
        method: 'GET',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        const errorResult = await response.json();
        return {
          success: false,
          message: errorResult.message || 'Failed to download document',
        };
      }

      const blob = await response.blob();
      const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'document';
      
      return {
        success: true,
        blob,
        filename,
      };
    } catch (error) {
      console.error('Download document error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async deleteDocument(patientId: string, documentId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/documents/${documentId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete document error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async updateVitalSigns(patientId: string, vitalId: string, vitalSignsData: Partial<CreateVitalSignsData>): Promise<VitalSignsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/vitals/${vitalId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(vitalSignsData),
      });

      const result = await response.json();
      
      if (result.success && result.data) {
        result.data = {
          ...result.data,
          recordedDate: new Date(result.data.recordedDate),
          createdAt: new Date(result.data.createdAt),
        };
      }

      return result;
    } catch (error) {
      console.error('Update vital signs error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  async deleteVitalSigns(patientId: string, vitalId: string): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/health-records/${patientId}/vitals/${vitalId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Delete vital signs error:', error);
      return {
        success: false,
        message: 'Network error. Please try again.',
      };
    }
  }

  // Helper methods
  formatVitalSigns(vital: VitalSigns): string {
    const parts = [];
    if (vital.systolicBP && vital.diastolicBP) {
      parts.push(`BP: ${vital.systolicBP}/${vital.diastolicBP} mmHg`);
    }
    if (vital.heartRate) {
      parts.push(`HR: ${vital.heartRate} bpm`);
    }
    if (vital.temperature) {
      parts.push(`Temp: ${vital.temperature}°F`);
    }
    if (vital.weight) {
      parts.push(`Weight: ${vital.weight} lbs`);
    }
    if (vital.oxygenSaturation) {
      parts.push(`O2 Sat: ${vital.oxygenSaturation}%`);
    }
    return parts.join(' • ');
  }

  getLabResultStatusColor(status: string): 'success' | 'error' | 'warning' | 'info' | 'default' {
    switch (status) {
      case 'normal':
        return 'success';
      case 'abnormal':
      case 'critical':
        return 'error';
      case 'low':
      case 'high':
        return 'warning';
      case 'pending':
        return 'info';
      default:
        return 'default';
    }
  }

  getDocumentTypeLabel(type: string): string {
    const typeLabels: { [key: string]: string } = {
      lab_result: 'Lab Result',
      imaging: 'Imaging',
      physical_exam: 'Physical Exam',
      prescription: 'Prescription',
      consultation_note: 'Consultation Note',
      discharge_summary: 'Discharge Summary',
      referral: 'Referral',
      other: 'Other'
    };
    return typeLabels[type] || 'Document';
  }

  formatFileSize(bytes?: number): string {
    if (!bytes) return 'Unknown size';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

export const healthRecordsService = new HealthRecordsService();
export default healthRecordsService;