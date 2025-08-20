import { Request, Response, NextFunction } from 'express';
import { MedicationService } from '../services/medication.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export class MedicationController {
  private medicationService = new MedicationService();

  getAllMedications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, category, page = 1, limit = 10 } = req.query;
      
      const filters = {
        search: search as string,
        category: category as string,
      };

      const result = await this.medicationService.getAllMedications(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      ResponseHandler.paginated(
        res,
        MESSAGES.SUCCESS.MEDICATIONS_RETRIEVED || 'Medications retrieved successfully',
        result.data,
        result.total,
        result.page,
        result.limit
      );
    } catch (error) {
      logger.error('Get all medications error:', error);
      next(error);
    }
  };

  getMedicationById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const medication = await this.medicationService.getMedicationById(id);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.MEDICATION_RETRIEVED || 'Medication retrieved successfully',
        medication
      );
    } catch (error) {
      logger.error('Get medication by ID error:', error);
      next(error);
    }
  };

  createMedication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const medicationData = req.body;
      const medication = await this.medicationService.createMedication(medicationData);

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.MEDICATION_CREATED,
        medication
      );
    } catch (error) {
      logger.error('Create medication error:', error);
      next(error);
    }
  };

  updateMedication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const medication = await this.medicationService.updateMedication(id, updateData);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.MEDICATION_UPDATED,
        medication
      );
    } catch (error) {
      logger.error('Update medication error:', error);
      next(error);
    }
  };

  deleteMedication = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.medicationService.deleteMedication(id);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.MEDICATION_DELETED || 'Medication deleted successfully'
      );
    } catch (error) {
      logger.error('Delete medication error:', error);
      next(error);
    }
  };

  searchMedications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q) {
        ResponseHandler.badRequest(res, MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
        return;
      }

      const medications = await this.medicationService.searchMedications(q as string);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully',
        medications
      );
    } catch (error) {
      logger.error('Search medications error:', error);
      next(error);
    }
  };

  getMedicationCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.medicationService.getCategories();

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.CATEGORIES_RETRIEVED || 'Categories retrieved successfully',
        categories
      );
    } catch (error) {
      logger.error('Get medication categories error:', error);
      next(error);
    }
  };
}