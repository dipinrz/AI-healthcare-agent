"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientService = void 0;
const patient_repository_1 = require("../repositories/patient.repository");
const appointment_repository_1 = require("../repositories/appointment.repository");
const prescription_repository_1 = require("../repositories/prescription.repository");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
class PatientService {
    constructor() {
        this.patientRepository = new patient_repository_1.PatientRepository();
        this.appointmentRepository = new appointment_repository_1.AppointmentRepository();
        this.prescriptionRepository = new prescription_repository_1.PrescriptionRepository();
    }
    async getAllPatients(filters, page = 1, limit = 10) {
        try {
            logger_config_1.logger.info('Getting all patients with filters:', filters);
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
            let patients;
            if (filters.gender) {
                patients = await this.patientRepository.findByGender(filters.gender);
            }
            else if (filters.ageMin || filters.ageMax) {
                patients = await this.patientRepository.findByAge(filters.ageMin || 0, filters.ageMax);
            }
            else {
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
        }
        catch (error) {
            logger_config_1.logger.error('Get all patients error:', error);
            throw error;
        }
    }
    async getPatientById(id) {
        try {
            const patient = await this.patientRepository.findById(id);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            return patient;
        }
        catch (error) {
            logger_config_1.logger.error('Get patient by ID error:', error);
            throw error;
        }
    }
    async createPatient(patientData) {
        try {
            // Check if patient with email already exists
            if (patientData.email) {
                const existingPatient = await this.patientRepository.findByEmail(patientData.email);
                if (existingPatient) {
                    throw new Error(messages_1.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
                }
            }
            const patient = await this.patientRepository.create({
                ...patientData,
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            logger_config_1.logger.info('Patient created successfully:', patient.id);
            return patient;
        }
        catch (error) {
            logger_config_1.logger.error('Create patient error:', error);
            throw error;
        }
    }
    async updatePatient(id, updateData) {
        try {
            const existingPatient = await this.patientRepository.findById(id);
            if (!existingPatient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Check email uniqueness if email is being updated
            if (updateData.email && updateData.email !== existingPatient.email) {
                const patientWithEmail = await this.patientRepository.findByEmail(updateData.email);
                if (patientWithEmail && patientWithEmail.id !== id) {
                    throw new Error(messages_1.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
                }
            }
            const updatedPatient = await this.patientRepository.update(id, {
                ...updateData,
                updatedAt: new Date(),
            });
            if (!updatedPatient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            logger_config_1.logger.info('Patient updated successfully:', id);
            return updatedPatient;
        }
        catch (error) {
            logger_config_1.logger.error('Update patient error:', error);
            throw error;
        }
    }
    async deletePatient(id) {
        try {
            const patient = await this.patientRepository.findById(id);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Soft delete - deactivate instead of hard delete
            await this.patientRepository.deactivatePatient(id);
            logger_config_1.logger.info('Patient deleted successfully:', id);
        }
        catch (error) {
            logger_config_1.logger.error('Delete patient error:', error);
            throw error;
        }
    }
    async getPatientAppointments(patientId, filters = {}) {
        try {
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            const appointments = await this.appointmentRepository.findByPatientId(patientId, filters);
            return appointments;
        }
        catch (error) {
            logger_config_1.logger.error('Get patient appointments error:', error);
            throw error;
        }
    }
    async getPatientPrescriptions(patientId) {
        try {
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            const prescriptions = await this.prescriptionRepository.findByPatientId(patientId);
            return prescriptions;
        }
        catch (error) {
            logger_config_1.logger.error('Get patient prescriptions error:', error);
            throw error;
        }
    }
    async searchPatients(searchTerm) {
        try {
            return await this.patientRepository.searchPatients(searchTerm);
        }
        catch (error) {
            logger_config_1.logger.error('Search patients error:', error);
            throw error;
        }
    }
    async getPatientStats() {
        try {
            return await this.patientRepository.getPatientStats();
        }
        catch (error) {
            logger_config_1.logger.error('Get patient stats error:', error);
            throw error;
        }
    }
    // Helper methods
    async activatePatient(id) {
        try {
            const patient = await this.patientRepository.activatePatient(id);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            return patient;
        }
        catch (error) {
            logger_config_1.logger.error('Activate patient error:', error);
            throw error;
        }
    }
    async deactivatePatient(id) {
        try {
            const patient = await this.patientRepository.deactivatePatient(id);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            return patient;
        }
        catch (error) {
            logger_config_1.logger.error('Deactivate patient error:', error);
            throw error;
        }
    }
    async getPatientsByAge(minAge, maxAge) {
        try {
            return await this.patientRepository.findByAge(minAge, maxAge);
        }
        catch (error) {
            logger_config_1.logger.error('Get patients by age error:', error);
            throw error;
        }
    }
    async getPatientsByGender(gender) {
        try {
            return await this.patientRepository.findByGender(gender);
        }
        catch (error) {
            logger_config_1.logger.error('Get patients by gender error:', error);
            throw error;
        }
    }
}
exports.PatientService = PatientService;
