import { Request, Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export class AppointmentController {
  private appointmentService = new AppointmentService();

  getAllAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status, doctorId, patientId, startDate, endDate, type, page = 1, limit = 10 } = req.query;

      const filters = {
        status: status as string,
        doctorId: doctorId as string,
        patientId: patientId as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        type: type as string,
      };

      const result = await this.appointmentService.getAllAppointments(
        filters,
        parseInt(page as string),
        parseInt(limit as string),
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.paginated(
        res,
        MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Appointments retrieved successfully',
        result.data,
        result.total,
        result.page,
        result.limit
      );
    } catch (error) {
      logger.error('Get all appointments error:', error);
      next(error);
    }
  };

  getAppointmentById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const appointment = await this.appointmentService.getAppointmentById(
        id,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENT_RETRIEVED || 'Appointment retrieved successfully',
        appointment
      );
    } catch (error) {
      logger.error('Get appointment by ID error:', error);
      next(error);
    }
  };

  createAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const appointmentData = req.body;
      const appointment = await this.appointmentService.createAppointment(
        appointmentData,
        ((req as any).user)
      );

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.APPOINTMENT_CREATED,
        appointment
      );
    } catch (error) {
      logger.error('Create appointment error:', error);
      next(error);
    }
  };

  updateAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const appointment = await this.appointmentService.updateAppointment(
        id,
        updateData,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENT_UPDATED,
        appointment
      );
    } catch (error) {
      logger.error('Update appointment error:', error);
      next(error);
    }
  };

  cancelAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      
      const appointment = await this.appointmentService.cancelAppointment(
        id,
        reason,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENT_CANCELLED,
        appointment
      );
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      next(error);
    }
  };

  rescheduleAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { newDate, newTime, slotId } = req.body;
      
      if (!newDate || !newTime) {
        ResponseHandler.badRequest(res, MESSAGES.VALIDATION.NEW_DATE_TIME_REQUIRED || 'New date and time are required');
        return;
      }

      const appointment = await this.appointmentService.rescheduleAppointment(
        id,
        new Date(`${newDate}T${newTime}`),
        slotId,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENT_RESCHEDULED,
        appointment
      );
    } catch (error) {
      logger.error('Reschedule appointment error:', error);
      next(error);
    }
  };

  completeAppointment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { diagnosis, notes, prescriptions } = req.body;
      
      const appointment = await this.appointmentService.completeAppointment(
        id,
        {
          diagnosis,
          notes,
          prescriptions,
        },
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENT_COMPLETED,
        appointment
      );
    } catch (error) {
      logger.error('Complete appointment error:', error);
      next(error);
    }
  };

  getUpcomingAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;
      
      const appointments = await this.appointmentService.getUpcomingAppointments(
        ((req as any).user).role,
        ((req as any).user).userId,
        parseInt(limit as string)
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.UPCOMING_APPOINTMENTS_RETRIEVED || 'Upcoming appointments retrieved successfully',
        appointments
      );
    } catch (error) {
      logger.error('Get upcoming appointments error:', error);
      next(error);
    }
  };

  getPastAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { limit = 10 } = req.query;
      
      const appointments = await this.appointmentService.getPastAppointments(
        ((req as any).user).role,
        ((req as any).user).userId,
        parseInt(limit as string)
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PAST_APPOINTMENTS_RETRIEVED || 'Past appointments retrieved successfully',
        appointments
      );
    } catch (error) {
      logger.error('Get past appointments error:', error);
      next(error);
    }
  };

  getAppointmentStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.appointmentService.getAppointmentStats(
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.STATS_RETRIEVED || 'Appointment statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Get appointment stats error:', error);
      next(error);
    }
  };

  searchAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q) {
        ResponseHandler.badRequest(res, MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
        return;
      }

      const appointments = await this.appointmentService.searchAppointments(
        q as string,
        ((req as any).user).role,
        ((req as any).user).userId
      );

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully',
        appointments
      );
    } catch (error) {
      logger.error('Search appointments error:', error);
      next(error);
    }
  };

  // Patient-specific endpoints
  getPatientAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const { status, startDate, endDate } = req.query;

      const appointments = await this.appointmentService.getPatientAppointments(patientId, {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Patient appointments retrieved successfully',
        appointments
      );
    } catch (error) {
      logger.error('Get patient appointments error:', error);
      next(error);
    }
  };

  // Doctor-specific endpoints
  getDoctorAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { doctorId } = req.params;
      const { status, startDate, endDate } = req.query;

      const appointments = await this.appointmentService.getDoctorAppointments(doctorId, {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Doctor appointments retrieved successfully',
        appointments
      );
    } catch (error) {
      logger.error('Get doctor appointments error:', error);
      next(error);
    }
  };
}