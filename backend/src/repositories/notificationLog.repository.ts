import { NotificationLog, NotificationStatus, NotificationReminderType } from '../models/NotificationLog.model';
import { BaseRepository } from './base.repository';

export class NotificationLogRepository extends BaseRepository<NotificationLog> {
  constructor() {
    super(NotificationLog);
  }

  async findPendingReminders(limit: number = 50): Promise<NotificationLog[]> {
    const now = new Date();
    
    return await this.repository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.appointment', 'appointment')
      .leftJoinAndSelect('log.patient', 'patient')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('log.status = :status', { status: NotificationStatus.PENDING })
      .andWhere('log.scheduledFor <= :now', { now })
      .andWhere('log.retryCount < :maxRetries', { maxRetries: 3 })
      .orderBy('log.scheduledFor', 'ASC')
      .limit(limit)
      .getMany();
  }

  async findExistingReminder(
    appointmentId: string, 
    reminderType: NotificationReminderType
  ): Promise<NotificationLog | null> {
    return await this.repository
      .createQueryBuilder('log')
      .where('log.appointmentId = :appointmentId', { appointmentId })
      .andWhere('log.reminderType = :reminderType', { reminderType })
      .getOne();
  }

  async markAsSent(id: string): Promise<void> {
    await this.repository.update(id, {
      status: NotificationStatus.SENT,
      sentAt: new Date()
    });
  }

  async markAsFailed(id: string, errorMessage: string): Promise<void> {
    const log = await this.repository.findOne({ where: { id } });
    if (log) {
      await this.repository.update(id, {
        status: log.retryCount >= 3 ? NotificationStatus.FAILED : NotificationStatus.PENDING,
        errorMessage,
        retryCount: log.retryCount + 1
      });
    }
  }

  async cancelRemindersForAppointment(appointmentId: string): Promise<void> {
    await this.repository.update(
      { 
        appointmentId,
        status: NotificationStatus.PENDING 
      },
      { 
        status: NotificationStatus.CANCELLED 
      }
    );
  }

  async scheduleReminder(data: {
    appointmentId: string;
    patientId: string;
    reminderType: NotificationReminderType;
    scheduledFor: Date;
    notificationTitle: string;
    notificationBody: string;
  }): Promise<NotificationLog> {
    // Check if reminder already exists
    const existing = await this.findExistingReminder(data.appointmentId, data.reminderType);
    if (existing) {
      // Update existing reminder
      await this.repository.update(existing.id, {
        scheduledFor: data.scheduledFor,
        notificationTitle: data.notificationTitle,
        notificationBody: data.notificationBody,
        status: NotificationStatus.PENDING,
        retryCount: 0
      });
      return existing;
    }

    // Create new reminder
    const reminder = this.repository.create(data);
    return await this.repository.save(reminder);
  }

  async getNotificationStats(patientId?: string): Promise<{
    pending: number;
    sent: number;
    failed: number;
    total: number;
  }> {
    const baseQuery = this.repository.createQueryBuilder('log');
    
    if (patientId) {
      baseQuery.where('log.patientId = :patientId', { patientId });
    }

    const [pending, sent, failed, total] = await Promise.all([
      baseQuery.clone().andWhere('log.status = :status', { status: NotificationStatus.PENDING }).getCount(),
      baseQuery.clone().andWhere('log.status = :status', { status: NotificationStatus.SENT }).getCount(),
      baseQuery.clone().andWhere('log.status = :status', { status: NotificationStatus.FAILED }).getCount(),
      baseQuery.clone().getCount()
    ]);

    return { pending, sent, failed, total };
  }

  async getRecentNotifications(patientId: string, limit: number = 10): Promise<NotificationLog[]> {
    return await this.repository
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.appointment', 'appointment')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .where('log.patientId = :patientId', { patientId })
      .orderBy('log.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}