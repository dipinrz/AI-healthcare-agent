"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentController = void 0;
const appointment_service_1 = require("../services/appointment.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class AppointmentController {
    constructor() {
        this.appointmentService = new appointment_service_1.AppointmentService();
        this.getAllAppointments = async (req, res, next) => {
            try {
                const { status, doctorId, patientId, startDate, endDate, type, page = 1, limit = 10 } = req.query;
                const filters = {
                    status: status,
                    doctorId: doctorId,
                    patientId: patientId,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                    type: type,
                };
                const result = await this.appointmentService.getAllAppointments(filters, parseInt(page), parseInt(limit), (req.user));
                responseHandler_1.ResponseHandler.paginated(res, messages_1.MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Appointments retrieved successfully', result.data, result.total, result.page, result.limit);
            }
            catch (error) {
                logger_config_1.logger.error('Get all appointments error:', error);
                next(error);
            }
        };
        this.getAppointmentById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const appointment = await this.appointmentService.getAppointmentById(id, (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_RETRIEVED || 'Appointment retrieved successfully', appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Get appointment by ID error:', error);
                next(error);
            }
        };
        this.createAppointment = async (req, res, next) => {
            try {
                const appointmentData = req.body;
                const appointment = await this.appointmentService.createAppointment(appointmentData, (req.user));
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_CREATED, appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Create appointment error:', error);
                next(error);
            }
        };
        this.updateAppointment = async (req, res, next) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const appointment = await this.appointmentService.updateAppointment(id, updateData, (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_UPDATED, appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Update appointment error:', error);
                next(error);
            }
        };
        this.cancelAppointment = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { reason } = req.body;
                const appointment = await this.appointmentService.cancelAppointment(id, reason, (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_CANCELLED, appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Cancel appointment error:', error);
                next(error);
            }
        };
        this.rescheduleAppointment = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { slotId } = req.body;
                if (!slotId) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Slot ID is required for rescheduling');
                    return;
                }
                const appointment = await this.appointmentService.rescheduleAppointment(id, parseInt(slotId), (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_RESCHEDULED, appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Reschedule appointment error:', error);
                next(error);
            }
        };
        this.completeAppointment = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { diagnosis, notes, prescriptions } = req.body;
                const appointment = await this.appointmentService.completeAppointment(id, {
                    diagnosis,
                    notes,
                    prescriptions,
                }, (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_COMPLETED, appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Complete appointment error:', error);
                next(error);
            }
        };
        this.getUpcomingAppointments = async (req, res, next) => {
            try {
                const { limit = 10 } = req.query;
                const appointments = await this.appointmentService.getUpcomingAppointments((req.user), parseInt(limit));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.UPCOMING_APPOINTMENTS_RETRIEVED || 'Upcoming appointments retrieved successfully', appointments);
            }
            catch (error) {
                logger_config_1.logger.error('Get upcoming appointments error:', error);
                next(error);
            }
        };
        this.getPastAppointments = async (req, res, next) => {
            try {
                const { limit = 10 } = req.query;
                const appointments = await this.appointmentService.getPastAppointments((req.user), parseInt(limit));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PAST_APPOINTMENTS_RETRIEVED || 'Past appointments retrieved successfully', appointments);
            }
            catch (error) {
                logger_config_1.logger.error('Get past appointments error:', error);
                next(error);
            }
        };
        this.getAppointmentStats = async (req, res, next) => {
            try {
                const stats = await this.appointmentService.getAppointmentStats((req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.STATS_RETRIEVED || 'Appointment statistics retrieved successfully', stats);
            }
            catch (error) {
                logger_config_1.logger.error('Get appointment stats error:', error);
                next(error);
            }
        };
        this.searchAppointments = async (req, res, next) => {
            try {
                const { q } = req.query;
                if (!q) {
                    responseHandler_1.ResponseHandler.badRequest(res, messages_1.MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
                    return;
                }
                const appointments = await this.appointmentService.searchAppointments(q, (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully', appointments);
            }
            catch (error) {
                logger_config_1.logger.error('Search appointments error:', error);
                next(error);
            }
        };
        // Patient-specific endpoints
        this.getPatientAppointments = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { status, startDate, endDate } = req.query;
                const appointments = await this.appointmentService.getPatientAppointments(patientId, {
                    status: status,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Patient appointments retrieved successfully', appointments);
            }
            catch (error) {
                logger_config_1.logger.error('Get patient appointments error:', error);
                next(error);
            }
        };
        // Doctor-specific endpoints
        this.getDoctorAppointments = async (req, res, next) => {
            try {
                const { doctorId } = req.params;
                const { status, startDate, endDate } = req.query;
                const appointments = await this.appointmentService.getDoctorAppointments(doctorId, {
                    status: status,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Doctor appointments retrieved successfully', appointments);
            }
            catch (error) {
                logger_config_1.logger.error('Get doctor appointments error:', error);
                next(error);
            }
        };
        this.cancelPatientAppointment = async (req, res, next) => {
            try {
                const { patientId, appointmentId } = req.params;
                const { reason } = req.body;
                const appointment = await this.appointmentService.cancelAppointment(appointmentId, reason, (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_CANCELLED || 'Appointment cancelled successfully', appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Cancel patient appointment error:', error);
                next(error);
            }
        };
        this.reschedulePatientAppointment = async (req, res, next) => {
            try {
                const { patientId, appointmentId } = req.params;
                const { newSlotId } = req.body;
                if (!newSlotId) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'New slot ID is required');
                    return;
                }
                const appointment = await this.appointmentService.rescheduleAppointment(appointmentId, parseInt(newSlotId), (req.user));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENT_RESCHEDULED || 'Appointment rescheduled successfully', appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Reschedule patient appointment error:', error);
                next(error);
            }
        };
        this.bookSlotAppointment = async (req, res, next) => {
            try {
                const { patientId, slotId, reason, symptoms, type } = req.body;
                const appointment = await this.appointmentService.bookSlotAppointment({
                    patientId,
                    slotId: parseInt(slotId),
                    reason,
                    symptoms: symptoms || '',
                    type: type || 'consultation'
                });
                responseHandler_1.ResponseHandler.created(res, 'Appointment booked successfully using slot', appointment);
            }
            catch (error) {
                logger_config_1.logger.error('Book slot appointment error:', error);
                next(error);
            }
        };
        this.getAvailableSlots = async (req, res, next) => {
            try {
                const { doctorId } = req.params;
                const { date } = req.query;
                if (!date) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Date parameter is required');
                    return;
                }
                const slots = await this.appointmentService.getAvailableSlots(doctorId, date);
                responseHandler_1.ResponseHandler.success(res, 'Available slots retrieved successfully', slots);
            }
            catch (error) {
                logger_config_1.logger.error('Get available slots error:', error);
                next(error);
            }
        };
    }
}
exports.AppointmentController = AppointmentController;
