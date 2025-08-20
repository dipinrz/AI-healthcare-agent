"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentService = void 0;
const appointment_repository_1 = require("../repositories/appointment.repository");
const doctorAvailability_repository_1 = require("../repositories/doctorAvailability.repository");
const patient_repository_1 = require("../repositories/patient.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
const Appointment_model_1 = require("../models/Appointment.model");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
const User_model_1 = require("../models/User.model");
class AppointmentService {
    constructor() {
        this.appointmentRepository = new appointment_repository_1.AppointmentRepository();
        this.doctorAvailabilityRepository = new doctorAvailability_repository_1.DoctorAvailabilityRepository();
        this.patientRepository = new patient_repository_1.PatientRepository();
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
    }
    async getAllAppointments(filters, page = 1, limit = 10, userRole, userId) {
        try {
            logger_config_1.logger.info('Getting all appointments with filters:', filters);
            let appointments;
            // Apply role-based filtering
            if (userRole === User_model_1.UserRole.PATIENT) {
                appointments = await this.appointmentRepository.findByPatientId(userId, filters);
            }
            else if (userRole === User_model_1.UserRole.DOCTOR) {
                appointments = await this.appointmentRepository.findByDoctorId(userId, filters);
            }
            else {
                // Admin can see all appointments
                appointments = await this.appointmentRepository.findAll({
                    relations: ['patient', 'doctor'],
                    order: { appointmentDate: 'DESC' },
                });
            }
            // Apply additional filters
            if (filters.doctorId && userRole === User_model_1.UserRole.ADMIN) {
                appointments = appointments.filter(apt => apt.doctor.id === filters.doctorId);
            }
            if (filters.patientId && userRole === User_model_1.UserRole.ADMIN) {
                appointments = appointments.filter(apt => apt.patient.id === filters.patientId);
            }
            if (filters.status) {
                appointments = appointments.filter(apt => apt.status === filters.status);
            }
            if (filters.type) {
                appointments = appointments.filter(apt => apt.type === filters.type);
            }
            const total = appointments.length;
            const paginatedAppointments = appointments.slice((page - 1) * limit, page * limit);
            return {
                data: paginatedAppointments,
                total,
                page,
                limit,
                pages: Math.ceil(total / limit),
            };
        }
        catch (error) {
            logger_config_1.logger.error('Get all appointments error:', error);
            throw error;
        }
    }
    async getAppointmentById(id, userRole, userId) {
        try {
            const appointment = await this.appointmentRepository.findById(id, {
                relations: ['patient', 'doctor'],
            });
            if (!appointment) {
                throw new Error(messages_1.MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
            }
            // Check permissions
            if (userRole === User_model_1.UserRole.PATIENT && appointment.patient.id !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.UNAUTHORIZED);
            }
            if (userRole === User_model_1.UserRole.DOCTOR && appointment.doctor.id !== userId) {
                throw new Error(messages_1.MESSAGES.ERROR.UNAUTHORIZED);
            }
            return appointment;
        }
        catch (error) {
            logger_config_1.logger.error('Get appointment by ID error:', error);
            throw error;
        }
    }
    async createAppointment(appointmentData, user) {
        try {
            const { doctorId, patientId, appointmentDate, reason, type, slotId } = appointmentData;
            // Determine patient ID
            let finalPatientId = patientId;
            if (user.role === User_model_1.UserRole.PATIENT) {
                finalPatientId = user.patientId || user.userId;
            }
            if (!finalPatientId) {
                throw new Error(messages_1.MESSAGES.VALIDATION.PATIENT_ID_REQUIRED);
            }
            // Validate doctor exists
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            // Validate patient exists
            const patient = await this.patientRepository.findById(finalPatientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Check if appointment is in the future
            if (appointmentDate <= new Date()) {
                throw new Error(messages_1.MESSAGES.ERROR.PAST_APPOINTMENT_TIME);
            }
            // Book the slot if slotId is provided
            if (slotId) {
                const slot = await this.doctorAvailabilityRepository.findBySlotId(slotId);
                if (!slot) {
                    throw new Error(messages_1.MESSAGES.ERROR.SLOT_NOT_AVAILABLE);
                }
                if (slot.isBooked) {
                    throw new Error(messages_1.MESSAGES.ERROR.SLOT_ALREADY_BOOKED);
                }
                if (slot.doctor.id !== doctorId) {
                    throw new Error('Slot does not belong to the specified doctor');
                }
                // Book the slot
                await this.doctorAvailabilityRepository.bookSlot(slotId);
            }
            // Create appointment
            const appointment = await this.appointmentRepository.create({
                patient,
                doctor,
                appointmentDate,
                reason,
                type: type,
                status: Appointment_model_1.AppointmentStatus.SCHEDULED,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
            logger_config_1.logger.info('Appointment created successfully:', appointment.id);
            return appointment;
        }
        catch (error) {
            logger_config_1.logger.error('Create appointment error:', error);
            throw error;
        }
    }
    async updateAppointment(id, updateData, userRole, userId) {
        try {
            const appointment = await this.getAppointmentById(id, userRole, userId);
            // Only allow updates to scheduled appointments
            if (appointment.status !== 'scheduled') {
                throw new Error('Only scheduled appointments can be updated');
            }
            const updatedAppointment = await this.appointmentRepository.update(id, {
                ...updateData,
                updatedAt: new Date(),
            });
            if (!updatedAppointment) {
                throw new Error(messages_1.MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
            }
            logger_config_1.logger.info('Appointment updated successfully:', id);
            return updatedAppointment;
        }
        catch (error) {
            logger_config_1.logger.error('Update appointment error:', error);
            throw error;
        }
    }
    async cancelAppointment(id, reason, userRole, userId) {
        try {
            const appointment = await this.getAppointmentById(id, userRole, userId);
            if (appointment.status === 'cancelled') {
                throw new Error(messages_1.MESSAGES.ERROR.APPOINTMENT_ALREADY_CANCELLED);
            }
            if (appointment.status === 'completed') {
                throw new Error(messages_1.MESSAGES.ERROR.CANNOT_CANCEL_COMPLETED);
            }
            // Release the slot if there's a linked availability slot
            // Note: You'd need to track slotId in appointment or find by time/doctor
            const availabilitySlots = await this.doctorAvailabilityRepository.findByDoctorId(appointment.doctor.id, {
                startDate: appointment.appointmentDate,
                endDate: appointment.appointmentDate,
            });
            const matchingSlot = availabilitySlots.find(slot => slot.startTime.getTime() === appointment.appointmentDate.getTime() && slot.isBooked);
            if (matchingSlot) {
                await this.doctorAvailabilityRepository.releaseSlot(matchingSlot.slotId);
            }
            const updatedAppointment = await this.appointmentRepository.update(id, {
                status: Appointment_model_1.AppointmentStatus.CANCELLED,
                notes: reason ? `Cancelled: ${reason}` : 'Appointment cancelled',
                updatedAt: new Date(),
            });
            if (!updatedAppointment) {
                throw new Error(messages_1.MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
            }
            logger_config_1.logger.info('Appointment cancelled successfully:', id);
            return updatedAppointment;
        }
        catch (error) {
            logger_config_1.logger.error('Cancel appointment error:', error);
            throw error;
        }
    }
    async rescheduleAppointment(id, newDate, newSlotId, userRole, userId) {
        try {
            const appointment = await this.getAppointmentById(id, userRole, userId);
            if (appointment.status !== 'scheduled') {
                throw new Error('Only scheduled appointments can be rescheduled');
            }
            if (newDate <= new Date()) {
                throw new Error(messages_1.MESSAGES.ERROR.PAST_APPOINTMENT_TIME);
            }
            // Release old slot
            const oldSlots = await this.doctorAvailabilityRepository.findByDoctorId(appointment.doctor.id, {
                startDate: appointment.appointmentDate,
                endDate: appointment.appointmentDate,
            });
            const oldMatchingSlot = oldSlots.find(slot => slot.startTime.getTime() === appointment.appointmentDate.getTime() && slot.isBooked);
            if (oldMatchingSlot) {
                await this.doctorAvailabilityRepository.releaseSlot(oldMatchingSlot.slotId);
            }
            // Book new slot if provided
            if (newSlotId) {
                const newSlot = await this.doctorAvailabilityRepository.findBySlotId(newSlotId);
                if (!newSlot) {
                    throw new Error(messages_1.MESSAGES.ERROR.SLOT_NOT_AVAILABLE);
                }
                if (newSlot.isBooked) {
                    throw new Error(messages_1.MESSAGES.ERROR.SLOT_ALREADY_BOOKED);
                }
                if (newSlot.doctor.id !== appointment.doctor.id) {
                    throw new Error('Cannot reschedule to a different doctor');
                }
                await this.doctorAvailabilityRepository.bookSlot(newSlotId);
            }
            const updatedAppointment = await this.appointmentRepository.update(id, {
                appointmentDate: newDate,
                updatedAt: new Date(),
            });
            if (!updatedAppointment) {
                throw new Error(messages_1.MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
            }
            logger_config_1.logger.info('Appointment rescheduled successfully:', id);
            return updatedAppointment;
        }
        catch (error) {
            logger_config_1.logger.error('Reschedule appointment error:', error);
            throw error;
        }
    }
    async completeAppointment(id, completionData, userRole, userId) {
        try {
            if (userRole !== User_model_1.UserRole.DOCTOR && userRole !== User_model_1.UserRole.ADMIN) {
                throw new Error(messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
            }
            const appointment = await this.getAppointmentById(id, userRole, userId);
            if (appointment.status === 'completed') {
                throw new Error(messages_1.MESSAGES.ERROR.APPOINTMENT_ALREADY_COMPLETED);
            }
            if (appointment.status === 'cancelled') {
                throw new Error(messages_1.MESSAGES.ERROR.CANNOT_COMPLETE_CANCELLED);
            }
            const updatedAppointment = await this.appointmentRepository.update(id, {
                status: Appointment_model_1.AppointmentStatus.COMPLETED,
                diagnosis: completionData.diagnosis,
                notes: completionData.notes,
                updatedAt: new Date(),
            });
            if (!updatedAppointment) {
                throw new Error(messages_1.MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
            }
            logger_config_1.logger.info('Appointment completed successfully:', id);
            return updatedAppointment;
        }
        catch (error) {
            logger_config_1.logger.error('Complete appointment error:', error);
            throw error;
        }
    }
    async getUpcomingAppointments(userRole, userId, limit = 10) {
        try {
            return await this.appointmentRepository.findUpcoming(userId, userRole.toLowerCase(), limit);
        }
        catch (error) {
            logger_config_1.logger.error('Get upcoming appointments error:', error);
            throw error;
        }
    }
    async getPastAppointments(userRole, userId, limit = 10) {
        try {
            return await this.appointmentRepository.findPast(userId, userRole.toLowerCase(), limit);
        }
        catch (error) {
            logger_config_1.logger.error('Get past appointments error:', error);
            throw error;
        }
    }
    async searchAppointments(searchTerm, userRole, userId) {
        try {
            return await this.appointmentRepository.searchAppointments(searchTerm, userId, userRole.toLowerCase());
        }
        catch (error) {
            logger_config_1.logger.error('Search appointments error:', error);
            throw error;
        }
    }
    async getAppointmentStats(userRole, userId) {
        try {
            return await this.appointmentRepository.getAppointmentStats(userId, userRole.toLowerCase());
        }
        catch (error) {
            logger_config_1.logger.error('Get appointment stats error:', error);
            throw error;
        }
    }
    async getPatientAppointments(patientId, filters = {}) {
        try {
            return await this.appointmentRepository.findByPatientId(patientId, filters);
        }
        catch (error) {
            logger_config_1.logger.error('Get patient appointments error:', error);
            throw error;
        }
    }
    async getDoctorAppointments(doctorId, filters = {}) {
        try {
            return await this.appointmentRepository.findByDoctorId(doctorId, filters);
        }
        catch (error) {
            logger_config_1.logger.error('Get doctor appointments error:', error);
            throw error;
        }
    }
    async bookSlotAppointment(data) {
        try {
            const { patientId, slotId, reason, symptoms, type } = data;
            // Verify patient exists
            const patient = await this.patientRepository.findById(patientId);
            if (!patient) {
                throw new Error(messages_1.MESSAGES.ERROR.PATIENT_NOT_FOUND);
            }
            // Get the slot details
            const slot = await this.doctorAvailabilityRepository.findBySlotId(slotId);
            if (!slot) {
                throw new Error('Time slot not found');
            }
            if (slot.isBooked) {
                throw new Error('This time slot is already booked');
            }
            // Verify doctor exists
            if (!slot.doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            // Create the appointment
            const appointmentData = {
                patientId,
                doctorId: slot.doctor.id,
                appointmentDate: slot.startTime,
                duration: 30, // Default 30 minutes
                status: Appointment_model_1.AppointmentStatus.SCHEDULED,
                type: type || Appointment_model_1.AppointmentType.CONSULTATION,
                reason,
                symptoms: symptoms || '',
            };
            const appointment = await this.appointmentRepository.create(appointmentData);
            // Mark the slot as booked
            await this.doctorAvailabilityRepository.bookSlot(slotId);
            logger_config_1.logger.info(`Appointment booked successfully: ${appointment.id} for slot ${slotId}`);
            // Return appointment with basic data
            return await this.appointmentRepository.findById(appointment.id);
        }
        catch (error) {
            logger_config_1.logger.error('Book slot appointment error:', error);
            throw error;
        }
    }
    async getAvailableSlots(doctorId, date) {
        try {
            // Verify doctor exists
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            // Parse the date
            const targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) {
                throw new Error('Invalid date format');
            }
            // Get available slots for the doctor on the specific date
            // Create start and end of the target date
            const startOfDay = new Date(targetDate);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(targetDate);
            endOfDay.setHours(23, 59, 59, 999);
            const slots = await this.doctorAvailabilityRepository.findAvailableSlots(startOfDay.toISOString(), endOfDay.toISOString(), doctorId);
            // Filter out booked slots and return in the expected format
            const availableSlots = slots
                .filter(slot => !slot.isBooked)
                .map(slot => ({
                slotId: slot.slotId,
                startTime: slot.startTime,
                endTime: slot.endTime,
                is_booked: slot.isBooked,
                doctor: {
                    id: slot.doctor?.id,
                    firstName: slot.doctor?.firstName,
                    lastName: slot.doctor?.lastName,
                    specialization: slot.doctor?.specialization
                }
            }));
            logger_config_1.logger.info(`Retrieved ${availableSlots.length} available slots for doctor ${doctorId} on ${date}`);
            return availableSlots;
        }
        catch (error) {
            logger_config_1.logger.error('Get available slots error:', error);
            throw error;
        }
    }
}
exports.AppointmentService = AppointmentService;
