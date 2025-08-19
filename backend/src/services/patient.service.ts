import { PatientRepository } from '../repositories/patient.repository';
import { Patient } from '../models/Patient.model';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { PrescriptionRepository } from '../repositories/prescription.repository';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';

export interface PatientFilters {
  search?: string;
  gender?: string;
  ageMin?: number;
  ageMax?: number;
}

export interface AppointmentFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export class PatientService {
  private patientRepository = new PatientRepository();
  private appointmentRepository = new AppointmentRepository();
  private prescriptionRepository = new PrescriptionRepository();

  async getAllPatients(
    filters: PatientFilters,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      logger.info('Getting all patients with filters:', filters);

      // If search is provided, use search method
      if (filters.search) {
        const patients = await this.patientRepository.searchPatients(filters.search);
        return {
          data: patients.slice((page - 1) * limit, page * limit),
          total: patients.length,
          page,
          limit,
          pages: Math.ceil(patients.length / limit),
        };
      }

      // Apply other filters
      let patients: Patient[];

      if (filters.gender) {
        patients = await this.patientRepository.findByGender(filters.gender);
      } else if (filters.ageMin || filters.ageMax) {
        patients = await this.patientRepository.findByAge(filters.ageMin || 0, filters.ageMax);
      } else {
        patients = await this.patientRepository.findActivePatients();
      }

      const total = patients.length;
      const paginatedPatients = patients.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedPatients,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all patients error:', error);
      throw error;
    }
  }

  async getPatientById(id: string): Promise<Patient> {
    try {
      const patient = await this.patientRepository.findById(id);
      
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      return patient;
    } catch (error) {
      logger.error('Get patient by ID error:', error);
      throw error;
    }
  }

  async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    try {
      // Check if patient with email already exists
      if (patientData.email) {
        const existingPatient = await this.patientRepository.findByEmail(patientData.email);
        if (existingPatient) {
          throw new Error(MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
        }
      }

      const patient = await this.patientRepository.create({
        ...patientData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Patient created successfully:', patient.id);
      return patient;
    } catch (error) {
      logger.error('Create patient error:', error);
      throw error;
    }
  }

  async updatePatient(id: string, updateData: Partial<Patient>): Promise<Patient> {
    try {
      const existingPatient = await this.patientRepository.findById(id);
      if (!existingPatient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingPatient.email) {
        const patientWithEmail = await this.patientRepository.findByEmail(updateData.email);
        if (patientWithEmail && patientWithEmail.id !== id) {
          throw new Error(MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
        }
      }

      const updatedPatient = await this.patientRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      if (!updatedPatient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      logger.info('Patient updated successfully:', id);
      return updatedPatient;
    } catch (error) {
      logger.error('Update patient error:', error);
      throw error;
    }
  }

  async deletePatient(id: string): Promise<void> {
    try {
      const patient = await this.patientRepository.findById(id);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Soft delete - deactivate instead of hard delete
      await this.patientRepository.deactivatePatient(id);
      
      logger.info('Patient deleted successfully:', id);
    } catch (error) {
      logger.error('Delete patient error:', error);
      throw error;
    }
  }

  async getPatientAppointments(patientId: string, filters: AppointmentFilters = {}) {
    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      const appointments = await this.appointmentRepository.findByPatientId(patientId, filters);
      return appointments;
    } catch (error) {
      logger.error('Get patient appointments error:', error);
      throw error;
    }
  }

  async getPatientPrescriptions(patientId: string) {
    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      const prescriptions = await this.prescriptionRepository.findByPatientId(patientId);
      return prescriptions;
    } catch (error) {
      logger.error('Get patient prescriptions error:', error);
      throw error;
    }
  }

  async searchPatients(searchTerm: string): Promise<Patient[]> {
    try {
      return await this.patientRepository.searchPatients(searchTerm);
    } catch (error) {
      logger.error('Search patients error:', error);
      throw error;
    }
  }

  async getPatientStats() {
    try {
      return await this.patientRepository.getPatientStats();
    } catch (error) {
      logger.error('Get patient stats error:', error);
      throw error;
    }
  }

  // Helper methods
  async activatePatient(id: string): Promise<Patient> {
    try {
      const patient = await this.patientRepository.activatePatient(id);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }
      return patient;
    } catch (error) {
      logger.error('Activate patient error:', error);
      throw error;
    }
  }

  async deactivatePatient(id: string): Promise<Patient> {
    try {
      const patient = await this.patientRepository.deactivatePatient(id);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }
      return patient;
    } catch (error) {
      logger.error('Deactivate patient error:', error);
      throw error;
    }
  }

  async getPatientsByAge(minAge: number, maxAge?: number): Promise<Patient[]> {
    try {
      return await this.patientRepository.findByAge(minAge, maxAge);
    } catch (error) {
      logger.error('Get patients by age error:', error);
      throw error;
    }
  }

  async getPatientsByGender(gender: string): Promise<Patient[]> {
    try {
      return await this.patientRepository.findByGender(gender);
    } catch (error) {
      logger.error('Get patients by gender error:', error);
      throw error;
    }
  }

  async getPatientSummary(patientId: string) {
    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Get appointments (recent and upcoming)
      const appointments = await this.appointmentRepository.findByPatientId(patientId, {});
      const recentAppointments = appointments.filter(apt => 
        new Date(apt.appointmentDate) <= new Date()
      ).slice(0, 5);
      const upcomingAppointments = appointments.filter(apt => 
        new Date(apt.appointmentDate) > new Date()
      ).slice(0, 5);

      // Get prescriptions (active ones)
      const prescriptions = await this.prescriptionRepository.findByPatientId(patientId);
      const activePrescriptions = prescriptions.filter(prescription => 
        !prescription.endDate || new Date(prescription.endDate) > new Date()
      );

      // Calculate age
      const age = patient.dateOfBirth 
        ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

      // Build summary
      const summary = {
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth,
          age,
          gender: patient.gender,
          address: patient.address,
          allergies: patient.allergies,
          emergencyContact: patient.emergencyContact,
          isActive: patient.isActive
        },
        appointments: {
          total: appointments.length,
          recent: recentAppointments.map(apt => ({
            id: apt.id,
            date: apt.appointmentDate,
            status: apt.status,
            type: apt.type,
            reason: apt.reason,
            diagnosis: apt.diagnosis,
            doctorName: `Dr. ${apt.doctor?.firstName} ${apt.doctor?.lastName}` || 'Unknown'
          })),
          upcoming: upcomingAppointments.map(apt => ({
            id: apt.id,
            date: apt.appointmentDate,
            status: apt.status,
            type: apt.type,
            reason: apt.reason,
            doctorName: `Dr. ${apt.doctor?.firstName} ${apt.doctor?.lastName}` || 'Unknown'
          }))
        },
        prescriptions: {
          total: prescriptions.length,
          active: activePrescriptions.map(prescription => ({
            id: prescription.id,
            medicationName: prescription.medication?.name || 'Unknown',
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            startDate: prescription.startDate,
            endDate: prescription.endDate,
            instructions: prescription.instructions,
            doctorName: `Dr. ${prescription.doctor?.firstName} ${prescription.doctor?.lastName}` || 'Unknown'
          }))
        },
        healthMetrics: {
          totalAppointments: appointments.length,
          activePrescriptions: activePrescriptions.length,
          lastAppointment: appointments.length > 0 
            ? appointments.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())[0].appointmentDate
            : null,
          nextAppointment: upcomingAppointments.length > 0 
            ? upcomingAppointments.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime())[0].appointmentDate
            : null
        }
      };

      logger.info(`Patient summary retrieved for: ${patientId}`);
      return summary;
    } catch (error) {
      logger.error('Get patient summary error:', error);
      throw error;
    }
  }
}