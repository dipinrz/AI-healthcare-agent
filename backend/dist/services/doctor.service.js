"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorService = void 0;
const doctor_repository_1 = require("../repositories/doctor.repository");
const appointment_repository_1 = require("../repositories/appointment.repository");
const doctorAvailability_repository_1 = require("../repositories/doctorAvailability.repository");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
class DoctorService {
    constructor() {
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
        this.appointmentRepository = new appointment_repository_1.AppointmentRepository();
        this.availabilityRepository = new doctorAvailability_repository_1.DoctorAvailabilityRepository();
    }
    async getAllDoctors(filters, page = 1, limit = 10) {
        try {
            logger_config_1.logger.info('Getting all doctors with filters:', filters);
            let doctors;
            // Apply search filter first
            if (filters.search) {
                doctors = await this.doctorRepository.searchDoctors(filters.search);
            }
            else {
                doctors = await this.doctorRepository.findAvailableDoctors();
            }
            // Apply other filters
            if (filters.specialization) {
                doctors = doctors.filter(doc => doc.specialization.toLowerCase().includes(filters.specialization.toLowerCase()));
            }
            if (filters.department) {
                doctors = doctors.filter(doc => doc.department.toLowerCase().includes(filters.department.toLowerCase()));
            }
            if (filters.minRating !== undefined) {
                doctors = doctors.filter(doc => doc.rating >= filters.minRating);
            }
            if (filters.minExperience !== undefined) {
                doctors = doctors.filter(doc => doc.experience >= filters.minExperience);
            }
            if (filters.isAvailable !== undefined) {
                doctors = doctors.filter(doc => doc.isAvailable === filters.isAvailable);
            }
            const total = doctors.length;
            const paginatedDoctors = doctors.slice((page - 1) * limit, page * limit);
            return {
                data: paginatedDoctors,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            logger_config_1.logger.error('Get all doctors error:', error);
            throw error;
        }
    }
    async getDoctorById(id) {
        try {
            const doctor = await this.doctorRepository.findById(id);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            return doctor;
        }
        catch (error) {
            logger_config_1.logger.error('Get doctor by ID error:', error);
            throw error;
        }
    }
    async createDoctor(doctorData) {
        try {
            // Check if doctor with email already exists
            if (doctorData.email) {
                const existingDoctor = await this.doctorRepository.findByEmail(doctorData.email);
                if (existingDoctor) {
                    throw new Error(messages_1.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
                }
            }
            const doctor = await this.doctorRepository.create({
                ...doctorData,
                isAvailable: true,
                rating: doctorData.rating || 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            logger_config_1.logger.info('Doctor created successfully:', doctor.id);
            return doctor;
        }
        catch (error) {
            logger_config_1.logger.error('Create doctor error:', error);
            throw error;
        }
    }
    async updateDoctor(id, updateData) {
        try {
            const existingDoctor = await this.doctorRepository.findById(id);
            if (!existingDoctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            // Check email uniqueness if email is being updated
            if (updateData.email && updateData.email !== existingDoctor.email) {
                const doctorWithEmail = await this.doctorRepository.findByEmail(updateData.email);
                if (doctorWithEmail && doctorWithEmail.id !== id) {
                    throw new Error(messages_1.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
                }
            }
            const updatedDoctor = await this.doctorRepository.update(id, {
                ...updateData,
                updatedAt: new Date(),
            });
            if (!updatedDoctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            logger_config_1.logger.info('Doctor updated successfully:', id);
            return updatedDoctor;
        }
        catch (error) {
            logger_config_1.logger.error('Update doctor error:', error);
            throw error;
        }
    }
    async deleteDoctor(id) {
        try {
            const doctor = await this.doctorRepository.findById(id);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            // Check if doctor has pending appointments
            const pendingAppointments = await this.appointmentRepository.findByDoctorId(id, {
                status: 'scheduled',
            });
            if (pendingAppointments.length > 0) {
                throw new Error('Cannot delete doctor with pending appointments');
            }
            // Set as unavailable instead of hard delete
            await this.doctorRepository.updateAvailability(id, false);
            logger_config_1.logger.info('Doctor deleted successfully:', id);
        }
        catch (error) {
            logger_config_1.logger.error('Delete doctor error:', error);
            throw error;
        }
    }
    async getDoctorAppointments(doctorId, filters = {}) {
        try {
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            const appointments = await this.appointmentRepository.findByDoctorId(doctorId, filters);
            return appointments;
        }
        catch (error) {
            logger_config_1.logger.error('Get doctor appointments error:', error);
            throw error;
        }
    }
    async getDoctorAvailability(doctorId, filters = {}) {
        try {
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            const availability = await this.availabilityRepository.findByDoctorId(doctorId, filters);
            return availability;
        }
        catch (error) {
            logger_config_1.logger.error('Get doctor availability error:', error);
            throw error;
        }
    }
    async updateAvailability(id, isAvailable) {
        try {
            const doctor = await this.doctorRepository.updateAvailability(id, isAvailable);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            logger_config_1.logger.info(`Doctor availability updated: ${id} - ${isAvailable ? 'available' : 'unavailable'}`);
            return doctor;
        }
        catch (error) {
            logger_config_1.logger.error('Update doctor availability error:', error);
            throw error;
        }
    }
    async searchDoctors(searchTerm) {
        try {
            return await this.doctorRepository.searchDoctors(searchTerm);
        }
        catch (error) {
            logger_config_1.logger.error('Search doctors error:', error);
            throw error;
        }
    }
    async getDoctorStats() {
        try {
            return await this.doctorRepository.getDoctorStats();
        }
        catch (error) {
            logger_config_1.logger.error('Get doctor stats error:', error);
            throw error;
        }
    }
    async getSpecializations() {
        try {
            return await this.doctorRepository.getSpecializationList();
        }
        catch (error) {
            logger_config_1.logger.error('Get specializations error:', error);
            throw error;
        }
    }
    async getDepartments() {
        try {
            return await this.doctorRepository.getDepartmentList();
        }
        catch (error) {
            logger_config_1.logger.error('Get departments error:', error);
            throw error;
        }
    }
    async getDoctorsBySpecialization(specialization) {
        try {
            return await this.doctorRepository.findBySpecialization(specialization);
        }
        catch (error) {
            logger_config_1.logger.error('Get doctors by specialization error:', error);
            throw error;
        }
    }
    async getDoctorsByDepartment(department) {
        try {
            return await this.doctorRepository.findByDepartment(department);
        }
        catch (error) {
            logger_config_1.logger.error('Get doctors by department error:', error);
            throw error;
        }
    }
    async getTopRatedDoctors(limit = 10) {
        try {
            return await this.doctorRepository.findTopRatedDoctors(limit);
        }
        catch (error) {
            logger_config_1.logger.error('Get top rated doctors error:', error);
            throw error;
        }
    }
    async updateDoctorRating(id, rating) {
        try {
            if (rating < 0 || rating > 5) {
                throw new Error('Rating must be between 0 and 5');
            }
            const doctor = await this.doctorRepository.updateRating(id, rating);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            logger_config_1.logger.info(`Doctor rating updated: ${id} - ${rating}`);
            return doctor;
        }
        catch (error) {
            logger_config_1.logger.error('Update doctor rating error:', error);
            throw error;
        }
    }
    async getDoctorsWithMinRating(minRating) {
        try {
            return await this.doctorRepository.findDoctorsWithMinRating(minRating);
        }
        catch (error) {
            logger_config_1.logger.error('Get doctors with min rating error:', error);
            throw error;
        }
    }
    async getDoctorsByExperience(minExperience, maxExperience) {
        try {
            return await this.doctorRepository.findByExperienceRange(minExperience, maxExperience);
        }
        catch (error) {
            logger_config_1.logger.error('Get doctors by experience error:', error);
            throw error;
        }
    }
    async fuzzySearchByDepartment(searchTerm) {
        try {
            if (!searchTerm || searchTerm.trim().length === 0) {
                throw new Error('Search term is required');
            }
            const doctors = await this.doctorRepository.fuzzySearchByDepartment(searchTerm.trim());
            logger_config_1.logger.info(`Fuzzy search by department for "${searchTerm}" returned ${doctors.length} results`);
            return doctors;
        }
        catch (error) {
            logger_config_1.logger.error('Fuzzy search by department error:', error);
            throw error;
        }
    }
}
exports.DoctorService = DoctorService;
