import { Request, Response, NextFunction } from 'express';
import { HealthRecordsService } from '../services/healthRecords.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';
import { DocumentType } from '../models/MedicalDocument.model';
import * as path from 'path';
import * as fs from 'fs';

export class HealthRecordsController {
  private healthRecordsService = new HealthRecordsService();

  // Get complete health record
  getHealthRecord = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;

      const healthRecord = await this.healthRecordsService.getHealthRecord(
        patientId,
        role,
        userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.HEALTH_RECORD_RETRIEVED || 'Health record retrieved successfully',
        healthRecord
      );
    } catch (error) {
      logger.error('Get health record error:', error);
      next(error);
    }
  };

  // Medical Documents
  uploadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;
      const file = (req as any).file;

      if (!file) {
        ResponseHandler.badRequest(res, 'No file uploaded');
        return;
      }

      const { name, type, description, notes } = req.body;

      // Validate document type
      if (type && !Object.values(DocumentType).includes(type)) {
        ResponseHandler.badRequest(res, 'Invalid document type');
        return;
      }

      // Create file path
      const fileName = `${Date.now()}-${file.originalname}`;
      const filePath = this.healthRecordsService.createUploadPath(patientId, fileName);
      
      // Move file to permanent location
      fs.renameSync(file.path, filePath);

      const documentData = {
        name: name || file.originalname,
        type: type || DocumentType.OTHER,
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

      const document = await this.healthRecordsService.addMedicalDocument(
        patientId,
        documentData,
        role,
        userId
      );

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.DOCUMENT_UPLOADED || 'Document uploaded successfully',
        document
      );
    } catch (error) {
      logger.error('Upload document error:', error);
      next(error);
    }
  };

  getMedicalDocuments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;

      const documents = await this.healthRecordsService.getMedicalDocuments(
        patientId,
        role,
        userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.DOCUMENTS_RETRIEVED || 'Documents retrieved successfully',
        documents
      );
    } catch (error) {
      logger.error('Get medical documents error:', error);
      next(error);
    }
  };

  downloadDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId, documentId } = req.params;
      const { role, userId } = (req as any).user;

      // Check access permissions
      await this.healthRecordsService.getMedicalDocuments(patientId, role, userId);

      // Find the document (this could be optimized with a direct query)
      const documents = await this.healthRecordsService.getMedicalDocuments(patientId, role, userId);
      const document = documents.find(doc => doc.id === documentId);

      if (!document || !document.filePath) {
        ResponseHandler.notFound(res, 'Document not found');
        return;
      }

      if (!fs.existsSync(document.filePath)) {
        ResponseHandler.notFound(res, 'File not found on server');
        return;
      }

      // Set appropriate headers
      res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);

      // Stream the file
      const fileStream = fs.createReadStream(document.filePath);
      fileStream.pipe(res);
    } catch (error) {
      logger.error('Download document error:', error);
      next(error);
    }
  };

  deleteDocument = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId, documentId } = req.params;
      const { role, userId } = (req as any).user;

      const deleted = await this.healthRecordsService.deleteMedicalDocument(
        patientId,
        documentId,
        role,
        userId
      );

      if (deleted) {
        ResponseHandler.success(
          res,
          MESSAGES.SUCCESS.DOCUMENT_DELETED || 'Document deleted successfully'
        );
      } else {
        ResponseHandler.badRequest(res, 'Failed to delete document');
      }
    } catch (error) {
      logger.error('Delete document error:', error);
      next(error);
    }
  };

  // Vital Signs
  addVitalSigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;
      const vitalSignsData = req.body;

      const vitalSigns = await this.healthRecordsService.addVitalSigns(
        patientId,
        vitalSignsData,
        role,
        userId
      );

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.VITAL_SIGNS_ADDED || 'Vital signs added successfully',
        vitalSigns
      );
    } catch (error) {
      logger.error('Add vital signs error:', error);
      next(error);
    }
  };

  getVitalSigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;

      const vitalSigns = await this.healthRecordsService.getVitalSigns(
        patientId,
        role,
        userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.VITAL_SIGNS_RETRIEVED || 'Vital signs retrieved successfully',
        vitalSigns
      );
    } catch (error) {
      logger.error('Get vital signs error:', error);
      next(error);
    }
  };

  updateVitalSigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId, vitalId } = req.params;
      const { role, userId } = (req as any).user;
      const vitalSignsData = req.body;

      const vitalSigns = await this.healthRecordsService.updateVitalSigns(
        patientId,
        vitalId,
        vitalSignsData,
        role,
        userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.VITAL_SIGNS_UPDATED || 'Vital signs updated successfully',
        vitalSigns
      );
    } catch (error) {
      logger.error('Update vital signs error:', error);
      next(error);
    }
  };

  deleteVitalSigns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId, vitalId } = req.params;
      const { role, userId } = (req as any).user;

      const deleted = await this.healthRecordsService.deleteVitalSigns(
        patientId,
        vitalId,
        role,
        userId
      );

      if (deleted) {
        ResponseHandler.success(
          res,
          MESSAGES.SUCCESS.VITAL_SIGNS_DELETED || 'Vital signs deleted successfully'
        );
      } else {
        ResponseHandler.badRequest(res, 'Failed to delete vital signs');
      }
    } catch (error) {
      logger.error('Delete vital signs error:', error);
      next(error);
    }
  };

  // Lab Results
  addLabResult = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;
      const labResultData = req.body;

      const labResult = await this.healthRecordsService.addLabResult(
        patientId,
        labResultData,
        role,
        userId
      );

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.LAB_RESULT_ADDED || 'Lab result added successfully',
        labResult
      );
    } catch (error) {
      logger.error('Add lab result error:', error);
      next(error);
    }
  };

  getLabResults = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;

      const labResults = await this.healthRecordsService.getLabResults(
        patientId,
        role,
        userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.LAB_RESULTS_RETRIEVED || 'Lab results retrieved successfully',
        labResults
      );
    } catch (error) {
      logger.error('Get lab results error:', error);
      next(error);
    }
  };

  // Search and Statistics
  searchHealthRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { q: searchTerm } = req.query;
      const { role, userId } = (req as any).user;

      if (!searchTerm) {
        ResponseHandler.badRequest(res, 'Search term is required');
        return;
      }

      const results = await this.healthRecordsService.searchHealthRecords(
        patientId,
        searchTerm as string,
        role,
        userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully',
        results
      );
    } catch (error) {
      logger.error('Search health records error:', error);
      next(error);
    }
  };

  getHealthRecordStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { role, userId } = (req as any).user;

      const stats = await this.healthRecordsService.getHealthRecordStats(
        patientId,
        role,
        userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.STATS_RETRIEVED || 'Statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Get health record stats error:', error);
      next(error);
    }
  };
}