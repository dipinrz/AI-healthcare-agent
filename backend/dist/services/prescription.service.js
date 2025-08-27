"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionService = void 0;
const prescription_repository_1 = require("../repositories/prescription.repository");
const prescriptionItem_repository_1 = require("../repositories/prescriptionItem.repository");
const patient_repository_1 = require("../repositories/patient.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
const medication_repository_1 = require("../repositories/medication.repository");
const user_repository_1 = require("../repositories/user.repository");
const Prescription_model_1 = require("../models/Prescription.model");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
const User_model_1 = require("../models/User.model");
class PrescriptionService {
    constructor() {
        this.prescriptionRepository = new prescription_repository_1.PrescriptionRepository();
        this.prescriptionItemRepository = new prescriptionItem_repository_1.PrescriptionItemRepository();
        this.patientRepository = new patient_repository_1.PatientRepository();
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
        this.medicationRepository = new medication_repository_1.MedicationRepository();
        this.userRepository = new user_repository_1.UserRepository();
    }
    async getAllPrescriptions(filters, page = 1, limit = 10, userRole, userId) {
        try {
            logger_config_1.logger.info('Getting all prescriptions with filters:', filters);
            let prescriptions;
            // Apply role-based filtering
            if (userRole === User_model_1.UserRole.PATIENT) {
                // Get the user's patient ID for filtering
                const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
                logger_config_1.logger.info('User with patient relation:', { userId, userWithPatient: userWithPatient ? { id: userWithPatient.id, email: userWithPatient.email, patient: userWithPatient.patient } : null });
                const patientId = userWithPatient?.patient?.id;
                logger_config_1.logger.info('Patient ID for filtering:', { patientId });
                if (patientId) {
                    prescriptions = await this.prescriptionRepository.findByPatientId(patientId);
                    logger_config_1.logger.info('Found prescriptions for patient:', { patientId, count: prescriptions.length });
                }
                else {
                    prescriptions = [];
                    logger_config_1.logger.info('No patient ID found, returning empty array');
                }
            }
            else if (userRole === User_model_1.UserRole.DOCTOR) {
                // Get the user's doctor ID for filtering
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                const doctorId = userWithDoctor?.doctor?.id;
                if (doctorId) {
                    prescriptions = await this.prescriptionRepository.findByDoctorId(doctorId);
                }
                else {
                    prescriptions = [];
                }
            }
            else {
                // Admin can see all prescriptions
                prescriptions = await this.prescriptionRepository.findAll({
                    relations: ['patient', 'doctor', 'prescriptionItems', 'prescriptionItems.medication'],
                    order: { createdAt: 'DESC' },
                });
            }
            // Apply additional filters
            if (filters.status && userRole === User_model_1.UserRole.ADMIN) {
                prescriptions = prescriptions.filter(prescription => prescription.status === filters.status);
            }
            if (filters.medicationId && userRole === User_model_1.UserRole.ADMIN) {
                prescriptions = prescriptions.filter(prescription => prescription.prescriptionItems.some(item => item.medication.id === filters.medicationId));
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
                relations: ['patient', 'doctor', 'prescriptionItems', 'prescriptionItems.medication'],
            });
            if (!prescription) {
                throw new Error(messages_1.MESSAGES.ERROR.NOT_FOUND);
            }
            // Check permissions
            if (userRole === User_model_1.UserRole.PATIENT) {
                // Get the user's patient ID for permission check
                const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
                const patientId = userWithPatient?.patient?.id;
                if (prescription.patient.id !== patientId) {
                    throw new Error(messages_1.MESSAGES.ERROR.UNAUTHORIZED);
                }
            }
            if (userRole === User_model_1.UserRole.DOCTOR) {
                // Get the user's doctor ID for permission check
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                const doctorId = userWithDoctor?.doctor?.id;
                if (prescription.doctor.id !== doctorId) {
                    throw new Error(messages_1.MESSAGES.ERROR.UNAUTHORIZED);
                }
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
            const { patientId, doctorId, medications, ...data } = prescriptionData;
            // Only doctors and admins can create prescriptions
            if (userRole === User_model_1.UserRole.PATIENT) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            // If user is a doctor, they can only create prescriptions for themselves
            // Get the user's doctor profile to check permissions
            if (userRole === User_model_1.UserRole.DOCTOR) {
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                const userDoctorId = userWithDoctor?.doctor?.id;
                if (doctorId !== userDoctorId) {
                    throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
                }
            }
            // Validate at least one medication is provided
            if (!medications || medications.length === 0) {
                throw new Error('At least one medication is required for a prescription');
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
                status: Prescription_model_1.PrescriptionStatus.ACTIVE,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            // Create prescription items for each medication
            const prescriptionItems = medications.map(medData => ({
                prescription,
                medication: { id: medData.medicationId },
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
            logger_config_1.logger.info('Multi-medication prescription created successfully:', prescription.id);
            return completePrescription;
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
            if (userRole === User_model_1.UserRole.DOCTOR) {
                // Get the user's doctor ID for permission check
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                const doctorId = userWithDoctor?.doctor?.id;
                if (prescription.doctor.id !== doctorId) {
                    throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
                }
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
            if (userRole === User_model_1.UserRole.DOCTOR) {
                // Get the user's doctor ID for permission check
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                const doctorId = userWithDoctor?.doctor?.id;
                if (prescription.doctor.id !== doctorId) {
                    throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
                }
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
            if (userRole === User_model_1.UserRole.DOCTOR) {
                // Get the user's doctor ID for permission check
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                const doctorId = userWithDoctor?.doctor?.id;
                if (prescription.doctor.id !== doctorId) {
                    throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
                }
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
                // Get the user's patient ID for filtering
                const userWithPatient = await this.userRepository.findByIdWithRelations(userId);
                const patientId = userWithPatient?.patient?.id;
                if (patientId) {
                    return await this.prescriptionRepository.findActiveByPatientId(patientId);
                }
                else {
                    return [];
                }
            }
            else if (userRole === User_model_1.UserRole.DOCTOR) {
                // Get the user's doctor ID for filtering
                const userWithDoctor = await this.userRepository.findByIdWithRelations(userId);
                const doctorId = userWithDoctor?.doctor?.id;
                if (doctorId) {
                    const allPrescriptions = await this.prescriptionRepository.findByDoctorId(doctorId);
                    return allPrescriptions.filter(p => p.status === Prescription_model_1.PrescriptionStatus.ACTIVE);
                }
                else {
                    return [];
                }
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
