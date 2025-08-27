"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthRecordsController = void 0;
const healthRecords_service_1 = require("../services/healthRecords.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
const MedicalDocument_model_1 = require("../models/MedicalDocument.model");
const fs = __importStar(require("fs"));
class HealthRecordsController {
    constructor() {
        this.healthRecordsService = new healthRecords_service_1.HealthRecordsService();
        // Get complete health record
        this.getHealthRecord = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const healthRecord = await this.healthRecordsService.getHealthRecord(patientId, role, userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.HEALTH_RECORD_RETRIEVED || 'Health record retrieved successfully', healthRecord);
            }
            catch (error) {
                logger_config_1.logger.error('Get health record error:', error);
                next(error);
            }
        };
        // Medical Documents
        this.uploadDocument = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const file = req.file;
                if (!file) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'No file uploaded');
                    return;
                }
                const { name, type, description, notes } = req.body;
                // Validate document type
                if (type && !Object.values(MedicalDocument_model_1.DocumentType).includes(type)) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Invalid document type');
                    return;
                }
                // Create file path
                const fileName = `${Date.now()}-${file.originalname}`;
                const filePath = this.healthRecordsService.createUploadPath(patientId, fileName);
                // Move file to permanent location
                fs.renameSync(file.path, filePath);
                const documentData = {
                    name: name || file.originalname,
                    type: type || MedicalDocument_model_1.DocumentType.OTHER,
                    description,
                    notes,
                    documentDate: new Date(),
                    file: {
                        fileName,
                        filePath,
                        fileType: file.mimetype,
                        fileSize: file.size
                    }
                };
                const document = await this.healthRecordsService.addMedicalDocument(patientId, documentData, role, userId);
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.DOCUMENT_UPLOADED || 'Document uploaded successfully', document);
            }
            catch (error) {
                logger_config_1.logger.error('Upload document error:', error);
                next(error);
            }
        };
        this.getMedicalDocuments = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const documents = await this.healthRecordsService.getMedicalDocuments(patientId, role, userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.DOCUMENTS_RETRIEVED || 'Documents retrieved successfully', documents);
            }
            catch (error) {
                logger_config_1.logger.error('Get medical documents error:', error);
                next(error);
            }
        };
        this.downloadDocument = async (req, res, next) => {
            try {
                const { patientId, documentId } = req.params;
                const { role, userId } = req.user;
                // Check access permissions
                await this.healthRecordsService.getMedicalDocuments(patientId, role, userId);
                // Find the document (this could be optimized with a direct query)
                const documents = await this.healthRecordsService.getMedicalDocuments(patientId, role, userId);
                const document = documents.find(doc => doc.id === documentId);
                if (!document || !document.filePath) {
                    responseHandler_1.ResponseHandler.notFound(res, 'Document not found');
                    return;
                }
                if (!fs.existsSync(document.filePath)) {
                    responseHandler_1.ResponseHandler.notFound(res, 'File not found on server');
                    return;
                }
                // Set appropriate headers
                res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
                res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
                // Stream the file
                const fileStream = fs.createReadStream(document.filePath);
                fileStream.pipe(res);
            }
            catch (error) {
                logger_config_1.logger.error('Download document error:', error);
                next(error);
            }
        };
        this.deleteDocument = async (req, res, next) => {
            try {
                const { patientId, documentId } = req.params;
                const { role, userId } = req.user;
                const deleted = await this.healthRecordsService.deleteMedicalDocument(patientId, documentId, role, userId);
                if (deleted) {
                    responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.DOCUMENT_DELETED || 'Document deleted successfully');
                }
                else {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Failed to delete document');
                }
            }
            catch (error) {
                logger_config_1.logger.error('Delete document error:', error);
                next(error);
            }
        };
        // Vital Signs
        this.addVitalSigns = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const vitalSignsData = req.body;
                const vitalSigns = await this.healthRecordsService.addVitalSigns(patientId, vitalSignsData, role, userId);
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.VITAL_SIGNS_ADDED || 'Vital signs added successfully', vitalSigns);
            }
            catch (error) {
                logger_config_1.logger.error('Add vital signs error:', error);
                next(error);
            }
        };
        this.getVitalSigns = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const vitalSigns = await this.healthRecordsService.getVitalSigns(patientId, role, userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.VITAL_SIGNS_RETRIEVED || 'Vital signs retrieved successfully', vitalSigns);
            }
            catch (error) {
                logger_config_1.logger.error('Get vital signs error:', error);
                next(error);
            }
        };
        this.updateVitalSigns = async (req, res, next) => {
            try {
                const { patientId, vitalId } = req.params;
                const { role, userId } = req.user;
                const vitalSignsData = req.body;
                const vitalSigns = await this.healthRecordsService.updateVitalSigns(patientId, vitalId, vitalSignsData, role, userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.VITAL_SIGNS_UPDATED || 'Vital signs updated successfully', vitalSigns);
            }
            catch (error) {
                logger_config_1.logger.error('Update vital signs error:', error);
                next(error);
            }
        };
        this.deleteVitalSigns = async (req, res, next) => {
            try {
                const { patientId, vitalId } = req.params;
                const { role, userId } = req.user;
                const deleted = await this.healthRecordsService.deleteVitalSigns(patientId, vitalId, role, userId);
                if (deleted) {
                    responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.VITAL_SIGNS_DELETED || 'Vital signs deleted successfully');
                }
                else {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Failed to delete vital signs');
                }
            }
            catch (error) {
                logger_config_1.logger.error('Delete vital signs error:', error);
                next(error);
            }
        };
        // Lab Results
        this.addLabResult = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const labResultData = req.body;
                const labResult = await this.healthRecordsService.addLabResult(patientId, labResultData, role, userId);
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.LAB_RESULT_ADDED || 'Lab result added successfully', labResult);
            }
            catch (error) {
                logger_config_1.logger.error('Add lab result error:', error);
                next(error);
            }
        };
        this.getLabResults = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const labResults = await this.healthRecordsService.getLabResults(patientId, role, userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.LAB_RESULTS_RETRIEVED || 'Lab results retrieved successfully', labResults);
            }
            catch (error) {
                logger_config_1.logger.error('Get lab results error:', error);
                next(error);
            }
        };
        // Search and Statistics
        this.searchHealthRecords = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { q: searchTerm } = req.query;
                const { role, userId } = req.user;
                if (!searchTerm) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Search term is required');
                    return;
                }
                const results = await this.healthRecordsService.searchHealthRecords(patientId, searchTerm, role, userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully', results);
            }
            catch (error) {
                logger_config_1.logger.error('Search health records error:', error);
                next(error);
            }
        };
        this.getHealthRecordStats = async (req, res, next) => {
            try {
                const { patientId } = req.params;
                const { role, userId } = req.user;
                const stats = await this.healthRecordsService.getHealthRecordStats(patientId, role, userId);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.STATS_RETRIEVED || 'Statistics retrieved successfully', stats);
            }
            catch (error) {
                logger_config_1.logger.error('Get health record stats error:', error);
                next(error);
            }
        };
    }
}
exports.HealthRecordsController = HealthRecordsController;
