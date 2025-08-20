import { Request, Response, NextFunction } from 'express';
import { SeedService } from '../services/seed.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export class SeedController {
  private seedService = new SeedService();

  // Master seed - creates all demo data
  seedAll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Starting master seed operation...');
      const result = await this.seedService.seedAllData();

      ResponseHandler.success(
        res,
        'Master seed completed successfully',
        result
      );
    } catch (error) {
      logger.error('Master seed error:', error);
      next(error);
    }
  };

  // Seed doctors
  seedDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { count = 10 } = req.body;
      logger.info(`Seeding ${count} doctors...`);
      
      const result = await this.seedService.seedDoctors(parseInt(count));

      ResponseHandler.success(
        res,
        `Successfully created ${result.created} doctors`,
        result
      );
    } catch (error) {
      logger.error('Seed doctors error:', error);
      next(error);
    }
  };

  // Seed patients
  seedPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { count = 20 } = req.body;
      logger.info(`Seeding ${count} patients...`);
      
      const result = await this.seedService.seedPatients(parseInt(count));

      ResponseHandler.success(
        res,
        `Successfully created ${result.created} patients`,
        result
      );
    } catch (error) {
      logger.error('Seed patients error:', error);
      next(error);
    }
  };

  // Seed medications
  seedMedications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('Seeding medications...');
      const result = await this.seedService.seedMedications();

      ResponseHandler.success(
        res,
        `Successfully created ${result.created} medications`,
        result
      );
    } catch (error) {
      logger.error('Seed medications error:', error);
      next(error);
    }
  };

  // Seed appointments
  seedAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { count = 50 } = req.body;
      logger.info(`Seeding ${count} appointments...`);
      
      const result = await this.seedService.seedAppointments(parseInt(count));

      ResponseHandler.success(
        res,
        `Successfully created ${result.created} appointments`,
        result
      );
    } catch (error) {
      logger.error('Seed appointments error:', error);
      next(error);
    }
  };

  // Seed prescriptions
  seedPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { count = 30 } = req.body;
      logger.info(`Seeding ${count} prescriptions...`);
      
      const result = await this.seedService.seedPrescriptions(parseInt(count));

      ResponseHandler.success(
        res,
        `Successfully created ${result.created} prescriptions`,
        result
      );
    } catch (error) {
      logger.error('Seed prescriptions error:', error);
      next(error);
    }
  };

  // Seed health records
  seedHealthRecords = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { count = 40 } = req.body;
      logger.info(`Seeding ${count} health records...`);
      
      const result = await this.seedService.seedHealthRecords(parseInt(count));

      ResponseHandler.success(
        res,
        `Successfully created health records for ${result.created} patients`,
        result
      );
    } catch (error) {
      logger.error('Seed health records error:', error);
      next(error);
    }
  };

  // Seed doctor availability slots
  seedDoctorAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId, days = 30 } = req.body;
      logger.info(`Seeding doctor availability slots for ${days} days...`);
      
      const result = await this.seedService.seedDoctorAvailability(doctorId, parseInt(days));

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOTS_GENERATED,
        result
      );
    } catch (error) {
      logger.error('Seed doctor availability error:', error);
      next(error);
    }
  };

  // Clear all data (dangerous operation)
  clearAllData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { confirm } = req.body;
      
      if (confirm !== 'DELETE_ALL_DATA') {
        ResponseHandler.badRequest(res, 'Please provide confirmation: { "confirm": "DELETE_ALL_DATA" }');
        return;
      }

      logger.warn('CLEARING ALL DATA - This operation cannot be undone!');
      const result = await this.seedService.clearAllData();

      ResponseHandler.success(
        res,
        'All data has been cleared successfully',
        result
      );
    } catch (error) {
      logger.error('Clear all data error:', error);
      next(error);
    }
  };

  // Get seeding status
  getSeedStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const status = await this.seedService.getSeedStatus();

      ResponseHandler.success(
        res,
        'Seed status retrieved successfully',
        status
      );
    } catch (error) {
      logger.error('Get seed status error:', error);
      next(error);
    }
  };

  // Seed specific demo scenario
  seedDemoScenario = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { scenario = 'basic' } = req.body;
      logger.info(`Seeding demo scenario: ${scenario}`);
      
      const result = await this.seedService.seedDemoScenario(scenario);

      ResponseHandler.success(
        res,
        `Demo scenario '${scenario}' created successfully`,
        result
      );
    } catch (error) {
      logger.error('Seed demo scenario error:', error);
      next(error);
    }
  };

  // Reset specific entity
  resetEntity = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { entity } = req.params;
      const { confirm } = req.body;
      
      if (confirm !== `RESET_${entity.toUpperCase()}`) {
        ResponseHandler.badRequest(
          res, 
          `Please provide confirmation: { "confirm": "RESET_${entity.toUpperCase()}" }`
        );
        return;
      }

      logger.warn(`Resetting ${entity} data...`);
      const result = await this.seedService.resetEntity(entity);

      ResponseHandler.success(
        res,
        `${entity} data has been reset successfully`,
        result
      );
    } catch (error) {
      logger.error(`Reset ${req.params.entity} error:`, error);
      next(error);
    }
  };
}