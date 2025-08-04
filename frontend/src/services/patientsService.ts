import { authService } from "./authService";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api";

export interface Patient {
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
  gender: string;
  address?: string;
  allergies?: string[];
  emergencyContact?: string;
}

export interface UpdatePatientData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string | Date;
  gender?: string;
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

class PatientsService {
  private getAuthHeaders() {
    const token = authService.getToken();
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async getAllPatients(params?: {
    search?: string;
    gender?: string;
    ageMin?: number;
    ageMax?: number;
  }): Promise<PatientResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.search) queryParams.append("search", params.search);
      if (params?.gender) queryParams.append("gender", params.gender);
      if (params?.ageMin)
        queryParams.append("ageMin", params.ageMin.toString());
      if (params?.ageMax)
        queryParams.append("ageMax", params.ageMax.toString());

      const url = `${API_BASE_URL}/patients${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const patientsArray = Array.isArray(result.data)
          ? result.data
          : [result.data];
        result.data = patientsArray.map((patient: any) => ({
          ...patient,
          dateOfBirth: new Date(patient.dateOfBirth),
          createdAt: new Date(patient.createdAt),
        }));
      }

      return result;
    } catch (error) {
      console.error("Get patients error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  async getPatientById(id: string): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: "GET",
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
      console.error("Get patient error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  async createPatient(
    patientData: CreatePatientData
  ): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients`, {
        method: "POST",
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
      console.error("Create patient error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  async updatePatient(
    id: string,
    patientData: UpdatePatientData
  ): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: "PUT",
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
      console.error("Update patient error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  async deletePatient(id: string): Promise<PatientResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/patients/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Delete patient error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  async getPatientAppointments(id: string): Promise<PatientResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/patients/${id}/appointments`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get patient appointments error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  async getPatientPrescriptions(id: string): Promise<PatientResponse> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/patients/${id}/prescriptions`,
        {
          method: "GET",
          headers: this.getAuthHeaders(),
        }
      );

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Get patient prescriptions error:", error);
      return {
        success: false,
        message: "Network error. Please try again.",
      };
    }
  }

  formatPatientName(patient: Patient): string {
    return `${patient.firstName} ${patient.lastName}`;
  }

  calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  formatDateOfBirth(dateOfBirth: Date): string {
    return dateOfBirth.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  getGenderOptions(): string[] {
    return ["Male", "Female", "Other", "Prefer not to say"];
  }

  formatAllergies(allergies: string[]): string {
    if (!allergies || allergies.length === 0) {
      return "No known allergies";
    }
    return allergies.join(", ");
  }
}

export const patientsService = new PatientsService();
export default patientsService;
