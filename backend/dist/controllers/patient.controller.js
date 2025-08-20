"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientController = void 0;
const patient_service_1 = require("../services/patient.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class PatientController {
    constructor() {
        this.patientService = new patient_service_1.PatientService();
        this.getAllPatients = async (req, res, next) => {
            try {
                const { search, gender, ageMin, ageMax, page = 1, limit = 10 } = req.query;
                const filters = {
                    search: search,
                    gender: gender,
                    ageMin: ageMin ? parseInt(ageMin) : undefined,
                    ageMax: ageMax ? parseInt(ageMax) : undefined,
                };
                const result = await this.patientService.getAllPatients(filters, parseInt(page), parseInt(limit));
                responseHandler_1.ResponseHandler.paginated(res, messages_1.MESSAGES.SUCCESS.PATIENTS_RETRIEVED || 'Patients retrieved successfully', result.data, result.total, result.page, result.limit);
            }
            catch (error) {
                logger_config_1.logger.error('Get all patients error:', error);
                next(error);
            }
        };
        this.getPatientById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const patient = await this.patientService.getPatientById(id);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PATIENT_RETRIEVED || 'Patient retrieved successfully', patient);
            }
            catch (error) {
                logger_config_1.logger.error('Get patient by ID error:', error);
                next(error);
            }
        };
        this.createPatient = async (req, res, next) => {
            try {
                const patientData = req.body;
                const patient = await this.patientService.createPatient(patientData);
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.PATIENT_CREATED, patient);
            }
            catch (error) {
                logger_config_1.logger.error('Create patient error:', error);
                next(error);
            }
        };
        this.updatePatient = async (req, res, next) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const patient = await this.patientService.updatePatient(id, updateData);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PATIENT_UPDATED, patient);
            }
            catch (error) {
                logger_config_1.logger.error('Update patient error:', error);
                next(error);
            }
        };
        this.deletePatient = async (req, res, next) => {
            try {
                const { id } = req.params;
                await this.patientService.deletePatient(id);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PATIENT_DELETED || 'Patient deleted successfully');
            }
            catch (error) {
                logger_config_1.logger.error('Delete patient error:', error);
                next(error);
            }
        };
        this.getPatientAppointments = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { status, startDate, endDate } = req.query;
                const appointments = await this.patientService.getPatientAppointments(id, {
                    status: status,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Appointments retrieved successfully', appointments);
            }
            catch (error) {
                logger_config_1.logger.error('Get patient appointments error:', error);
                next(error);
            }
        };
        this.getPatientPrescriptions = async (req, res, next) => {
            try {
                const { id } = req.params;
                const prescriptions = await this.patientService.getPatientPrescriptions(id);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Prescriptions retrieved successfully', prescriptions);
            }
            catch (error) {
                logger_config_1.logger.error('Get patient prescriptions error:', error);
                next(error);
            }
        };
        this.getPatientStats = async (req, res, next) => {
            try {
                const stats = await this.patientService.getPatientStats();
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.STATS_RETRIEVED || 'Patient statistics retrieved successfully', stats);
            }
            catch (error) {
                logger_config_1.logger.error('Get patient stats error:', error);
                next(error);
            }
        };
        this.searchPatients = async (req, res, next) => {
            try {
                const { q } = req.query;
                if (!q) {
                    responseHandler_1.ResponseHandler.badRequest(res, messages_1.MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
                    return;
                }
                const patients = await this.patientService.searchPatients(q);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully', patients);
            }
            catch (error) {
                logger_config_1.logger.error('Search patients error:', error);
                next(error);
            }
        };
        this.getPatientSummary = async (req, res, next) => {
            try {
                const { id } = req.params;
                const summary = await this.patientService.getPatientSummary(id);
                responseHandler_1.ResponseHandler.success(res, 'Patient summary retrieved successfully', summary);
            }
            catch (error) {
                logger_config_1.logger.error('Get patient summary error:', error);
                next(error);
            }
        };
    }
}
exports.PatientController = PatientController;
