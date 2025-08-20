"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedController = void 0;
const seed_service_1 = require("../services/seed.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class SeedController {
    constructor() {
        this.seedService = new seed_service_1.SeedService();
        // Master seed - creates all demo data
        this.seedAll = async (req, res, next) => {
            try {
                logger_config_1.logger.info('Starting master seed operation...');
                const result = await this.seedService.seedAllData();
                responseHandler_1.ResponseHandler.success(res, 'Master seed completed successfully', result);
            }
            catch (error) {
                logger_config_1.logger.error('Master seed error:', error);
                next(error);
            }
        };
        // Seed doctors
        this.seedDoctors = async (req, res, next) => {
            try {
                const { count = 10 } = req.body;
                logger_config_1.logger.info(`Seeding ${count} doctors...`);
                const result = await this.seedService.seedDoctors(parseInt(count));
                responseHandler_1.ResponseHandler.success(res, `Successfully created ${result.created} doctors`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed doctors error:', error);
                next(error);
            }
        };
        // Seed patients
        this.seedPatients = async (req, res, next) => {
            try {
                const { count = 20 } = req.body;
                logger_config_1.logger.info(`Seeding ${count} patients...`);
                const result = await this.seedService.seedPatients(parseInt(count));
                responseHandler_1.ResponseHandler.success(res, `Successfully created ${result.created} patients`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed patients error:', error);
                next(error);
            }
        };
        // Seed medications
        this.seedMedications = async (req, res, next) => {
            try {
                logger_config_1.logger.info('Seeding medications...');
                const result = await this.seedService.seedMedications();
                responseHandler_1.ResponseHandler.success(res, `Successfully created ${result.created} medications`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed medications error:', error);
                next(error);
            }
        };
        // Seed appointments
        this.seedAppointments = async (req, res, next) => {
            try {
                const { count = 50 } = req.body;
                logger_config_1.logger.info(`Seeding ${count} appointments...`);
                const result = await this.seedService.seedAppointments(parseInt(count));
                responseHandler_1.ResponseHandler.success(res, `Successfully created ${result.created} appointments`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed appointments error:', error);
                next(error);
            }
        };
        // Seed prescriptions
        this.seedPrescriptions = async (req, res, next) => {
            try {
                const { count = 30 } = req.body;
                logger_config_1.logger.info(`Seeding ${count} prescriptions...`);
                const result = await this.seedService.seedPrescriptions(parseInt(count));
                responseHandler_1.ResponseHandler.success(res, `Successfully created ${result.created} prescriptions`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed prescriptions error:', error);
                next(error);
            }
        };
        // Seed health records
        this.seedHealthRecords = async (req, res, next) => {
            try {
                const { count = 40 } = req.body;
                logger_config_1.logger.info(`Seeding ${count} health records...`);
                const result = await this.seedService.seedHealthRecords(parseInt(count));
                responseHandler_1.ResponseHandler.success(res, `Successfully created health records for ${result.created} patients`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed health records error:', error);
                next(error);
            }
        };
        // Seed doctor availability slots
        this.seedDoctorAvailability = async (req, res, next) => {
            try {
                const { doctorId, days = 30 } = req.body;
                logger_config_1.logger.info(`Seeding doctor availability slots for ${days} days...`);
                const result = await this.seedService.seedDoctorAvailability(doctorId, parseInt(days));
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SLOTS_GENERATED, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed doctor availability error:', error);
                next(error);
            }
        };
        // Clear all data (dangerous operation)
        this.clearAllData = async (req, res, next) => {
            try {
                const { confirm } = req.body;
                if (confirm !== 'DELETE_ALL_DATA') {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Please provide confirmation: { "confirm": "DELETE_ALL_DATA" }');
                    return;
                }
                logger_config_1.logger.warn('CLEARING ALL DATA - This operation cannot be undone!');
                const result = await this.seedService.clearAllData();
                responseHandler_1.ResponseHandler.success(res, 'All data has been cleared successfully', result);
            }
            catch (error) {
                logger_config_1.logger.error('Clear all data error:', error);
                next(error);
            }
        };
        // Get seeding status
        this.getSeedStatus = async (req, res, next) => {
            try {
                const status = await this.seedService.getSeedStatus();
                responseHandler_1.ResponseHandler.success(res, 'Seed status retrieved successfully', status);
            }
            catch (error) {
                logger_config_1.logger.error('Get seed status error:', error);
                next(error);
            }
        };
        // Seed specific demo scenario
        this.seedDemoScenario = async (req, res, next) => {
            try {
                const { scenario = 'basic' } = req.body;
                logger_config_1.logger.info(`Seeding demo scenario: ${scenario}`);
                const result = await this.seedService.seedDemoScenario(scenario);
                responseHandler_1.ResponseHandler.success(res, `Demo scenario '${scenario}' created successfully`, result);
            }
            catch (error) {
                logger_config_1.logger.error('Seed demo scenario error:', error);
                next(error);
            }
        };
        // Reset specific entity
        this.resetEntity = async (req, res, next) => {
            try {
                const { entity } = req.params;
                const { confirm } = req.body;
                if (confirm !== `RESET_${entity.toUpperCase()}`) {
                    responseHandler_1.ResponseHandler.badRequest(res, `Please provide confirmation: { "confirm": "RESET_${entity.toUpperCase()}" }`);
                    return;
                }
                logger_config_1.logger.warn(`Resetting ${entity} data...`);
                const result = await this.seedService.resetEntity(entity);
                responseHandler_1.ResponseHandler.success(res, `${entity} data has been reset successfully`, result);
            }
            catch (error) {
                logger_config_1.logger.error(`Reset ${req.params.entity} error:`, error);
                next(error);
            }
        };
    }
}
exports.SeedController = SeedController;
