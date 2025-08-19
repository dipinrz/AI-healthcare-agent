"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionController = void 0;
const prescription_service_1 = require("../services/prescription.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class PrescriptionController {
    constructor() {
        this.prescriptionService = new prescription_service_1.PrescriptionService();
        this.getAllPrescriptions = async (req, res, next) => {
            try {
                const { status, patientId, doctorId, medicationId, startDate, endDate, page = 1, limit = 10 } = req.query;
                const filters = {
                    status: status,
                    patientId: patientId,
                    doctorId: doctorId,
                    medicationId: medicationId,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                };
                const result = await this.prescriptionService.getAllPrescriptions(filters, parseInt(page), parseInt(limit), (req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.paginated(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Prescriptions retrieved successfully', result.data, result.total, result.page, result.limit);
            }
            catch (error) {
                logger_config_1.logger.error('Get all prescriptions error:', error);
                next(error);
            }
        };
        this.getPrescriptionById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const prescription = await this.prescriptionService.getPrescriptionById(id, (req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTION_RETRIEVED || 'Prescription retrieved successfully', prescription);
            }
            catch (error) {
                logger_config_1.logger.error('Get prescription by ID error:', error);
                next(error);
            }
        };
        this.createPrescription = async (req, res, next) => {
            try {
                const prescriptionData = req.body;
                const prescription = await this.prescriptionService.createPrescription(prescriptionData, (req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTION_CREATED || 'Prescription created successfully', prescription);
            }
            catch (error) {
                logger_config_1.logger.error('Create prescription error:', error);
                next(error);
            }
        };
        this.updatePrescription = async (req, res, next) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const prescription = await this.prescriptionService.updatePrescription(id, updateData, (req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTION_UPDATED || 'Prescription updated successfully', prescription);
            }
            catch (error) {
                logger_config_1.logger.error('Update prescription error:', error);
                next(error);
            }
        };
        this.discontinuePrescription = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { reason } = req.body;
                const prescription = await this.prescriptionService.discontinuePrescription(id, reason, (req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTION_DISCONTINUED || 'Prescription discontinued successfully', prescription);
            }
            catch (error) {
                logger_config_1.logger.error('Discontinue prescription error:', error);
                next(error);
            }
        };
        this.completePrescription = async (req, res, next) => {
            try {
                const { id } = req.params;
                const prescription = await this.prescriptionService.completePrescription(id, (req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTION_COMPLETED || 'Prescription completed successfully', prescription);
            }
            catch (error) {
                logger_config_1.logger.error('Complete prescription error:', error);
                next(error);
            }
        };
        this.getActivePrescriptions = async (req, res, next) => {
            try {
                const { limit = 10 } = req.query;
                const prescriptions = await this.prescriptionService.getActivePrescriptions((req.user).role, (req.user).userId, parseInt(limit));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.ACTIVE_PRESCRIPTIONS_RETRIEVED || 'Active prescriptions retrieved successfully', prescriptions);
            }
            catch (error) {
                logger_config_1.logger.error('Get active prescriptions error:', error);
                next(error);
            }
        };
        this.getPrescriptionStats = async (req, res, next) => {
            try {
                const stats = await this.prescriptionService.getPrescriptionStats((req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.STATS_RETRIEVED || 'Prescription statistics retrieved successfully', stats);
            }
            catch (error) {
                logger_config_1.logger.error('Get prescription stats error:', error);
                next(error);
            }
        };
        this.searchPrescriptions = async (req, res, next) => {
            try {
                const { q } = req.query;
                if (!q) {
                    responseHandler_1.ResponseHandler.badRequest(res, messages_1.MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
                    return;
                }
                const prescriptions = await this.prescriptionService.searchPrescriptions(q, (req.user).role, (req.user).userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully', prescriptions);
            }
            catch (error) {
                logger_config_1.logger.error('Search prescriptions error:', error);
                next(error);
            }
        };
        // Patient-specific endpoints
        this.getPatientPrescriptions = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { status, startDate, endDate } = req.query;
                const prescriptions = await this.prescriptionService.getPatientPrescriptions(patientId, {
                    status: status,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Patient prescriptions retrieved successfully', prescriptions);
            }
            catch (error) {
                logger_config_1.logger.error('Get patient prescriptions error:', error);
                next(error);
            }
        };
        // Doctor-specific endpoints
        this.getDoctorPrescriptions = async (req, res, next) => {
            try {
                const { doctorId } = req.params;
                const { status, startDate, endDate } = req.query;
                const prescriptions = await this.prescriptionService.getDoctorPrescriptions(doctorId, {
                    status: status,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Doctor prescriptions retrieved successfully', prescriptions);
            }
            catch (error) {
                logger_config_1.logger.error('Get doctor prescriptions error:', error);
                next(error);
            }
        };
    }
}
exports.PrescriptionController = PrescriptionController;
