"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationController = void 0;
const medication_service_1 = require("../services/medication.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class MedicationController {
    constructor() {
        this.medicationService = new medication_service_1.MedicationService();
        this.getAllMedications = async (req, res, next) => {
            try {
                const { search, category, page = 1, limit = 10 } = req.query;
                const filters = {
                    search: search,
                    category: category,
                };
                const result = await this.medicationService.getAllMedications(filters, parseInt(page), parseInt(limit));
                responseHandler_1.ResponseHandler.paginated(res, messages_1.MESSAGES.SUCCESS.MEDICATIONS_RETRIEVED || 'Medications retrieved successfully', result.data, result.total, result.page, result.limit);
            }
            catch (error) {
                logger_config_1.logger.error('Get all medications error:', error);
                next(error);
            }
        };
        this.getMedicationById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const medication = await this.medicationService.getMedicationById(id);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.MEDICATION_RETRIEVED || 'Medication retrieved successfully', medication);
            }
            catch (error) {
                logger_config_1.logger.error('Get medication by ID error:', error);
                next(error);
            }
        };
        this.createMedication = async (req, res, next) => {
            try {
                const medicationData = req.body;
                const medication = await this.medicationService.createMedication(medicationData);
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.MEDICATION_CREATED, medication);
            }
            catch (error) {
                logger_config_1.logger.error('Create medication error:', error);
                next(error);
            }
        };
        this.updateMedication = async (req, res, next) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const medication = await this.medicationService.updateMedication(id, updateData);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.MEDICATION_UPDATED, medication);
            }
            catch (error) {
                logger_config_1.logger.error('Update medication error:', error);
                next(error);
            }
        };
        this.deleteMedication = async (req, res, next) => {
            try {
                const { id } = req.params;
                await this.medicationService.deleteMedication(id);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.MEDICATION_DELETED || 'Medication deleted successfully');
            }
            catch (error) {
                logger_config_1.logger.error('Delete medication error:', error);
                next(error);
            }
        };
        this.searchMedications = async (req, res, next) => {
            try {
                const { q } = req.query;
                if (!q) {
                    responseHandler_1.ResponseHandler.badRequest(res, messages_1.MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
                    return;
                }
                const medications = await this.medicationService.searchMedications(q);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully', medications);
            }
            catch (error) {
                logger_config_1.logger.error('Search medications error:', error);
                next(error);
            }
        };
        this.getMedicationCategories = async (req, res, next) => {
            try {
                const categories = await this.medicationService.getCategories();
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.CATEGORIES_RETRIEVED || 'Categories retrieved successfully', categories);
            }
            catch (error) {
                logger_config_1.logger.error('Get medication categories error:', error);
                next(error);
            }
        };
    }
}
exports.MedicationController = MedicationController;
