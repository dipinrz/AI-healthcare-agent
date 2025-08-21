import * as cron from 'node-cron';
import { logger } from '../config/logger.config';
import { NotificationLogRepository } from '../repositories/notificationLog.repository';
import { NotificationSettingRepository } from '../repositories/notificationSetting.repository';
import { NotificationLog, NotificationStatus, NotificationReminderType } from '../models/NotificationLog.model';
import { Appointment } from '../models/Appointment.model';

export class AutomaticReminderSchedulerService {
  private notificationLogRepository = new NotificationLogRepository();
  private notificationSettingRepository = new NotificationSettingRepository();
  private isRunning = false;

  // Initialize and start the scheduler
  start() {
    logger.info('🕐 Starting automatic reminder scheduler...');

    // Run every 10 minutes to check for pending reminders
    cron.schedule('*/10 * * * *', async () => {
      if (this.isRunning) {
        logger.debug('Reminder checker already running, skipping...');
        return;
      }

      this.isRunning = true;
      try {
        await this.processPendingReminders();
      } catch (error) {
        logger.error('Error processing pending reminders:', error);
      } finally {
        this.isRunning = false;
      }
    });

    logger.info('🕐 Automatic reminder scheduler started - runs every 10 minutes');
  }

  // Process all pending reminders that are due
  async processPendingReminders(): Promise<void> {
    try {
      const pendingReminders = await this.notificationLogRepository.findPendingReminders(50);
      
      if (pendingReminders.length === 0) {
        logger.debug('No pending reminders to process');
        return;
      }

      logger.info(`📨 Processing ${pendingReminders.length} pending reminders...`);

      for (const reminder of pendingReminders) {
        await this.sendReminder(reminder);
      }

      logger.info(`✅ Finished processing ${pendingReminders.length} reminders`);
    } catch (error) {
      logger.error('Error in processPendingReminders:', error);
    }
  }

  // Send a single reminder notification
  private async sendReminder(reminder: NotificationLog): Promise<void> {
    try {
      logger.info(`📱 Sending ${reminder.reminderType} reminder for appointment ${reminder.appointmentId}`);

      // Check if patient still has notifications enabled for this type
      const canSend = await this.canSendReminderToPatient(
        reminder.patientId,
        reminder.reminderType
      );

      if (!canSend) {
        logger.info(`❌ Notification blocked - patient disabled ${reminder.reminderType} reminders`);
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
      logger.info('📱 AUTOMATIC NOTIFICATION SENT:', notificationPayload);

      // Mark as sent
      await this.notificationLogRepository.markAsSent(reminder.id);
      
      logger.info(`✅ Successfully sent ${reminder.reminderType} reminder to patient ${reminder.patientId}`);
    } catch (error) {
      logger.error(`❌ Failed to send reminder ${reminder.id}:`, error);
      await this.notificationLogRepository.markAsFailed(
        reminder.id, 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }

  // Check if patient wants to receive this type of reminder
  private async canSendReminderToPatient(
    patientId: string, 
    reminderType: NotificationReminderType
  ): Promise<boolean> {
    try {
      const settings = await this.notificationSettingRepository.getOrCreateSettings(patientId);
      
      // Check if notifications are enabled globally
      if (!settings.notificationsEnabled) {
        return false;
      }

      // Check specific reminder type
      switch (reminderType) {
        case NotificationReminderType.REMINDER_24H:
          return settings.reminder24h;
        case NotificationReminderType.REMINDER_1H:
          return settings.reminder1h;
        case NotificationReminderType.CONFIRMED:
          return settings.appointmentConfirmed;
        case NotificationReminderType.CANCELLED:
          return settings.appointmentCancelled;
        case NotificationReminderType.RESCHEDULED:
          return settings.appointmentRescheduled;
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking reminder permissions:', error);
      return false;
    }
  }

  // Schedule reminders when an appointment is booked
  async scheduleRemindersForAppointment(appointment: Appointment): Promise<void> {
    try {
      const appointmentTime = new Date(appointment.appointmentDate);
      const now = new Date();

      logger.info(`📅 Scheduling reminders for appointment ${appointment.id} at ${appointmentTime.toISOString()}`);

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
          reminderType: NotificationReminderType.REMINDER_24H,
          scheduledFor: reminder24h,
          notificationTitle: 'Appointment Reminder - Tomorrow',
          notificationBody: `Don't forget your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} tomorrow at ${appointmentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        });
        logger.info(`⏰ Scheduled 24h reminder for ${reminder24h.toISOString()}`);
      }

      if (reminder1h > now) {
        await this.notificationLogRepository.scheduleReminder({
          appointmentId: appointment.id,
          patientId: appointment.patient.id,
          reminderType: NotificationReminderType.REMINDER_1H,
          scheduledFor: reminder1h,
          notificationTitle: 'Appointment Starting Soon',
          notificationBody: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} starts in 1 hour at ${appointmentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        });
        logger.info(`⏰ Scheduled 1h reminder for ${reminder1h.toISOString()}`);
      }

      logger.info(`✅ Successfully scheduled reminders for appointment ${appointment.id}`);
    } catch (error) {
      logger.error('Error scheduling reminders for appointment:', error);
      throw error;
    }
  }

  // Cancel all reminders for an appointment (when cancelled/rescheduled)
  async cancelRemindersForAppointment(appointmentId: string): Promise<void> {
    try {
      await this.notificationLogRepository.cancelRemindersForAppointment(appointmentId);
      logger.info(`🚫 Cancelled all reminders for appointment ${appointmentId}`);
    } catch (error) {
      logger.error('Error cancelling reminders:', error);
      throw error;
    }
  }

  // Send immediate notification (for confirmations, cancellations, etc.)
  async sendImmediateNotification(
    appointment: Appointment,
    reminderType: NotificationReminderType,
    title: string,
    body: string
  ): Promise<void> {
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
    } catch (error) {
      logger.error('Error sending immediate notification:', error);
      throw error;
    }
  }

  // Get scheduler statistics
  async getSchedulerStats(): Promise<any> {
    try {
      const stats = await this.notificationLogRepository.getNotificationStats();
      return {
        ...stats,
        schedulerRunning: true,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error getting scheduler stats:', error);
      return { error: 'Failed to get stats' };
    }
  }
}