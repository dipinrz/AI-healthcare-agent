"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionService = void 0;
const prescription_repository_1 = require("../repositories/prescription.repository");
const patient_repository_1 = require("../repositories/patient.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
const medication_repository_1 = require("../repositories/medication.repository");
const Prescription_model_1 = require("../models/Prescription.model");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
const User_model_1 = require("../models/User.model");
class PrescriptionService {
    constructor() {
        this.prescriptionRepository = new prescription_repository_1.PrescriptionRepository();
        this.patientRepository = new patient_repository_1.PatientRepository();
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
        this.medicationRepository = new medication_repository_1.MedicationRepository();
    }
    async getAllPrescriptions(filters, page = 1, limit = 10, userRole, userId) {
        try {
            logger_config_1.logger.info('Getting all prescriptions with filters:', filters);
            let prescriptions;
            // Apply role-based filtering
            if (userRole === User_model_1.UserRole.PATIENT) {
                prescriptions = await this.prescriptionRepository.findByPatientId(userId);
            }
            else if (userRole === User_model_1.UserRole.DOCTOR) {
                prescriptions = await this.prescriptionRepository.findByDoctorId(userId);
            }
            else {
                // Admin can see all prescriptions
                prescriptions = await this.prescriptionRepository.findAll({
                    relations: ['patient', 'doctor', 'medication'],
                    order: { createdAt: 'DESC' },
                });
            }
            // Apply additional filters
            if (filters.status && userRole === User_model_1.UserRole.ADMIN) {
                prescriptions = prescriptions.filter(prescription => prescription.status === filters.status);
            }
            if (filters.medicationId && userRole === User_model_1.UserRole.ADMIN) {
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
        }
        catch (error) {
            logger_config_1.logger.error('Get all prescriptions error:', error);
            throw error;
        }
    }
    async getPrescriptionById(id, userRole, userId) {
        try {
            const prescription = await this.prescriptionRepository.findById(id, {
                relations: ['patient', 'doctor', 'medication'],
            });
            if (!prescription) {
                throw new Error(messages_1.MESSAGES.ERROR.NOT_FOUND);
            }
            // Check permissions
            if (userRole === User_model_1.UserRole.PATIENT && prescription.patient.id !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.UNAUTHORIZED);
            }
            if (userRole === User_model_1.UserRole.DOCTOR && prescription.doctor.id !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.UNAUTHORIZED);
            }
            return prescription;
        }
        catch (error) {
            logger_config_1.logger.error('Get prescription by ID error:', error);
            throw error;
        }
    }
    async createPrescription(prescriptionData, userRole, userId) {
        try {
            const { patientId, doctorId, medicationId, ...data } = prescriptionData;
            // Only doctors and admins can create prescriptions
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            // If user is a doctor, they can only create prescriptions for themselves
            if (userRole === User_model_1.UserRole.DOCTOR && doctorId !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            // Validate patient exists
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Validate doctor exists
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            // Validate medication exists
            const medication = await this.medicationRepository.findById(medicationId);
            if (!medication) {
                throw new Error(messages_1.MESSAGES.ERROR.MEDICATION_NOT_FOUND);
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
                status: Prescription_model_1.PrescriptionStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            logger_config_1.logger.info('Prescription created successfully:', prescription.id);
            return prescription;
        }
        catch (error) {
            logger_config_1.logger.error('Create prescription error:', error);
            throw error;
        }
    }
    async updatePrescription(id, updateData, userRole, userId) {
        try {
            const prescription = await this.getPrescriptionById(id, userRole, userId);
            // Only doctors who created the prescription or admins can update
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            if (userRole === User_model_1.UserRole.DOCTOR && prescription.doctor.id !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            // Don't allow updating completed prescriptions
            if (prescription.status === Prescription_model_1.PrescriptionStatus.COMPLETED) {
                throw new Error('Cannot update completed prescriptions');
            }
            const updatedPrescription = await this.prescriptionRepository.update(id, {
                ...updateData,
                updatedAt: new Date(),
            });
            if (!updatedPrescription) {
                throw new Error(messages_1.MESSAGES.ERROR.NOT_FOUND);
            }
            logger_config_1.logger.info('Prescription updated successfully:', id);
            return updatedPrescription;
        }
        catch (error) {
            logger_config_1.logger.error('Update prescription error:', error);
            throw error;
        }
    }
    async discontinuePrescription(id, reason, userRole, userId) {
        try {
            const prescription = await this.getPrescriptionById(id, userRole, userId);
            // Only doctors who created the prescription or admins can discontinue
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            if (userRole === User_model_1.UserRole.DOCTOR && prescription.doctor.id !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            if (prescription.status === Prescription_model_1.PrescriptionStatus.DISCONTINUED) {
                throw new Error('Prescription is already discontinued');
            }
            const updatedPrescription = await this.prescriptionRepository.update(id, {
                status: Prescription_model_1.PrescriptionStatus.DISCONTINUED,
                notes: reason ? `Discontinued: ${reason}` : 'Prescription discontinued',
                endDate: new Date(),
                updatedAt: new Date(),
            });
            if (!updatedPrescription) {
                throw new Error(messages_1.MESSAGES.ERROR.NOT_FOUND);
            }
            logger_config_1.logger.info('Prescription discontinued successfully:', id);
            return updatedPrescription;
        }
        catch (error) {
            logger_config_1.logger.error('Discontinue prescription error:', error);
            throw error;
        }
    }
    async completePrescription(id, userRole, userId) {
        try {
            const prescription = await this.getPrescriptionById(id, userRole, userId);
            // Only doctors who created the prescription or admins can complete
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            if (userRole === User_model_1.UserRole.DOCTOR && prescription.doctor.id !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            if (prescription.status === Prescription_model_1.PrescriptionStatus.COMPLETED) {
                throw new Error('Prescription is already completed');
            }
            const updatedPrescription = await this.prescriptionRepository.update(id, {
                status: Prescription_model_1.PrescriptionStatus.COMPLETED,
                endDate: new Date(),
                updatedAt: new Date(),
            });
            if (!updatedPrescription) {
                throw new Error(messages_1.MESSAGES.ERROR.NOT_FOUND);
            }
            logger_config_1.logger.info('Prescription completed successfully:', id);
            return updatedPrescription;
        }
        catch (error) {
            logger_config_1.logger.error('Complete prescription error:', error);
            throw error;
        }
    }
    async getPatientPrescriptions(patientId, filters = {}) {
        try {
            return await this.prescriptionRepository.findByPatientId(patientId);
        }
        catch (error) {
            logger_config_1.logger.error('Get patient prescriptions error:', error);
            throw error;
        }
    }
    async getDoctorPrescriptions(doctorId, filters = {}) {
        try {
            return await this.prescriptionRepository.findByDoctorId(doctorId);
        }
        catch (error) {
            logger_config_1.logger.error('Get doctor prescriptions error:', error);
            throw error;
        }
    }
    async getActivePrescriptions(userRole, userId, limit = 10) {
        try {
            const filters = { status: Prescription_model_1.PrescriptionStatus.ACTIVE };
            if (userRole === User_model_1.UserRole.PATIENT) {
                return await this.prescriptionRepository.findActiveByPatientId(userId);
            }
            else if (userRole === User_model_1.UserRole.DOCTOR) {
                // For doctors, get all their prescriptions and filter active ones
                const allPrescriptions = await this.prescriptionRepository.findByDoctorId(userId);
                return allPrescriptions.filter(p => p.status === Prescription_model_1.PrescriptionStatus.ACTIVE);
            }
            else {
                // Admin gets all active prescriptions
                const prescriptions = await this.prescriptionRepository.findAll({
                    where: { status: Prescription_model_1.PrescriptionStatus.ACTIVE },
                    relations: ['patient', 'doctor', 'medication'],
                    order: { createdAt: 'DESC' },
                    take: limit,
                });
                return prescriptions;
            }
        }
        catch (error) {
            logger_config_1.logger.error('Get active prescriptions error:', error);
            throw error;
        }
    }
    async searchPrescriptions(searchTerm, userRole, userId) {
        try {
            return await this.prescriptionRepository.searchPrescriptions(searchTerm);
        }
        catch (error) {
            logger_config_1.logger.error('Search prescriptions error:', error);
            throw error;
        }
    }
    async getPrescriptionStats(userRole, userId) {
        try {
            return await this.prescriptionRepository.getPrescriptionStats();
        }
        catch (error) {
            logger_config_1.logger.error('Get prescription stats error:', error);
            throw error;
        }
    }
}
exports.PrescriptionService = PrescriptionService;
