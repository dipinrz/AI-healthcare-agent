import { Request, Response, NextFunction } from 'express';
import { TestNotificationService } from '../services/testNotification.service';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../config/logger.config';
import { UserRole } from '../models/User.model';

export class TestNotificationController {
  private testNotificationService = new TestNotificationService();

  sendTestNotification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { type, doctorName, appointmentDate, appointmentTime, targetPatientId } = req.body;

      // For testing, allow both patients and admins
      if (user.role !== UserRole.PATIENT && user.role !== UserRole.ADMIN) {
        ResponseHandler.forbidden(res, 'Only patients and admins can send test notifications');
        return;
      }

      // Determine target patient ID
      let patientId: string;
      if (user.role === UserRole.ADMIN && targetPatientId) {
        patientId = targetPatientId;
      } else {
        patientId = user.patientId || user.userId;
      }

      if (!patientId) {
        ResponseHandler.badRequest(res, 'Patient ID is required');
        return;
      }

      const notificationType = type || 'general';
      const customData = {
        doctorName: doctorName || 'Dr. Smith',
        appointmentDate: appointmentDate || 'Tomorrow',
        appointmentTime: appointmentTime || '2:00 PM'
      };

      const result = await this.testNotificationService.sendTestNotification(
        patientId,
        notificationType,
        customData
      );

      if (result.success) {
        ResponseHandler.success(res, result.message, {
          sent: result.sent,
          patientId,
          notificationType,
          customData
        });
      } else {
        ResponseHandler.badRequest(res, result.message);
      }

    } catch (error) {
      logger.error('Send test notification error:', error);
      next(error);
    }
  };

  sendBulkTestNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { type, doctorName, appointmentDate, appointmentTime } = req.body;

      // Only admins can send bulk notifications
      if (user.role !== UserRole.ADMIN) {
        ResponseHandler.forbidden(res, 'Only administrators can send bulk test notifications');
        return;
      }

      const notificationType = type || 'general';
      const customData = {
        doctorName: doctorName || 'Dr. Smith',
        appointmentDate: appointmentDate || 'Tomorrow',
        appointmentTime: appointmentTime || '2:00 PM'
      };

      const result = await this.testNotificationService.sendTestNotificationToAllPatients(
        notificationType,
        customData
      );

      ResponseHandler.success(res, result.message, {
        results: result.results,
        notificationType,
        customData
      });

    } catch (error) {
      logger.error('Send bulk test notifications error:', error);
      next(error);
    }
  };

  testNotificationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      const { targetPatientId } = req.query;

      if (user.role !== UserRole.PATIENT && user.role !== UserRole.ADMIN) {
        ResponseHandler.forbidden(res, 'Only patients and admins can test notification settings');
        return;
      }

      // Determine target patient ID
      let patientId: string;
      if (user.role === UserRole.ADMIN && targetPatientId) {
        patientId = targetPatientId as string;
      } else {
        patientId = user.patientId || user.userId;
      }

      if (!patientId) {
        ResponseHandler.badRequest(res, 'Patient ID is required');
        return;
      }

      const result = await this.testNotificationService.testNotificationSettings(patientId);

      if (result.success) {
        ResponseHandler.success(res, result.message, {
          patientId,
          settings: result.settings,
          testResults: result.testResults
        });
      } else {
        ResponseHandler.badRequest(res, result.message);
      }

    } catch (error) {
      logger.error('Test notification settings error:', error);
      next(error);
    }
  };

  getNotificationTypes = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notificationTypes = [
        {
          type: 'reminder_24h',
          name: '24 Hour Reminder',
          description: 'Sent 24 hours before appointment',
          example: 'Don\'t forget your appointment with Dr. Smith tomorrow at 2:00 PM'
        },
        {
          type: 'reminder_1h',
          name: '1 Hour Reminder',
          description: 'Sent 1 hour before appointment',
          example: 'Your appointment with Dr. Smith starts in 1 hour at 2:00 PM'
        },
        {
          type: 'confirmed',
          name: 'Appointment Confirmed',
          description: 'Sent when appointment is confirmed',
          example: 'Your appointment with Dr. Smith on Tomorrow at 2:00 PM has been confirmed'
        },
        {
          type: 'cancelled',
          name: 'Appointment Cancelled',
          description: 'Sent when appointment is cancelled',
          example: 'Your appointment with Dr. Smith on Tomorrow at 2:00 PM has been cancelled'
        },
        {
          type: 'rescheduled',
          name: 'Appointment Rescheduled',
          description: 'Sent when appointment is rescheduled',
          example: 'Your appointment with Dr. Smith has been rescheduled to Tomorrow at 2:00 PM'
        },
        {
          type: 'general',
          name: 'General Test',
          description: 'General test notification',
          example: 'This is a test notification from AI Healthcare System'
        }
      ];

      ResponseHandler.success(res, 'Available notification types retrieved', {
        types: notificationTypes
      });

    } catch (error) {
      logger.error('Get notification types error:', error);
      next(error);
    }
  };
}