import { Request, Response, NextFunction } from 'express';
import { PrescriptionService } from '../services/prescription.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export class PrescriptionController {
  private prescriptionService = new PrescriptionService();

  getAllPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, patientId, doctorId, medicationId, startDate, endDate, page = 1, limit = 10 } = req.query;

      const filters = {
        status: status as string,
        patientId: patientId as string,
        doctorId: doctorId as string,
        medicationId: medicationId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const result = await this.prescriptionService.getAllPrescriptions(
        filters,
        parseInt(page as string),
        parseInt(limit as string),
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.paginated(
        res,
        MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Prescriptions retrieved successfully',
        result.data,
        result.total,
        result.page,
        result.limit
      );
    } catch (error) {
      logger.error('Get all prescriptions error:', error);
      next(error);
    }
  };

  getPrescriptionById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const prescription = await this.prescriptionService.getPrescriptionById(
        id,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PRESCRIPTION_RETRIEVED || 'Prescription retrieved successfully',
        prescription
      );
    } catch (error) {
      logger.error('Get prescription by ID error:', error);
      next(error);
    }
  };

  createPrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const prescriptionData = req.body;
      const prescription = await this.prescriptionService.createPrescription(
        prescriptionData,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.PRESCRIPTION_CREATED || 'Prescription created successfully',
        prescription
      );
    } catch (error) {
      logger.error('Create prescription error:', error);
      next(error);
    }
  };

  updatePrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const prescription = await this.prescriptionService.updatePrescription(
        id,
        updateData,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PRESCRIPTION_UPDATED || 'Prescription updated successfully',
        prescription
      );
    } catch (error) {
      logger.error('Update prescription error:', error);
      next(error);
    }
  };

  discontinuePrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const prescription = await this.prescriptionService.discontinuePrescription(
        id,
        reason,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PRESCRIPTION_DISCONTINUED || 'Prescription discontinued successfully',
        prescription
      );
    } catch (error) {
      logger.error('Discontinue prescription error:', error);
      next(error);
    }
  };

  completePrescription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      
      const prescription = await this.prescriptionService.completePrescription(
        id,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PRESCRIPTION_COMPLETED || 'Prescription completed successfully',
        prescription
      );
    } catch (error) {
      logger.error('Complete prescription error:', error);
      next(error);
    }
  };

  getActivePrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;
      
      const prescriptions = await this.prescriptionService.getActivePrescriptions(
        ((req as any).user).role,
        ((req as any).user).userId,
        parseInt(limit as string)
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.ACTIVE_PRESCRIPTIONS_RETRIEVED || 'Active prescriptions retrieved successfully',
        prescriptions
      );
    } catch (error) {
      logger.error('Get active prescriptions error:', error);
      next(error);
    }
  };

  getPrescriptionStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.prescriptionService.getPrescriptionStats(
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.STATS_RETRIEVED || 'Prescription statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Get prescription stats error:', error);
      next(error);
    }
  };

  searchPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q) {
        ResponseHandler.badRequest(res, MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
        return;
      }

      const prescriptions = await this.prescriptionService.searchPrescriptions(
        q as string,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully',
        prescriptions
      );
    } catch (error) {
      logger.error('Search prescriptions error:', error);
      next(error);
    }
  };

  // Patient-specific endpoints
  getPatientPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { status, startDate, endDate } = req.query;

      const prescriptions = await this.prescriptionService.getPatientPrescriptions(patientId, {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Patient prescriptions retrieved successfully',
        prescriptions
      );
    } catch (error) {
      logger.error('Get patient prescriptions error:', error);
      next(error);
    }
  };

  // Doctor-specific endpoints
  getDoctorPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const { status, startDate, endDate } = req.query;

      const prescriptions = await this.prescriptionService.getDoctorPrescriptions(doctorId, {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Doctor prescriptions retrieved successfully',
        prescriptions
      );
    } catch (error) {
      logger.error('Get doctor prescriptions error:', error);
      next(error);
    }
  };
}