"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettingService = void 0;
const notificationSetting_repository_1 = require("../repositories/notificationSetting.repository");
const logger_config_1 = require("../config/logger.config");
class NotificationSettingService {
    constructor() {
        this.notificationSettingRepository = new notificationSetting_repository_1.NotificationSettingRepository();
    }
    async getPatientNotificationSettings(patientId) {
        try {
            logger_config_1.logger.info(`Getting notification settings for patient: ${patientId}`);
            return await this.notificationSettingRepository.getOrCreateSettings(patientId);
        }
        catch (error) {
            logger_config_1.logger.error('Error getting notification settings:', error);
            throw new Error('Failed to get notification settings');
        }
    }
    async updatePatientNotificationSettings(patientId, settingsData) {
        try {
            logger_config_1.logger.info(`Updating notification settings for patient: ${patientId}`, settingsData);
            const updatedSettings = await this.notificationSettingRepository.updateSettings(patientId, settingsData);
            logger_config_1.logger.info(`Notification settings updated successfully for patient: ${patientId}`);
            return updatedSettings;
        }
        catch (error) {
            logger_config_1.logger.error('Error updating notification settings:', error);
            throw new Error('Failed to update notification settings');
        }
    }
    async enableNotifications(patientId) {
        try {
            logger_config_1.logger.info(`Enabling notifications for patient: ${patientId}`);
            return await this.notificationSettingRepository.toggleNotifications(patientId, true);
        }
        catch (error) {
            logger_config_1.logger.error('Error enabling notifications:', error);
            throw new Error('Failed to enable notifications');
        }
    }
    async disableNotifications(patientId) {
        try {
            logger_config_1.logger.info(`Disabling notifications for patient: ${patientId}`);
            return await this.notificationSettingRepository.toggleNotifications(patientId, false);
        }
        catch (error) {
            logger_config_1.logger.error('Error disabling notifications:', error);
            throw new Error('Failed to disable notifications');
        }
    }
    async isNotificationsEnabled(patientId) {
        try {
            return await this.notificationSettingRepository.isNotificationsEnabled(patientId);
        }
        catch (error) {
            logger_config_1.logger.error('Error checking notification status:', error);
            return false; // Default to disabled if error
        }
    }
    async canSendReminder(patientId, reminderType) {
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
        }
        catch (error) {
            logger_config_1.logger.error('Error checking reminder permission:', error);
            return false;
        }
    }
}
exports.NotificationSettingService = NotificationSettingService;
