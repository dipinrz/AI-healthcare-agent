"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationLogRepository = void 0;
const NotificationLog_model_1 = require("../models/NotificationLog.model");
const base_repository_1 = require("./base.repository");
class NotificationLogRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(NotificationLog_model_1.NotificationLog);
    }
    async findPendingReminders(limit = 50) {
        const now = new Date();
        return await this.repository
            .createQueryBuilder('log')
            .leftJoinAndSelect('log.appointment', 'appointment')
            .leftJoinAndSelect('log.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('log.status = :status', { status: NotificationLog_model_1.NotificationStatus.PENDING })
            .andWhere('log.scheduledFor <= :now', { now })
            .andWhere('log.retryCount < :maxRetries', { maxRetries: 3 })
            .orderBy('log.scheduledFor', 'ASC')
            .limit(limit)
            .getMany();
    }
    async findExistingReminder(appointmentId, reminderType) {
        return await this.repository
            .createQueryBuilder('log')
            .where('log.appointmentId = :appointmentId', { appointmentId })
            .andWhere('log.reminderType = :reminderType', { reminderType })
            .getOne();
    }
    async markAsSent(id) {
        await this.repository.update(id, {
            status: NotificationLog_model_1.NotificationStatus.SENT,
            sentAt: new Date()
        });
    }
    async markAsFailed(id, errorMessage) {
        const log = await this.repository.findOne({ where: { id } });
        if (log) {
            await this.repository.update(id, {
                status: log.retryCount >= 3 ? NotificationLog_model_1.NotificationStatus.FAILED : NotificationLog_model_1.NotificationStatus.PENDING,
                errorMessage,
                retryCount: log.retryCount + 1
            });
        }
    }
    async cancelRemindersForAppointment(appointmentId) {
        await this.repository.update({
            appointmentId,
            status: NotificationLog_model_1.NotificationStatus.PENDING
        }, {
            status: NotificationLog_model_1.NotificationStatus.CANCELLED
        });
    }
    async scheduleReminder(data) {
        // Check if reminder already exists
        const existing = await this.findExistingReminder(data.appointmentId, data.reminderType);
        if (existing) {
            // Update existing reminder
            await this.repository.update(existing.id, {
                scheduledFor: data.scheduledFor,
                notificationTitle: data.notificationTitle,
                notificationBody: data.notificationBody,
                status: NotificationLog_model_1.NotificationStatus.PENDING,
                retryCount: 0
            });
            return existing;
        }
        // Create new reminder
        const reminder = this.repository.create(data);
        return await this.repository.save(reminder);
    }
    async getNotificationStats(patientId) {
        const baseQuery = this.repository.createQueryBuilder('log');
        if (patientId) {
            baseQuery.where('log.patientId = :patientId', { patientId });
        }
        const [pending, sent, failed, total] = await Promise.all([
            baseQuery.clone().andWhere('log.status = :status', { status: NotificationLog_model_1.NotificationStatus.PENDING }).getCount(),
            baseQuery.clone().andWhere('log.status = :status', { status: NotificationLog_model_1.NotificationStatus.SENT }).getCount(),
            baseQuery.clone().andWhere('log.status = :status', { status: NotificationLog_model_1.NotificationStatus.FAILED }).getCount(),
            baseQuery.clone().getCount()
        ]);
        return { pending, sent, failed, total };
    }
    async getRecentNotifications(patientId, limit = 10) {
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
exports.NotificationLogRepository = NotificationLogRepository;
