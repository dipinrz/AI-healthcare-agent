"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettingController = void 0;
const notificationSetting_service_1 = require("../services/notificationSetting.service");
const responseHandler_1 = require("../utils/responseHandler");
const logger_config_1 = require("../config/logger.config");
const User_model_1 = require("../models/User.model");
class NotificationSettingController {
    constructor() {
        this.notificationSettingService = new notificationSetting_service_1.NotificationSettingService();
        this.getNotificationSettings = async (req, res, next) => {
            try {
                const user = req.user;
                if (user.role !== User_model_1.UserRole.PATIENT) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only patients can access notification settings');
                    return;
                }
                const patientId = user.patientId || user.userId;
                const settings = await this.notificationSettingService.getPatientNotificationSettings(patientId);
                responseHandler_1.ResponseHandler.success(res, 'Notification settings retrieved successfully', settings);
            }
            catch (error) {
                logger_config_1.logger.error('Get notification settings error:', error);
                next(error);
            }
        };
        this.updateNotificationSettings = async (req, res, next) => {
            try {
                const user = req.user;
                if (user.role !== User_model_1.UserRole.PATIENT) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only patients can update notification settings');
                    return;
                }
                const patientId = user.patientId || user.userId;
                const settingsData = req.body;
                const updatedSettings = await this.notificationSettingService.updatePatientNotificationSettings(patientId, settingsData);
                responseHandler_1.ResponseHandler.success(res, 'Notification settings updated successfully', updatedSettings);
            }
            catch (error) {
                logger_config_1.logger.error('Update notification settings error:', error);
                next(error);
            }
        };
        this.enableNotifications = async (req, res, next) => {
            try {
                const user = req.user;
                if (user.role !== User_model_1.UserRole.PATIENT) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only patients can enable notifications');
                    return;
                }
                const patientId = user.patientId || user.userId;
                const settings = await this.notificationSettingService.enableNotifications(patientId);
                responseHandler_1.ResponseHandler.success(res, 'Notifications enabled successfully', settings);
            }
            catch (error) {
                logger_config_1.logger.error('Enable notifications error:', error);
                next(error);
            }
        };
        this.disableNotifications = async (req, res, next) => {
            try {
                const user = req.user;
                if (user.role !== User_model_1.UserRole.PATIENT) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only patients can disable notifications');
                    return;
                }
                const patientId = user.patientId || user.userId;
                const settings = await this.notificationSettingService.disableNotifications(patientId);
                responseHandler_1.ResponseHandler.success(res, 'Notifications disabled successfully', settings);
            }
            catch (error) {
                logger_config_1.logger.error('Disable notifications error:', error);
                next(error);
            }
        };
        this.checkNotificationStatus = async (req, res, next) => {
            try {
                const user = req.user;
                if (user.role !== User_model_1.UserRole.PATIENT) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only patients can check notification status');
                    return;
                }
                const patientId = user.patientId || user.userId;
                const enabled = await this.notificationSettingService.isNotificationsEnabled(patientId);
                responseHandler_1.ResponseHandler.success(res, 'Notification status retrieved successfully', { enabled });
            }
            catch (error) {
                logger_config_1.logger.error('Check notification status error:', error);
                next(error);
            }
        };
    }
}
exports.NotificationSettingController = NotificationSettingController;
