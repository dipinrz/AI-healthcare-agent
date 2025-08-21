import { NotificationSettingRepository } from '../repositories/notificationSetting.repository';
import { NotificationSetting } from '../models/NotificationSetting.model';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';

export interface NotificationSettingsData {
  notificationsEnabled?: boolean;
  reminder24h?: boolean;
  reminder1h?: boolean;
  appointmentConfirmed?: boolean;
  appointmentCancelled?: boolean;
  appointmentRescheduled?: boolean;
}

export class NotificationSettingService {
  private notificationSettingRepository = new NotificationSettingRepository();

  async getPatientNotificationSettings(patientId: string): Promise<NotificationSetting> {
    try {
      logger.info(`Getting notification settings for patient: ${patientId}`);
      return await this.notificationSettingRepository.getOrCreateSettings(patientId);
    } catch (error) {
      logger.error('Error getting notification settings:', error);
      throw new Error('Failed to get notification settings');
    }
  }

  async updatePatientNotificationSettings(
    patientId: string, 
    settingsData: NotificationSettingsData
  ): Promise<NotificationSetting> {
    try {
      logger.info(`Updating notification settings for patient: ${patientId}`, settingsData);
      
      const updatedSettings = await this.notificationSettingRepository.updateSettings(
        patientId, 
        settingsData
      );
      
      logger.info(`Notification settings updated successfully for patient: ${patientId}`);
      return updatedSettings;
    } catch (error) {
      logger.error('Error updating notification settings:', error);
      throw new Error('Failed to update notification settings');
    }
  }

  async enableNotifications(patientId: string): Promise<NotificationSetting> {
    try {
      logger.info(`Enabling notifications for patient: ${patientId}`);
      return await this.notificationSettingRepository.toggleNotifications(patientId, true);
    } catch (error) {
      logger.error('Error enabling notifications:', error);
      throw new Error('Failed to enable notifications');
    }
  }

  async disableNotifications(patientId: string): Promise<NotificationSetting> {
    try {
      logger.info(`Disabling notifications for patient: ${patientId}`);
      return await this.notificationSettingRepository.toggleNotifications(patientId, false);
    } catch (error) {
      logger.error('Error disabling notifications:', error);
      throw new Error('Failed to disable notifications');
    }
  }

  async isNotificationsEnabled(patientId: string): Promise<boolean> {
    try {
      return await this.notificationSettingRepository.isNotificationsEnabled(patientId);
    } catch (error) {
      logger.error('Error checking notification status:', error);
      return false; // Default to disabled if error
    }
  }

  async canSendReminder(patientId: string, reminderType: '24h' | '1h' | 'confirmed' | 'cancelled' | 'rescheduled'): Promise<boolean> {
    try {
      const settings = await this.getPatientNotificationSettings(patientId);
      
      // First check if notifications are enabled at all
      if (!settings.notificationsEnabled) {
        return false;
      }

      // Check specific reminder type
      switch (reminderType) {
        case '24h':
          return settings.reminder24h;
        case '1h':
          return settings.reminder1h;
        case 'confirmed':
          return settings.appointmentConfirmed;
        case 'cancelled':
          return settings.appointmentCancelled;
        case 'rescheduled':
          return settings.appointmentRescheduled;
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking reminder permission:', error);
      return false;
    }
  }
}