import { Request, Response, NextFunction } from 'express';
import { NotificationSettingService } from '../services/notificationSetting.service';
import { ResponseHandler } from '../utils/responseHandler';
import { logger } from '../config/logger.config';
import { UserRole } from '../models/User.model';

export class NotificationSettingController {
  private notificationSettingService = new NotificationSettingService();

  getNotificationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (user.role !== UserRole.PATIENT) {
        ResponseHandler.forbidden(res, 'Only patients can access notification settings');
        return;
      }

      const patientId = user.patientId || user.userId;
      const settings = await this.notificationSettingService.getPatientNotificationSettings(patientId);

      ResponseHandler.success(
        res,
        'Notification settings retrieved successfully',
        settings
      );
    } catch (error) {
      logger.error('Get notification settings error:', error);
      next(error);
    }
  };

  updateNotificationSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (user.role !== UserRole.PATIENT) {
        ResponseHandler.forbidden(res, 'Only patients can update notification settings');
        return;
      }

      const patientId = user.patientId || user.userId;
      const settingsData = req.body;

      const updatedSettings = await this.notificationSettingService.updatePatientNotificationSettings(
        patientId,
        settingsData
      );

      ResponseHandler.success(
        res,
        'Notification settings updated successfully',
        updatedSettings
      );
    } catch (error) {
      logger.error('Update notification settings error:', error);
      next(error);
    }
  };

  enableNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (user.role !== UserRole.PATIENT) {
        ResponseHandler.forbidden(res, 'Only patients can enable notifications');
        return;
      }

      const patientId = user.patientId || user.userId;
      const settings = await this.notificationSettingService.enableNotifications(patientId);

      ResponseHandler.success(
        res,
        'Notifications enabled successfully',
        settings
      );
    } catch (error) {
      logger.error('Enable notifications error:', error);
      next(error);
    }
  };

  disableNotifications = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (user.role !== UserRole.PATIENT) {
        ResponseHandler.forbidden(res, 'Only patients can disable notifications');
        return;
      }

      const patientId = user.patientId || user.userId;
      const settings = await this.notificationSettingService.disableNotifications(patientId);

      ResponseHandler.success(
        res,
        'Notifications disabled successfully',
        settings
      );
    } catch (error) {
      logger.error('Disable notifications error:', error);
      next(error);
    }
  };

  checkNotificationStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
      if (user.role !== UserRole.PATIENT) {
        ResponseHandler.forbidden(res, 'Only patients can check notification status');
        return;
      }

      const patientId = user.patientId || user.userId;
      const enabled = await this.notificationSettingService.isNotificationsEnabled(patientId);

      ResponseHandler.success(
        res,
        'Notification status retrieved successfully',
        { enabled }
      );
    } catch (error) {
      logger.error('Check notification status error:', error);
      next(error);
    }
  };
}