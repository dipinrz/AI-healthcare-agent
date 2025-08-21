"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TestNotificationService = void 0;
const logger_config_1 = require("../config/logger.config");
const notificationSetting_service_1 = require("./notificationSetting.service");
const appointment_service_1 = require("./appointment.service");
class TestNotificationService {
    constructor() {
        this.notificationSettingService = new notificationSetting_service_1.NotificationSettingService();
        this.appointmentService = new appointment_service_1.AppointmentService();
    }
    // Notification templates for testing
    getNotificationTemplate(type, doctorName = 'Dr. Smith', appointmentDate = 'Tomorrow', appointmentTime = '2:00 PM') {
        switch (type) {
            case 'reminder_24h':
                return {
                    title: 'Appointment Reminder - Tomorrow',
                    body: `Don't forget your appointment with ${doctorName} ${appointmentDate} at ${appointmentTime}`
                };
            case 'reminder_1h':
                return {
                    title: 'Appointment Starting Soon',
                    body: `Your appointment with ${doctorName} starts in 1 hour at ${appointmentTime}`
                };
            case 'confirmed':
                return {
                    title: 'Appointment Confirmed ✅',
                    body: `Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} has been confirmed`
                };
            case 'cancelled':
                return {
                    title: 'Appointment Cancelled ❌',
                    body: `Your appointment with ${doctorName} on ${appointmentDate} at ${appointmentTime} has been cancelled`
                };
            case 'rescheduled':
                return {
                    title: 'Appointment Rescheduled 📅',
                    body: `Your appointment with ${doctorName} has been rescheduled to ${appointmentDate} at ${appointmentTime}`
                };
            default:
                return {
                    title: 'Test Notification 🧪',
                    body: `This is a test notification from AI Healthcare System. Current time: ${new Date().toLocaleTimeString()}`
                };
        }
    }
    async sendTestNotification(patientId, type, customData) {
        try {
            logger_config_1.logger.info(`Sending test notification to patient ${patientId}, type: ${type}`);
            // Check if patient has notifications enabled for this type
            let canSend = false;
            if (type === 'general') {
                // For general test notifications, just check if notifications are enabled
                canSend = await this.notificationSettingService.isNotificationsEnabled(patientId);
            }
            else {
                // Map notification types to permission check
                const permissionType = type.replace('reminder_', '');
                canSend = await this.notificationSettingService.canSendReminder(patientId, permissionType);
            }
            if (!canSend) {
                return {
                    success: true,
                    message: `Patient has disabled ${type} notifications`,
                    sent: false
                };
            }
            // Generate notification content
            const template = this.getNotificationTemplate(type, customData?.doctorName, customData?.appointmentDate, customData?.appointmentTime);
            // For now, we'll just log the notification (later this will be replaced with actual FCM sending)
            const notificationData = {
                title: template.title,
                body: template.body,
                type: type,
                patientId,
                doctorName: customData?.doctorName || 'Dr. Smith',
                appointmentDate: customData?.appointmentDate || 'Tomorrow',
                appointmentTime: customData?.appointmentTime || '2:00 PM'
            };
            // Mock sending notification (replace this with actual FCM code later)
            logger_config_1.logger.info('📱 MOCK NOTIFICATION SENT:', {
                to: `patient_${patientId}`,
                notification: {
                    title: notificationData.title,
                    body: notificationData.body,
                    icon: '🏥',
                    badge: '1',
                    tag: `appointment_${type}`,
                    timestamp: new Date().toISOString()
                },
                data: {
                    type: notificationData.type,
                    patientId: notificationData.patientId,
                    appointmentId: notificationData.appointmentId || 'test_appointment',
                    clickAction: '/appointments'
                }
            });
            return {
                success: true,
                message: `Test ${type} notification sent successfully to patient ${patientId}`,
                sent: true
            };
        }
        catch (error) {
            logger_config_1.logger.error('Test notification error:', error);
            return {
                success: false,
                message: 'Failed to send test notification',
                sent: false
            };
        }
    }
    async sendTestNotificationToAllPatients(type, customData) {
        try {
            logger_config_1.logger.info(`Sending test ${type} notifications to all patients with enabled notifications`);
            // This is a simplified version - in a real implementation, you'd get all patients from the database
            const testPatientIds = ['test_patient_1', 'test_patient_2', 'test_patient_3'];
            const results = [];
            for (const patientId of testPatientIds) {
                const result = await this.sendTestNotification(patientId, type, customData);
                results.push({
                    patientId,
                    ...result
                });
            }
            const sentCount = results.filter(r => r.sent).length;
            const totalCount = results.length;
            return {
                success: true,
                message: `Test notifications sent to ${sentCount}/${totalCount} patients`,
                results
            };
        }
        catch (error) {
            logger_config_1.logger.error('Bulk test notification error:', error);
            return {
                success: false,
                message: 'Failed to send bulk test notifications',
                results: []
            };
        }
    }
    async testNotificationSettings(patientId) {
        try {
            logger_config_1.logger.info(`Testing notification settings for patient ${patientId}`);
            // Get patient's notification settings
            const settings = await this.notificationSettingService.getPatientNotificationSettings(patientId);
            // Test all notification types
            const notificationTypes = ['reminder_24h', 'reminder_1h', 'confirmed', 'cancelled', 'rescheduled', 'general'];
            const testResults = [];
            for (const type of notificationTypes) {
                const result = await this.sendTestNotification(patientId, type);
                testResults.push({
                    type,
                    ...result
                });
            }
            const sentCount = testResults.filter(r => r.sent).length;
            const totalCount = testResults.length;
            return {
                success: true,
                message: `Notification settings test completed. ${sentCount}/${totalCount} notifications would be sent.`,
                settings: {
                    notificationsEnabled: settings.notificationsEnabled,
                    reminder24h: settings.reminder24h,
                    reminder1h: settings.reminder1h,
                    appointmentConfirmed: settings.appointmentConfirmed,
                    appointmentCancelled: settings.appointmentCancelled,
                    appointmentRescheduled: settings.appointmentRescheduled
                },
                testResults
            };
        }
        catch (error) {
            logger_config_1.logger.error('Test notification settings error:', error);
            return {
                success: false,
                message: 'Failed to test notification settings',
                settings: null,
                testResults: []
            };
        }
    }
}
exports.TestNotificationService = TestNotificationService;
