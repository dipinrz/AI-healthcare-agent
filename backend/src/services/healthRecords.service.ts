import { MedicalDocumentRepository } from '../repositories/medicalDocument.repository';
import { VitalSignsRepository } from '../repositories/vitalSigns.repository';
import { LabResultRepository } from '../repositories/labResult.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { UserRepository } from '../repositories/user.repository';
import { MedicalDocument, DocumentType } from '../models/MedicalDocument.model';
import { VitalSigns } from '../models/VitalSigns.model';
import { LabResult, LabResultStatus } from '../models/LabResult.model';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';
import { UserRole } from '../models/User.model';
import * as path from 'path';
import * as fs from 'fs';

export interface CreateMedicalDocumentData {
  name: string;
  type: DocumentType;
  description?: string;
  documentDate?: Date;
  notes?: string;
  file?: {
    fileName: string;
    filePath: string;
    fileType: string;
    fileSize: number;
  };
}

export interface CreateVitalSignsData {
  recordedDate?: Date;
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
  status?: LabResultStatus;
  testDate?: Date;
  resultDate?: Date;
  notes?: string;
  labFacility?: string;
  interpretation?: string;
}

export class HealthRecordsService {
  private medicalDocumentRepository = new MedicalDocumentRepository();
  private vitalSignsRepository = new VitalSignsRepository();
  private labResultRepository = new LabResultRepository();
  private patientRepository = new PatientRepository();
  private doctorRepository = new DoctorRepository();
  private userRepository = new UserRepository();

  // Health Records Overview
  async getHealthRecord(patientId: string, userRole: UserRole, userId: string) {
    try {
      logger.info('Getting health record for patient:', { patientId, userRole, userId });

      // Check permissions
      await this.checkPatientAccess(patientId, userRole, userId);

      // Get patient info
      const patient = await this.patientRepository.findById(patientId);

      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Get all health record components in parallel
      const [vitalSigns, labResults, documents] = await Promise.all([
        this.vitalSignsRepository.findByPatientId(patientId),
        this.labResultRepository.findByPatientId(patientId),
        this.medicalDocumentRepository.findByPatientId(patientId)
      ]);

      return {
        patient: {
          id: patient.id,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
          phone: patient.phone || '',
          dateOfBirth: patient.dateOfBirth,
          gender: patient.gender,
          address: patient.address || '',
          allergies: patient.allergies || [],
          emergencyContact: patient.emergencyContact || ''
        },
        vitalSigns,
        labResults,
        documents
      };
    } catch (error) {
      logger.error('Get health record error:', error);
      throw error;
    }
  }

  // Medical Documents
  async addMedicalDocument(
    patientId: string,
    documentData: CreateMedicalDocumentData,
    userRole: UserRole,
    userId: string
  ): Promise<MedicalDocument> {
    try {
      logger.info('Adding medical document:', { patientId, documentData, userRole, userId });

      // Check permissions - only doctors and admins can add documents
      if (userRole === UserRole.PATIENT) {
        // Patients can upload their own documents
        await this.checkPatientAccess(patientId, userRole, userId);
      }

      // Get patient
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Get doctor if not patient
      let doctor = null;
      if (userRole === UserRole.DOCTOR) {
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        if (userWithDoctor?.doctor) {
          doctor = userWithDoctor.doctor;
        }
      }

      // Create document
      const document = await this.medicalDocumentRepository.create({
        patient,
        createdBy: doctor,
        name: documentData.name,
        type: documentData.type,
        description: documentData.description,
        documentDate: documentData.documentDate || new Date(),
        filePath: documentData.file?.filePath,
        fileName: documentData.file?.fileName,
        fileType: documentData.file?.fileType,
        fileSize: documentData.file?.fileSize,
        notes: documentData.notes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Medical document created successfully:', document.id);
      return document;
    } catch (error) {
      logger.error('Add medical document error:', error);
      throw error;
    }
  }

  async getMedicalDocuments(patientId: string, userRole: UserRole, userId: string) {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);
      return await this.medicalDocumentRepository.findByPatientId(patientId);
    } catch (error) {
      logger.error('Get medical documents error:', error);
      throw error;
    }
  }

  async deleteMedicalDocument(
    patientId: string,
    documentId: string,
    userRole: UserRole,
    userId: string
  ): Promise<boolean> {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);
      
      // Get document to verify it belongs to the patient
      const document = await this.medicalDocumentRepository.findById(documentId, {
        relations: ['patient']
      });

      if (!document || document.patient.id !== patientId) {
        throw new Error(MESSAGES.ERROR.NOT_FOUND);
      }

      // Delete file if exists
      if (document.filePath && fs.existsSync(document.filePath)) {
        fs.unlinkSync(document.filePath);
      }

