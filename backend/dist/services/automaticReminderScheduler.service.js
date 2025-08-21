"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomaticReminderSchedulerService = void 0;
const cron = __importStar(require("node-cron"));
const logger_config_1 = require("../config/logger.config");
const notificationLog_repository_1 = require("../repositories/notificationLog.repository");
const notificationSetting_repository_1 = require("../repositories/notificationSetting.repository");
const NotificationLog_model_1 = require("../models/NotificationLog.model");
class AutomaticReminderSchedulerService {
    constructor() {
        this.notificationLogRepository = new notificationLog_repository_1.NotificationLogRepository();
        this.notificationSettingRepository = new notificationSetting_repository_1.NotificationSettingRepository();
        this.isRunning = false;
    }
    // Initialize and start the scheduler
    start() {
        logger_config_1.logger.info('🕐 Starting automatic reminder scheduler...');
        // Run every 10 minutes to check for pending reminders
        cron.schedule('*/10 * * * *', async () => {
            if (this.isRunning) {
                logger_config_1.logger.debug('Reminder checker already running, skipping...');
                return;
            }
            this.isRunning = true;
            try {
                await this.processPendingReminders();
            }
            catch (error) {
                logger_config_1.logger.error('Error processing pending reminders:', error);
            }
            finally {
                this.isRunning = false;
            }
        });
        logger_config_1.logger.info('🕐 Automatic reminder scheduler started - runs every 10 minutes');
    }
    // Process all pending reminders that are due
    async processPendingReminders() {
        try {
            const pendingReminders = await this.notificationLogRepository.findPendingReminders(50);
            if (pendingReminders.length === 0) {
                logger_config_1.logger.debug('No pending reminders to process');
                return;
            }
            logger_config_1.logger.info(`📨 Processing ${pendingReminders.length} pending reminders...`);
            for (const reminder of pendingReminders) {
                await this.sendReminder(reminder);
            }
            logger_config_1.logger.info(`✅ Finished processing ${pendingReminders.length} reminders`);
        }
        catch (error) {
            logger_config_1.logger.error('Error in processPendingReminders:', error);
        }
    }
    // Send a single reminder notification
    async sendReminder(reminder) {
        try {
            logger_config_1.logger.info(`📱 Sending ${reminder.reminderType} reminder for appointment ${reminder.appointmentId}`);
            // Check if patient still has notifications enabled for this type
            const canSend = await this.canSendReminderToPatient(reminder.patientId, reminder.reminderType);
            if (!canSend) {
                logger_config_1.logger.info(`❌ Notification blocked - patient disabled ${reminder.reminderType} reminders`);
                await this.notificationLogRepository.markAsSent(reminder.id); // Mark as sent to prevent retries
                return;
            }
            // Mock sending notification (replace this with actual Firebase FCM call later)
            const notificationPayload = {
                to: `patient_${reminder.patientId}`,
                notification: {
                    title: reminder.notificationTitle,
                    body: reminder.notificationBody,
                    icon: '🏥',
                    badge: '1',
                    tag: `appointment_${reminder.reminderType}`,
                    timestamp: new Date().toISOString(),
                    // Add action buttons for better UX
                    actions: [
                        { action: 'view', title: 'View Details' },
                        { action: 'confirm', title: 'Confirm' }
                    ]
                },
                data: {
                    type: reminder.reminderType,
                    appointmentId: reminder.appointmentId,
                    patientId: reminder.patientId,
                    clickAction: '/appointments'
                }
            };
            // TODO: Replace this with actual Firebase FCM implementation
            logger_config_1.logger.info('📱 AUTOMATIC NOTIFICATION SENT:', notificationPayload);
            // Mark as sent
            await this.notificationLogRepository.markAsSent(reminder.id);
            logger_config_1.logger.info(`✅ Successfully sent ${reminder.reminderType} reminder to patient ${reminder.patientId}`);
        }
        catch (error) {
            logger_config_1.logger.error(`❌ Failed to send reminder ${reminder.id}:`, error);
            await this.notificationLogRepository.markAsFailed(reminder.id, error instanceof Error ? error.message : 'Unknown error');
        }
    }
    // Check if patient wants to receive this type of reminder
    async canSendReminderToPatient(patientId, reminderType) {
        try {
            const settings = await this.notificationSettingRepository.getOrCreateSettings(patientId);
            // Check if notifications are enabled globally
            if (!settings.notificationsEnabled) {
                return false;
            }
            // Check specific reminder type
            switch (reminderType) {
                case NotificationLog_model_1.NotificationReminderType.REMINDER_24H:
                    return settings.reminder24h;
                case NotificationLog_model_1.NotificationReminderType.REMINDER_1H:
                    return settings.reminder1h;
                case NotificationLog_model_1.NotificationReminderType.CONFIRMED:
                    return settings.appointmentConfirmed;
                case NotificationLog_model_1.NotificationReminderType.CANCELLED:
                    return settings.appointmentCancelled;
                case NotificationLog_model_1.NotificationReminderType.RESCHEDULED:
                    return settings.appointmentRescheduled;
                default:
                    return false;
            }
        }
        catch (error) {
            logger_config_1.logger.error('Error checking reminder permissions:', error);
            return false;
        }
    }
    // Schedule reminders when an appointment is booked
    async scheduleRemindersForAppointment(appointment) {
        try {
            const appointmentTime = new Date(appointment.appointmentDate);
            const now = new Date();
            logger_config_1.logger.info(`📅 Scheduling reminders for appointment ${appointment.id} at ${appointmentTime.toISOString()}`);
            // Calculate reminder times
            const reminder24h = new Date(appointmentTime);
            reminder24h.setHours(reminder24h.getHours() - 24);
            const reminder1h = new Date(appointmentTime);
            reminder1h.setHours(reminder1h.getHours() - 1);
            // Only schedule if reminder time is in the future
            if (reminder24h > now) {
                await this.notificationLogRepository.scheduleReminder({
                    appointmentId: appointment.id,
                    patientId: appointment.patient.id,
                    reminderType: NotificationLog_model_1.NotificationReminderType.REMINDER_24H,
                    scheduledFor: reminder24h,
                    notificationTitle: 'Appointment Reminder - Tomorrow',
                    notificationBody: `Don't forget your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} tomorrow at ${appointmentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                });
                logger_config_1.logger.info(`⏰ Scheduled 24h reminder for ${reminder24h.toISOString()}`);
            }
            if (reminder1h > now) {
                await this.notificationLogRepository.scheduleReminder({
                    appointmentId: appointment.id,
                    patientId: appointment.patient.id,
                    reminderType: NotificationLog_model_1.NotificationReminderType.REMINDER_1H,
                    scheduledFor: reminder1h,
                    notificationTitle: 'Appointment Starting Soon',
                    notificationBody: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} starts in 1 hour at ${appointmentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
                });
                logger_config_1.logger.info(`⏰ Scheduled 1h reminder for ${reminder1h.toISOString()}`);
            }
            logger_config_1.logger.info(`✅ Successfully scheduled reminders for appointment ${appointment.id}`);
        }
        catch (error) {
            logger_config_1.logger.error('Error scheduling reminders for appointment:', error);
            throw error;
        }
    }
    // Cancel all reminders for an appointment (when cancelled/rescheduled)
    async cancelRemindersForAppointment(appointmentId) {
        try {
            await this.notificationLogRepository.cancelRemindersForAppointment(appointmentId);
            logger_config_1.logger.info(`🚫 Cancelled all reminders for appointment ${appointmentId}`);
        }
        catch (error) {
            logger_config_1.logger.error('Error cancelling reminders:', error);
            throw error;
        }
    }
    // Send immediate notification (for confirmations, cancellations, etc.)
    async sendImmediateNotification(appointment, reminderType, title, body) {
        try {
            const reminder = await this.notificationLogRepository.scheduleReminder({
                appointmentId: appointment.id,
                patientId: appointment.patient.id,
                reminderType,
                scheduledFor: new Date(), // Send immediately
                notificationTitle: title,
                notificationBody: body
            });
            await this.sendReminder(reminder);
        }
        catch (error) {
            logger_config_1.logger.error('Error sending immediate notification:', error);
            throw error;
        }
    }
    // Get scheduler statistics
    async getSchedulerStats() {
        try {
            const stats = await this.notificationLogRepository.getNotificationStats();
            return {
                ...stats,
                schedulerRunning: true,
                lastCheck: new Date().toISOString()
            };
        }
        catch (error) {
            logger_config_1.logger.error('Error getting scheduler stats:', error);
            return { error: 'Failed to get stats' };
        }
    }
}
exports.AutomaticReminderSchedulerService = AutomaticReminderSchedulerService;
