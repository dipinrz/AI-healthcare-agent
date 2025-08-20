import { Request, Response, NextFunction } from 'express';
import { DoctorAvailabilityService } from '../services/doctorAvailability.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export class DoctorAvailabilityController {
  private doctorAvailabilityService = new DoctorAvailabilityService();

  // Get available slots for a doctor
  getDoctorSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const { date, month } = req.query;

      const slots = await this.doctorAvailabilityService.getDoctorSlots(doctorId, {
        date: date as string,
        month: month as string,
      });

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOTS_RETRIEVED || 'Doctor slots retrieved successfully',
        slots
      );
    } catch (error) {
      logger.error('Get doctor slots error:', error);
      next(error);
    }
  };

  // Get available doctors for specific time slot
  getAvailableDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { startTime, endTime } = req.query;

      if (!startTime || !endTime) {
        ResponseHandler.badRequest(res, 'startTime and endTime are required');
        return;
      }

      const doctors = await this.doctorAvailabilityService.getAvailableDoctors(
        startTime as string,
        endTime as string
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.AVAILABLE_DOCTORS_RETRIEVED || 'Available doctors retrieved successfully',
        doctors
      );
    } catch (error) {
      logger.error('Get available doctors error:', error);
      next(error);
    }
  };

  // Book a specific slot
  bookSlot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slotId } = req.params;
      
      const slot = await this.doctorAvailabilityService.bookSlot(parseInt(slotId));

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOT_BOOKED,
        slot
      );
    } catch (error) {
      logger.error('Book slot error:', error);
      next(error);
    }
  };

  // Release a booked slot
  releaseSlot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slotId } = req.params;
      
      const slot = await this.doctorAvailabilityService.releaseSlot(parseInt(slotId));

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOT_RELEASED,
        slot
      );
    } catch (error) {
      logger.error('Release slot error:', error);
      next(error);
    }
  };

  // Generate availability slots for all doctors
  generateSlotsForAllDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { days = 30 } = req.body;
      
      const result = await this.doctorAvailabilityService.generateSlotsForAllDoctors(parseInt(days));

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOTS_GENERATED,
        result
      );
    } catch (error) {
      logger.error('Generate slots for all doctors error:', error);
      next(error);
    }
  };

  // Generate availability slots for specific doctor
  generateSlotsForDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const { days = 30 } = req.body;
      
      const result = await this.doctorAvailabilityService.generateSlotsForDoctor(doctorId, parseInt(days));

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOTS_GENERATED,
        result
      );
    } catch (error) {
      logger.error('Generate slots for doctor error:', error);
      next(error);
    }
  };

  // Get slot by ID
  getSlotById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slotId } = req.params;
      
      const slot = await this.doctorAvailabilityService.getSlotById(parseInt(slotId));

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOT_RETRIEVED || 'Slot retrieved successfully',
        slot
      );
    } catch (error) {
      logger.error('Get slot by ID error:', error);
      next(error);
    }
  };

  // Update slot availability
  updateSlotAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slotId } = req.params;
      const { isBooked } = req.body;
      
      const slot = await this.doctorAvailabilityService.updateSlotAvailability(
        parseInt(slotId),
        isBooked
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SLOT_UPDATED || 'Slot updated successfully',
        slot
      );
    } catch (error) {
      logger.error('Update slot availability error:', error);
      next(error);
    }
  };

  // Get availability statistics
  getAvailabilityStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.query;
      
      const stats = await this.doctorAvailabilityService.getAvailabilityStats(doctorId as string);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.STATS_RETRIEVED || 'Availability statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Get availability stats error:', error);
      next(error);
    }
  };

  // Clear old slots
  clearOldSlots = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { beforeDate } = req.body;
      
      if (!beforeDate) {
        ResponseHandler.badRequest(res, 'beforeDate is required');
        return;
      }

      const result = await this.doctorAvailabilityService.clearOldSlots(new Date(beforeDate));

      ResponseHandler.success(
        res,
        `Successfully cleared ${result.deletedCount} old slots`,
        result
      );
    } catch (error) {
      logger.error('Clear old slots error:', error);
      next(error);
    }
  };
}