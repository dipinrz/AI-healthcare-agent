"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestNotificationController = void 0;
const testNotification_service_1 = require("../services/testNotification.service");
const responseHandler_1 = require("../utils/responseHandler");
const logger_config_1 = require("../config/logger.config");
const User_model_1 = require("../models/User.model");
class TestNotificationController {
    constructor() {
        this.testNotificationService = new testNotification_service_1.TestNotificationService();
        this.sendTestNotification = async (req, res, next) => {
            try {
                const user = req.user;
                const { type, doctorName, appointmentDate, appointmentTime, targetPatientId } = req.body;
                // For testing, allow both patients and admins
                if (user.role !== User_model_1.UserRole.PATIENT && user.role !== User_model_1.UserRole.ADMIN) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only patients and admins can send test notifications');
                    return;
                }
                // Determine target patient ID
                let patientId;
                if (user.role === User_model_1.UserRole.ADMIN && targetPatientId) {
                    patientId = targetPatientId;
                }
                else {
                    patientId = user.patientId || user.userId;
                }
                if (!patientId) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Patient ID is required');
                    return;
                }
                const notificationType = type || 'general';
                const customData = {
                    doctorName: doctorName || 'Dr. Smith',
                    appointmentDate: appointmentDate || 'Tomorrow',
                    appointmentTime: appointmentTime || '2:00 PM'
                };
                const result = await this.testNotificationService.sendTestNotification(patientId, notificationType, customData);
                if (result.success) {
                    responseHandler_1.ResponseHandler.success(res, result.message, {
                        sent: result.sent,
                        patientId,
                        notificationType,
                        customData
                    });
                }
                else {
                    responseHandler_1.ResponseHandler.badRequest(res, result.message);
                }
            }
            catch (error) {
                logger_config_1.logger.error('Send test notification error:', error);
                next(error);
            }
        };
        this.sendBulkTestNotifications = async (req, res, next) => {
            try {
                const user = req.user;
                const { type, doctorName, appointmentDate, appointmentTime } = req.body;
                // Only admins can send bulk notifications
                if (user.role !== User_model_1.UserRole.ADMIN) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only administrators can send bulk test notifications');
                    return;
                }
                const notificationType = type || 'general';
                const customData = {
                    doctorName: doctorName || 'Dr. Smith',
                    appointmentDate: appointmentDate || 'Tomorrow',
                    appointmentTime: appointmentTime || '2:00 PM'
                };
                const result = await this.testNotificationService.sendTestNotificationToAllPatients(notificationType, customData);
                responseHandler_1.ResponseHandler.success(res, result.message, {
                    results: result.results,
                    notificationType,
                    customData
                });
            }
            catch (error) {
                logger_config_1.logger.error('Send bulk test notifications error:', error);
                next(error);
            }
        };
        this.testNotificationSettings = async (req, res, next) => {
            try {
                const user = req.user;
                const { targetPatientId } = req.query;
                if (user.role !== User_model_1.UserRole.PATIENT && user.role !== User_model_1.UserRole.ADMIN) {
                    responseHandler_1.ResponseHandler.forbidden(res, 'Only patients and admins can test notification settings');
                    return;
                }
                // Determine target patient ID
                let patientId;
                if (user.role === User_model_1.UserRole.ADMIN && targetPatientId) {
                    patientId = targetPatientId;
                }
                else {
                    patientId = user.patientId || user.userId;
                }
                if (!patientId) {
                    responseHandler_1.ResponseHandler.badRequest(res, 'Patient ID is required');
                    return;
                }
                const result = await this.testNotificationService.testNotificationSettings(patientId);
                if (result.success) {
                    responseHandler_1.ResponseHandler.success(res, result.message, {
                        patientId,
                        settings: result.settings,
                        testResults: result.testResults
                    });
                }
                else {
                    responseHandler_1.ResponseHandler.badRequest(res, result.message);
                }
            }
            catch (error) {
                logger_config_1.logger.error('Test notification settings error:', error);
                next(error);
            }
        };
        this.getNotificationTypes = async (req, res, next) => {
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
                responseHandler_1.ResponseHandler.success(res, 'Available notification types retrieved', {
                    types: notificationTypes
                });
            }
            catch (error) {
                logger_config_1.logger.error('Get notification types error:', error);
                next(error);
            }
        };
    }
}
exports.TestNotificationController = TestNotificationController;
