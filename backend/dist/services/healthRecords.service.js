"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthRecordsService = void 0;
const medicalDocument_repository_1 = require("../repositories/medicalDocument.repository");
const vitalSigns_repository_1 = require("../repositories/vitalSigns.repository");
const labResult_repository_1 = require("../repositories/labResult.repository");
const patient_repository_1 = require("../repositories/patient.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
const user_repository_1 = require("../repositories/user.repository");
const LabResult_model_1 = require("../models/LabResult.model");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
const User_model_1 = require("../models/User.model");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class HealthRecordsService {
    constructor() {
        this.medicalDocumentRepository = new medicalDocument_repository_1.MedicalDocumentRepository();
        this.vitalSignsRepository = new vitalSigns_repository_1.VitalSignsRepository();
        this.labResultRepository = new labResult_repository_1.LabResultRepository();
        this.patientRepository = new patient_repository_1.PatientRepository();
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
    // Health Records Overview
    async getHealthRecord(patientId, userRole, userId) {
        try {
            logger_config_1.logger.info('Getting health record for patient:', { patientId, userRole, userId });
            // Check permissions
            await this.checkPatientAccess(patientId, userRole, userId);
            // Get patient info
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
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
        }
        catch (error) {
            logger_config_1.logger.error('Get health record error:', error);
            throw error;
        }
    }
    // Medical Documents
    async addMedicalDocument(patientId, documentData, userRole, userId) {
        try {
            logger_config_1.logger.info('Adding medical document:', { patientId, documentData, userRole, userId });
            // Check permissions - only doctors and admins can add documents
            if (userRole === User_model_1.UserRole.PATIENT) {
                // Patients can upload their own documents
                await this.checkPatientAccess(patientId, userRole, userId);
            }
            // Get patient
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Get doctor if not patient
            let doctor = null;
            if (userRole === User_model_1.UserRole.DOCTOR) {
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
            logger_config_1.logger.info('Medical document created successfully:', document.id);
            return document;
        }
        catch (error) {
            logger_config_1.logger.error('Add medical document error:', error);
            throw error;
        }
    }
    async getMedicalDocuments(patientId, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            return await this.medicalDocumentRepository.findByPatientId(patientId);
        }
        catch (error) {
            logger_config_1.logger.error('Get medical documents error:', error);
            throw error;
        }
    }
    async deleteMedicalDocument(patientId, documentId, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            // Get document to verify it belongs to the patient
            const document = await this.medicalDocumentRepository.findById(documentId, {
                relations: ['patient']
            });
            if (!document || document.patient.id !== patientId) {
                throw new Error(messages_1.MESSAGES.ERROR.NOT_FOUND);
            }
            // Delete file if exists
            if (document.filePath && fs.existsSync(document.filePath)) {
                fs.unlinkSync(document.filePath);
            }
            // Soft delete the document
            return await this.medicalDocumentRepository.softDelete(documentId);
        }
        catch (error) {
            logger_config_1.logger.error('Delete medical document error:', error);
            throw error;
        }
    }
    // Vital Signs
    async addVitalSigns(patientId, vitalSignsData, userRole, userId) {
        try {
            logger_config_1.logger.info('Adding vital signs:', { patientId, vitalSignsData, userRole, userId });
            // Only doctors and admins can add vital signs
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            // Get patient
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Get doctor
            let doctor = null;
            if (userRole === User_model_1.UserRole.DOCTOR) {
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                if (userWithDoctor?.doctor) {
                    doctor = userWithDoctor.doctor;
                }
                else {
                    throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
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
            logger_config_1.logger.info('Vital signs created successfully:', vitalSigns.id);
            return vitalSigns;
        }
        catch (error) {
            logger_config_1.logger.error('Add vital signs error:', error);
            throw error;
        }
    }
    async getVitalSigns(patientId, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            return await this.vitalSignsRepository.findByPatientId(patientId);
        }
        catch (error) {
            logger_config_1.logger.error('Get vital signs error:', error);
            throw error;
        }
    }
    async updateVitalSigns(patientId, vitalId, vitalSignsData, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            // Only doctors and admins can update vital signs
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            const updatedVitalSigns = await this.vitalSignsRepository.update(vitalId, {
                ...vitalSignsData,
                updatedAt: new Date()
            });
            if (!updatedVitalSigns) {
                throw new Error(messages_1.MESSAGES.ERROR.NOT_FOUND);
            }
            logger_config_1.logger.info('Vital signs updated successfully:', vitalId);
            return updatedVitalSigns;
        }
        catch (error) {
            logger_config_1.logger.error('Update vital signs error:', error);
            throw error;
        }
    }
    async deleteVitalSigns(patientId, vitalId, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            // Only doctors and admins can delete vital signs
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            const result = await this.vitalSignsRepository.delete(vitalId);
            return result !== undefined;
        }
        catch (error) {
            logger_config_1.logger.error('Delete vital signs error:', error);
            throw error;
        }
    }
    // Lab Results
    async addLabResult(patientId, labResultData, userRole, userId) {
        try {
            logger_config_1.logger.info('Adding lab result:', { patientId, labResultData, userRole, userId });
            // Only doctors and admins can add lab results
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            // Get patient
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Get doctor
            let doctor = null;
            if (userRole === User_model_1.UserRole.DOCTOR) {
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                if (userWithDoctor?.doctor) {
                    doctor = userWithDoctor.doctor;
                }
                else {
                    throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
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
                status: labResultData.status || LabResult_model_1.LabResultStatus.PENDING,
                testDate: labResultData.testDate || new Date(),
                resultDate: labResultData.resultDate,
                notes: labResultData.notes,
                labFacility: labResultData.labFacility,
                interpretation: labResultData.interpretation,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            logger_config_1.logger.info('Lab result created successfully:', labResult.id);
            return labResult;
        }
        catch (error) {
            logger_config_1.logger.error('Add lab result error:', error);
            throw error;
        }
    }
    async getLabResults(patientId, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            return await this.labResultRepository.findByPatientId(patientId);
        }
        catch (error) {
            logger_config_1.logger.error('Get lab results error:', error);
            throw error;
        }
    }
    // Utility Methods
    async checkPatientAccess(patientId, userRole, userId) {
        if (userRole === User_model_1.UserRole.ADMIN) {
            return; // Admin has access to all patients
        }
        if (userRole === User_model_1.UserRole.PATIENT) {
            // Check if the user is the patient
            const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
            const userPatientId = userWithPatient?.patient?.id;
            if (userPatientId !== patientId) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
        }
        if (userRole === User_model_1.UserRole.DOCTOR) {
            // Doctors can access any patient's records (assuming they have medical authority)
            // In a real system, you might want to check if the doctor is treating this patient
            return;
        }
    }
    // File Management
    createUploadPath(patientId, fileName) {
        const uploadDir = path.join(process.cwd(), 'uploads', 'health-records', patientId);
        // Create directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        return path.join(uploadDir, fileName);
    }
    getFileUrl(filePath) {
        // Convert absolute file path to relative URL
        const relativePath = path.relative(process.cwd(), filePath);
        return `/${relativePath.replace(/\\/g, '/')}`;
    }
    // Search and Statistics
    async searchHealthRecords(patientId, searchTerm, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            const [documents, labResults] = await Promise.all([
                this.medicalDocumentRepository.searchDocuments(patientId, searchTerm),
                this.labResultRepository.searchLabResults(patientId, searchTerm)
            ]);
            return { documents, labResults };
        }
        catch (error) {
            logger_config_1.logger.error('Search health records error:', error);
            throw error;
        }
    }
    async getHealthRecordStats(patientId, userRole, userId) {
        try {
            await this.checkPatientAccess(patientId, userRole, userId);
            const [documentStats, labStats] = await Promise.all([
                this.medicalDocumentRepository.getDocumentStats(patientId),
                this.labResultRepository.getLabStats(patientId)
            ]);
            return { documentStats, labStats };
        }
        catch (error) {
            logger_config_1.logger.error('Get health record stats error:', error);
            throw error;
        }
    }
}
exports.HealthRecordsService = HealthRecordsService;
