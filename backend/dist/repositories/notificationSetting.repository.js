"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSettingRepository = void 0;
const NotificationSetting_model_1 = require("../models/NotificationSetting.model");
const base_repository_1 = require("./base.repository");
class NotificationSettingRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(NotificationSetting_model_1.NotificationSetting);
    }
    async findByPatientId(patientId) {
        return await this.repository
            .createQueryBuilder('settings')
            .where('settings.patientId = :patientId', { patientId })
            .getOne();
    }
    async createDefaultSettings(patientId) {
        const defaultSettings = this.repository.create({
            patientId,
            notificationsEnabled: false, // Disabled by default - user must opt-in
            reminder24h: true,
            reminder1h: true,
            appointmentConfirmed: true,
            appointmentCancelled: true,
            appointmentRescheduled: true,
        });
        return await this.repository.save(defaultSettings);
    }
    async updateSettings(patientId, settingsData) {
        let settings = await this.findByPatientId(patientId);
        if (!settings) {
            // Create default settings if they don't exist
            settings = await this.createDefaultSettings(patientId);
        }
        // Update the settings
        await this.repository.update({ patientId }, settingsData);
        // Return updated settings
        return await this.findByPatientId(patientId);
    }
    async getOrCreateSettings(patientId) {
        let settings = await this.findByPatientId(patientId);
        if (!settings) {
            settings = await this.createDefaultSettings(patientId);
        }
        return settings;
    }
    async isNotificationsEnabled(patientId) {
        const settings = await this.findByPatientId(patientId);
        return settings ? settings.notificationsEnabled : false;
    }
    async toggleNotifications(patientId, enabled) {
        return await this.updateSettings(patientId, { notificationsEnabled: enabled });
    }
}
exports.NotificationSettingRepository = NotificationSettingRepository;
