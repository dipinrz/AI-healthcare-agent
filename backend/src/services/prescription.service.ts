import { PrescriptionRepository } from '../repositories/prescription.repository';
import { PrescriptionItemRepository } from '../repositories/prescriptionItem.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { MedicationRepository } from '../repositories/medication.repository';
import { UserRepository } from '../repositories/user.repository';
import { Prescription, PrescriptionStatus } from '../models/Prescription.model';
import { PrescriptionItem } from '../models/PrescriptionItem.model';
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
  startDate: Date;
  endDate?: Date;
  prescriptionNotes?: string;
  medications: CreatePrescriptionItemData[];
}

export interface UpdatePrescriptionData {
  startDate?: Date;
  endDate?: Date;
  prescriptionNotes?: string;
  status?: PrescriptionStatus;
  medications?: CreatePrescriptionItemData[];
}

export class PrescriptionService {
  private prescriptionRepository = new PrescriptionRepository();
  private prescriptionItemRepository = new PrescriptionItemRepository();
  private patientRepository = new PatientRepository();
  private doctorRepository = new DoctorRepository();
  private medicationRepository = new MedicationRepository();
  private userRepository = new UserRepository();

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
        // Get the user's patient ID for filtering
        const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
        logger.info('User with patient relation:', { userId, userWithPatient: userWithPatient ? { id: userWithPatient.id, email: userWithPatient.email, patient: userWithPatient.patient } : null });
        const patientId = userWithPatient?.patient?.id;
        logger.info('Patient ID for filtering:', { patientId });
        if (patientId) {
          prescriptions = await this.prescriptionRepository.findByPatientId(patientId);
          logger.info('Found prescriptions for patient:', { patientId, count: prescriptions.length });
        } else {
          prescriptions = [];
          logger.info('No patient ID found, returning empty array');
        }
      } else if (userRole === UserRole.DOCTOR) {
        // Get the user's doctor ID for filtering
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        const doctorId = userWithDoctor?.doctor?.id;
        if (doctorId) {
          prescriptions = await this.prescriptionRepository.findByDoctorId(doctorId);
        } else {
          prescriptions = [];
        }
      } else {
        // Admin can see all prescriptions
        prescriptions = await this.prescriptionRepository.findAll({
          relations: ['patient', 'doctor', 'prescriptionItems', 'prescriptionItems.medication'],
          order: { createdAt: 'DESC' },
        });
      }

      // Apply additional filters
      if (filters.status && userRole === UserRole.ADMIN) {
        prescriptions = prescriptions.filter(prescription => prescription.status === filters.status);
      }

      if (filters.medicationId && userRole === UserRole.ADMIN) {
        prescriptions = prescriptions.filter(prescription => 
          prescription.prescriptionItems.some(item => item.medication.id === filters.medicationId)
        );
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
        relations: ['patient', 'doctor', 'prescriptionItems', 'prescriptionItems.medication'],
      });
      
      if (!prescription) {
        throw new Error(MESSAGES.ERROR.NOT_FOUND);
      }

      // Check permissions
      if (userRole === UserRole.PATIENT) {
        // Get the user's patient ID for permission check
        const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
        const patientId = userWithPatient?.patient?.id;
        if (prescription.patient.id !== patientId) {
          throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
        }
      }

      if (userRole === UserRole.DOCTOR) {
        // Get the user's doctor ID for permission check
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        const doctorId = userWithDoctor?.doctor?.id;
        if (prescription.doctor.id !== doctorId) {
          throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
        }
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
      const { patientId, doctorId, medications, ...data } = prescriptionData;

      // Only doctors and admins can create prescriptions
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      // If user is a doctor, they can only create prescriptions for themselves
      // Get the user's doctor profile to check permissions
      if (userRole === UserRole.DOCTOR) {
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        const userDoctorId = userWithDoctor?.doctor?.id;
        if (doctorId !== userDoctorId) {
          throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
        }
      }

      // Validate at least one medication is provided
      if (!medications || medications.length === 0) {
        throw new Error('At least one medication is required for a prescription');
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

      // Validate all medications exist
      for (const medData of medications) {
        const medication = await this.medicationRepository.findById(medData.medicationId);
        if (!medication) {
          throw new Error(`Medication with ID ${medData.medicationId} not found`);
        }
      }

      // Check if prescription start date is not in the past
      if (data.startDate < new Date()) {
        throw new Error('Prescription start date cannot be in the past');
      }

      // Create prescription
      const prescription = await this.prescriptionRepository.create({
        patient,
        doctor,
        ...data,
        status: PrescriptionStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Create prescription items for each medication
      const prescriptionItems: Partial<PrescriptionItem>[] = medications.map(medData => ({
        prescription,
        medication: { id: medData.medicationId } as any,
        dosage: medData.dosage,
        frequency: medData.frequency,
        duration: medData.duration,
        instructions: medData.instructions,
        quantity: medData.quantity,
        refills: medData.refills,
        notes: medData.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await this.prescriptionItemRepository.createBulkPrescriptionItems(prescriptionItems);

      // Fetch complete prescription with items
      const completePrescription = await this.prescriptionRepository.findById(prescription.id, {
        relations: ['patient', 'doctor', 'prescriptionItems', 'prescriptionItems.medication'],
      });

      logger.info('Multi-medication prescription created successfully:', prescription.id);
      return completePrescription!;
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

      if (userRole === UserRole.DOCTOR) {
        // Get the user's doctor ID for permission check
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        const doctorId = userWithDoctor?.doctor?.id;
        if (prescription.doctor.id !== doctorId) {
          throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
        }
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

      if (userRole === UserRole.DOCTOR) {
        // Get the user's doctor ID for permission check
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        const doctorId = userWithDoctor?.doctor?.id;
        if (prescription.doctor.id !== doctorId) {
          throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
        }
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

      if (userRole === UserRole.DOCTOR) {
        // Get the user's doctor ID for permission check
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        const doctorId = userWithDoctor?.doctor?.id;
        if (prescription.doctor.id !== doctorId) {
          throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
        }
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
        // Get the user's patient ID for filtering
        const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
        const patientId = userWithPatient?.patient?.id;
        if (patientId) {
          return await this.prescriptionRepository.findActiveByPatientId(patientId);
        } else {
          return [];
        }
      } else if (userRole === UserRole.DOCTOR) {
        // Get the user's doctor ID for filtering
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        const doctorId = userWithDoctor?.doctor?.id;
        if (doctorId) {
          const allPrescriptions = await this.prescriptionRepository.findByDoctorId(doctorId);
          return allPrescriptions.filter(p => p.status === PrescriptionStatus.ACTIVE);
        } else {
          return [];
        }
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