      // Soft delete the document
      return await this.medicalDocumentRepository.softDelete(documentId);
    } catch (error) {
      logger.error('Delete medical document error:', error);
      throw error;
    }
  }

  // Vital Signs
  async addVitalSigns(
    patientId: string,
    vitalSignsData: CreateVitalSignsData,
    userRole: UserRole,
    userId: string
  ): Promise<VitalSigns> {
    try {
      logger.info('Adding vital signs:', { patientId, vitalSignsData, userRole, userId });

      // Only doctors and admins can add vital signs
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      // Get patient
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Get doctor
      let doctor = null;
      if (userRole === UserRole.DOCTOR) {
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        if (userWithDoctor?.doctor) {
          doctor = userWithDoctor.doctor;
        } else {
          throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
        }
      }

      // Create vital signs
      const vitalSigns = await this.vitalSignsRepository.create({
        patient,
        recordedBy: doctor,
        recordedDate: vitalSignsData.recordedDate || new Date(),
        systolicBP: vitalSignsData.systolicBP,
        diastolicBP: vitalSignsData.diastolicBP,
        heartRate: vitalSignsData.heartRate,
        temperature: vitalSignsData.temperature,
        weight: vitalSignsData.weight,
        height: vitalSignsData.height,
        oxygenSaturation: vitalSignsData.oxygenSaturation,
        notes: vitalSignsData.notes,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Vital signs created successfully:', vitalSigns.id);
      return vitalSigns;
    } catch (error) {
      logger.error('Add vital signs error:', error);
      throw error;
    }
  }

  async getVitalSigns(patientId: string, userRole: UserRole, userId: string) {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);
      return await this.vitalSignsRepository.findByPatientId(patientId);
    } catch (error) {
      logger.error('Get vital signs error:', error);
      throw error;
    }
  }

  async updateVitalSigns(
    patientId: string,
    vitalId: string,
    vitalSignsData: Partial<CreateVitalSignsData>,
    userRole: UserRole,
    userId: string
  ): Promise<VitalSigns> {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);

      // Only doctors and admins can update vital signs
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      const updatedVitalSigns = await this.vitalSignsRepository.update(vitalId, {
        ...vitalSignsData,
        updatedAt: new Date()
      } as any);

      if (!updatedVitalSigns) {
        throw new Error(MESSAGES.ERROR.NOT_FOUND);
      }

      logger.info('Vital signs updated successfully:', vitalId);
      return updatedVitalSigns;
    } catch (error) {
      logger.error('Update vital signs error:', error);
      throw error;
    }
  }

  async deleteVitalSigns(
    patientId: string,
    vitalId: string,
    userRole: UserRole,
    userId: string
  ): Promise<boolean> {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);

      // Only doctors and admins can delete vital signs
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      const result = await this.vitalSignsRepository.delete(vitalId);
      return result !== undefined;
    } catch (error) {
      logger.error('Delete vital signs error:', error);
      throw error;
    }
  }

  // Lab Results
  async addLabResult(
    patientId: string,
    labResultData: CreateLabResultData,
    userRole: UserRole,
    userId: string
  ): Promise<LabResult> {
    try {
      logger.info('Adding lab result:', { patientId, labResultData, userRole, userId });

      // Only doctors and admins can add lab results
      if (userRole === UserRole.PATIENT) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      // Get patient
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Get doctor
      let doctor = null;
      if (userRole === UserRole.DOCTOR) {
        const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
        if (userWithDoctor?.doctor) {
          doctor = userWithDoctor.doctor;
        } else {
          throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
        }
      }

      // Create lab result
      const labResult = await this.labResultRepository.create({
        patient,
        orderedBy: doctor,
        testName: labResultData.testName,
        value: labResultData.value,
        unit: labResultData.unit,
        referenceRange: labResultData.referenceRange,
        status: labResultData.status || LabResultStatus.PENDING,
        testDate: labResultData.testDate || new Date(),
        resultDate: labResultData.resultDate,
        notes: labResultData.notes,
        labFacility: labResultData.labFacility,
        interpretation: labResultData.interpretation,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      logger.info('Lab result created successfully:', labResult.id);
      return labResult;
    } catch (error) {
      logger.error('Add lab result error:', error);
      throw error;
    }
  }

  async getLabResults(patientId: string, userRole: UserRole, userId: string) {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);
      return await this.labResultRepository.findByPatientId(patientId);
    } catch (error) {
      logger.error('Get lab results error:', error);
      throw error;
    }
  }

  // Utility Methods
  private async checkPatientAccess(patientId: string, userRole: UserRole, userId: string): Promise<void> {
    if (userRole === UserRole.ADMIN) {
      return; // Admin has access to all patients
    }

    if (userRole === UserRole.PATIENT) {
      // Check if the user is the patient
      const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
      const userPatientId = userWithPatient?.patient?.id;
      
      if (userPatientId !== patientId) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }
    }

    if (userRole === UserRole.DOCTOR) {
      // Doctors can access any patient's records (assuming they have medical authority)
      // In a real system, you might want to check if the doctor is treating this patient
      return;
    }
  }

  // File Management
  createUploadPath(patientId: string, fileName: string): string {
    const uploadDir = path.join(process.cwd(), 'uploads', 'health-records', patientId);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    return path.join(uploadDir, fileName);
  }

  getFileUrl(filePath: string): string {
    // Convert absolute file path to relative URL
    const relativePath = path.relative(process.cwd(), filePath);
    return `/${relativePath.replace(/\\/g, '/')}`;
  }

  // Search and Statistics
  async searchHealthRecords(
    patientId: string,
    searchTerm: string,
    userRole: UserRole,
    userId: string
  ) {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);

      const [documents, labResults] = await Promise.all([
        this.medicalDocumentRepository.searchDocuments(patientId, searchTerm),
        this.labResultRepository.searchLabResults(patientId, searchTerm)
      ]);

      return { documents, labResults };
    } catch (error) {
      logger.error('Search health records error:', error);
      throw error;
    }
  }

  async getHealthRecordStats(patientId: string, userRole: UserRole, userId: string) {
    try {
      await this.checkPatientAccess(patientId, userRole, userId);

      const [documentStats, labStats] = await Promise.all([
        this.medicalDocumentRepository.getDocumentStats(patientId),
        this.labResultRepository.getLabStats(patientId)
      ]);

      return { documentStats, labStats };
    } catch (error) {
      logger.error('Get health record stats error:', error);
      throw error;
    }
  }
}