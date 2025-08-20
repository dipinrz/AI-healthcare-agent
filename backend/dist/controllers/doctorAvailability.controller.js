"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorAvailabilityController = void 0;
const doctorAvailability_service_1 = require("../services/doctorAvailability.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class DoctorAvailabilityController {
    constructor() {
        this.doctorAvailabilityService = new doctorAvailability_service_1.DoctorAvailabilityService();
        // Get available slots for a doctor
        this.getDoctorSlots = async (req, res, next) => {
            try {
                const { doctorId } = req.params;
                const { date, month } = req.query;
                const slots = await this.doctorAvailabilityService.getDoctorSlots(doctorId, {
                    date: date,
                    month: month,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOTS_RETRIEVED || 'Doctor slots retrieved successfully', slots);
            }
            catch (error) {
                logger_config_1.logger.error('Get doctor slots error:', error);
                next(error);
            }
        };
        // Get available doctors for specific time slot
        this.getAvailableDoctors = async (req, res, next) => {
            try {
                const { startTime, endTime } = req.query;
                if (!startTime || !endTime) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'startTime and endTime are required');
                    return;
                }
                const doctors = await this.doctorAvailabilityService.getAvailableDoctors(startTime, endTime);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.AVAILABLE_DOCTORS_RETRIEVED || 'Available doctors retrieved successfully', doctors);
            }
            catch (error) {
                logger_config_1.logger.error('Get available doctors error:', error);
                next(error);
            }
        };
        // Book a specific slot
        this.bookSlot = async (req, res, next) => {
            try {
                const { slotId } = req.params;
                const slot = await this.doctorAvailabilityService.bookSlot(parseInt(slotId));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOT_BOOKED, slot);
            }
            catch (error) {
                logger_config_1.logger.error('Book slot error:', error);
                next(error);
            }
        };
        // Release a booked slot
        this.releaseSlot = async (req, res, next) => {
            try {
                const { slotId } = req.params;
                const slot = await this.doctorAvailabilityService.releaseSlot(parseInt(slotId));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOT_RELEASED, slot);
            }
            catch (error) {
                logger_config_1.logger.error('Release slot error:', error);
                next(error);
            }
        };
        // Generate availability slots for all doctors
        this.generateSlotsForAllDoctors = async (req, res, next) => {
            try {
                const { days = 30 } = req.body;
                const result = await this.doctorAvailabilityService.generateSlotsForAllDoctors(parseInt(days));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOTS_GENERATED, result);
            }
            catch (error) {
                logger_config_1.logger.error('Generate slots for all doctors error:', error);
                next(error);
            }
        };
        // Generate availability slots for specific doctor
        this.generateSlotsForDoctor = async (req, res, next) => {
            try {
                const { doctorId } = req.params;
                const { days = 30 } = req.body;
                const result = await this.doctorAvailabilityService.generateSlotsForDoctor(doctorId, parseInt(days));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOTS_GENERATED, result);
            }
            catch (error) {
                logger_config_1.logger.error('Generate slots for doctor error:', error);
                next(error);
            }
        };
        // Get slot by ID
        this.getSlotById = async (req, res, next) => {
            try {
                const { slotId } = req.params;
                const slot = await this.doctorAvailabilityService.getSlotById(parseInt(slotId));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOT_RETRIEVED || 'Slot retrieved successfully', slot);
            }
            catch (error) {
                logger_config_1.logger.error('Get slot by ID error:', error);
                next(error);
            }
        };
        // Update slot availability
        this.updateSlotAvailability = async (req, res, next) => {
            try {
                const { slotId } = req.params;
                const { isBooked } = req.body;
                const slot = await this.doctorAvailabilityService.updateSlotAvailability(parseInt(slotId), isBooked);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOT_UPDATED || 'Slot updated successfully', slot);
            }
            catch (error) {
                logger_config_1.logger.error('Update slot availability error:', error);
                next(error);
            }
        };
        // Get availability statistics
        this.getAvailabilityStats = async (req, res, next) => {
            try {
                const { doctorId } = req.query;
                const stats = await this.doctorAvailabilityService.getAvailabilityStats(doctorId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.STATS_RETRIEVED || 'Availability statistics retrieved successfully', stats);
            }
            catch (error) {
                logger_config_1.logger.error('Get availability stats error:', error);
                next(error);
            }
        };
        // Clear old slots
        this.clearOldSlots = async (req, res, next) => {
            try {
                const { beforeDate } = req.body;
                if (!beforeDate) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'beforeDate is required');
                    return;
                }
                const result = await this.doctorAvailabilityService.clearOldSlots(new Date(beforeDate));
                responseHandler_1.ResponseHandler.success(res, `Successfully cleared ${result.deletedCount} old slots`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Clear old slots error:', error);
                next(error);
            }
        };
    }
}
exports.DoctorAvailabilityController = DoctorAvailabilityController;
