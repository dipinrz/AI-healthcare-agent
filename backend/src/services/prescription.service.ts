import { PrescriptionRepository } from '../repositories/prescription.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { MedicationRepository } from '../repositories/medication.repository';
import { Prescription, PrescriptionStatus } from '../models/Prescription.model';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';
import { UserRole } from '../models/User.model';

export interface PrescriptionFilters {
  status?: string;
  patientId?: string;
  doctorId?: string;
  medicationId?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface CreatePrescriptionData {
  patientId: string;
  doctorId: string;
  medicationId: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantity: number;
  refills: number;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

export interface UpdatePrescriptionData {
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  quantity?: number;
  refills?: number;
  status?: PrescriptionStatus;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
}

export class PrescriptionService {
  private prescriptionRepository = new PrescriptionRepository();
  private patientRepository = new PatientRepository();
  private doctorRepository = new DoctorRepository();
  private medicationRepository = new MedicationRepository();

  async getAllPrescriptions(
    filters: PrescriptionFilters,
    page: number = 1,
    limit: number = 10,
    userRole: UserRole,
    userId: string
  ) {
    try {
      logger.info('Getting all prescriptions with filters:', filters);

      let prescriptions: Prescription[];

      // Apply role-based filtering
      if (userRole === UserRole.PATIENT) {
        prescriptions = await this.prescriptionRepository.findByPatientId(userId);
      } else if (userRole === UserRole.DOCTOR) {
        prescriptions = await this.prescriptionRepository.findByDoctorId(userId);
      } else {
        // Admin can see all prescriptions
        prescriptions = await this.prescriptionRepository.findAll({
          relations: ['patient', 'doctor', 'medication'],
          order: { createdAt: 'DESC' },
        });
      }

      // Apply additional filters
      if (filters.status && userRole === UserRole.ADMIN) {
        prescriptions = prescriptions.filter(prescription => prescription.status === filters.status);
      }

      if (filters.medicationId && userRole === UserRole.ADMIN) {
        prescriptions = prescriptions.filter(prescription => prescription.medication.id === filters.medicationId);
      }

      const total = prescriptions.length;
      const paginatedPrescriptions = prescriptions.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedPrescriptions,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all prescriptions error:', error);
      throw error;
    }
  }

  async getPrescriptionById(
    id: string,
    userRole: UserRole,
    userId: string
  ): Promise<Prescription> {
    try {
      const prescription = await this.prescriptionRepository.findById(id, {
        relations: ['patient', 'doctor', 'medication'],
      });
      
      if (!prescription) {
        throw new Error(MESSAGES.ERROR.NOT_FOUND);
      }

      // Check permissions
      if (userRole === UserRole.PATIENT && prescription.patient.id !== userId) {
        throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
      }

      if (userRole === UserRole.DOCTOR && prescription.doctor.id !== userId) {
        throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
      }

      return prescription;
    } catch (error) {
      logger.error('Get prescription by ID error:', error);
      throw error;
    }
  }

  async createPrescription(
    prescriptionData: CreatePrescriptionData,
    userRole: UserRole,
    userId: string
  ): Promise<Prescription> {
    try {
      const { patientId, doctorId, medicationId, ...data } = prescriptionData;

      // Only doctors and admins can create prescriptions
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      // If user is a doctor, they can only create prescriptions for themselves
      if (userRole === UserRole.DOCTOR && doctorId !== userId) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      // Validate patient exists
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Validate doctor exists
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      // Validate medication exists
      const medication = await this.medicationRepository.findById(medicationId);
      if (!medication) {
        throw new Error(MESSAGES.ERROR.MEDICATION_NOT_FOUND);
      }

      // Check if prescription start date is not in the past
      if (data.startDate < new Date()) {
        throw new Error('Prescription start date cannot be in the past');
      }

      // Create prescription
      const prescription = await this.prescriptionRepository.create({
        patient,
        doctor,
        medication,
        ...data,
        status: PrescriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Prescription created successfully:', prescription.id);
      return prescription;
    } catch (error) {
      logger.error('Create prescription error:', error);
      throw error;
    }
  }

  async updatePrescription(
    id: string,
    updateData: UpdatePrescriptionData,
    userRole: UserRole,
    userId: string
  ): Promise<Prescription> {
    try {
      const prescription = await this.getPrescriptionById(id, userRole, userId);

      // Only doctors who created the prescription or admins can update
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      if (userRole === UserRole.DOCTOR && prescription.doctor.id !== userId) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      // Don't allow updating completed prescriptions
      if (prescription.status === PrescriptionStatus.COMPLETED) {
        throw new Error('Cannot update completed prescriptions');
      }

      const updatedPrescription = await this.prescriptionRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      } as any);

      if (!updatedPrescription) {
        throw new Error(MESSAGES.ERROR.NOT_FOUND);
      }

      logger.info('Prescription updated successfully:', id);
      return updatedPrescription;
    } catch (error) {
      logger.error('Update prescription error:', error);
      throw error;
    }
  }

  async discontinuePrescription(
    id: string,
    reason: string,
    userRole: UserRole,
    userId: string
  ): Promise<Prescription> {
    try {
      const prescription = await this.getPrescriptionById(id, userRole, userId);

      // Only doctors who created the prescription or admins can discontinue
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      if (userRole === UserRole.DOCTOR && prescription.doctor.id !== userId) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      if (prescription.status === PrescriptionStatus.DISCONTINUED) {
        throw new Error('Prescription is already discontinued');
      }

      const updatedPrescription = await this.prescriptionRepository.update(id, {
        status: PrescriptionStatus.DISCONTINUED,
        notes: reason ? `Discontinued: ${reason}` : 'Prescription discontinued',
        endDate: new Date(),
        updatedAt: new Date(),
      } as any);

      if (!updatedPrescription) {
        throw new Error(MESSAGES.ERROR.NOT_FOUND);
      }

      logger.info('Prescription discontinued successfully:', id);
      return updatedPrescription;
    } catch (error) {
      logger.error('Discontinue prescription error:', error);
      throw error;
    }
  }

  async completePrescription(
    id: string,
    userRole: UserRole,
    userId: string
  ): Promise<Prescription> {
    try {
      const prescription = await this.getPrescriptionById(id, userRole, userId);

      // Only doctors who created the prescription or admins can complete
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      if (userRole === UserRole.DOCTOR && prescription.doctor.id !== userId) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      if (prescription.status === PrescriptionStatus.COMPLETED) {
        throw new Error('Prescription is already completed');
      }

      const updatedPrescription = await this.prescriptionRepository.update(id, {
        status: PrescriptionStatus.COMPLETED,
        endDate: new Date(),
        updatedAt: new Date(),
      } as any);

      if (!updatedPrescription) {
        throw new Error(MESSAGES.ERROR.NOT_FOUND);
      }

      logger.info('Prescription completed successfully:', id);
      return updatedPrescription;
    } catch (error) {
      logger.error('Complete prescription error:', error);
      throw error;
    }
  }

  async getPatientPrescriptions(patientId: string, filters: PrescriptionFilters = {}) {
    try {
      return await this.prescriptionRepository.findByPatientId(patientId);
    } catch (error) {
      logger.error('Get patient prescriptions error:', error);
      throw error;
    }
  }

  async getDoctorPrescriptions(doctorId: string, filters: PrescriptionFilters = {}) {
    try {
      return await this.prescriptionRepository.findByDoctorId(doctorId);
    } catch (error) {
      logger.error('Get doctor prescriptions error:', error);
      throw error;
    }
  }

  async getActivePrescriptions(
    userRole: UserRole,
    userId: string,
    limit: number = 10
  ): Promise<Prescription[]> {
    try {
      const filters = { status: PrescriptionStatus.ACTIVE };
      
      if (userRole === UserRole.PATIENT) {
        return await this.prescriptionRepository.findActiveByPatientId(userId);
      } else if (userRole === UserRole.DOCTOR) {
        // For doctors, get all their prescriptions and filter active ones
        const allPrescriptions = await this.prescriptionRepository.findByDoctorId(userId);
        return allPrescriptions.filter(p => p.status === PrescriptionStatus.ACTIVE);
      } else {
        // Admin gets all active prescriptions
        const prescriptions = await this.prescriptionRepository.findAll({
          where: { status: PrescriptionStatus.ACTIVE },
          relations: ['patient', 'doctor', 'medication'],
          order: { createdAt: 'DESC' },
          take: limit,
        });
        return prescriptions;
      }
    } catch (error) {
      logger.error('Get active prescriptions error:', error);
      throw error;
    }
  }

  async searchPrescriptions(
    searchTerm: string,
    userRole: UserRole,
    userId: string
  ): Promise<Prescription[]> {
    try {
      return await this.prescriptionRepository.searchPrescriptions(searchTerm);
    } catch (error) {
      logger.error('Search prescriptions error:', error);
      throw error;
    }
  }

  async getPrescriptionStats(userRole: UserRole, userId: string) {
    try {
      return await this.prescriptionRepository.getPrescriptionStats();
    } catch (error) {
      logger.error('Get prescription stats error:', error);
      throw error;
    }
  }
}