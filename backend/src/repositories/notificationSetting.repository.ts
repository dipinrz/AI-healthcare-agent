import { Repository } from 'typeorm';
import { AppDataSource } from '../config/db.config';
import { NotificationSetting } from '../models/NotificationSetting.model';
import { BaseRepository } from './base.repository';

export class NotificationSettingRepository extends BaseRepository<NotificationSetting> {
  constructor() {
    super(NotificationSetting);
  }

  async findByPatientId(patientId: string): Promise<NotificationSetting | null> {
    return await this.repository
      .createQueryBuilder('settings')
      .where('settings.patientId = :patientId', { patientId })
      .getOne();
  }

  async createDefaultSettings(patientId: string): Promise<NotificationSetting> {
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

  async updateSettings(patientId: string, settingsData: Partial<NotificationSetting>): Promise<NotificationSetting> {
    let settings = await this.findByPatientId(patientId);
    
    if (!settings) {
      // Create default settings if they don't exist
      settings = await this.createDefaultSettings(patientId);
    }

    // Update the settings
    await this.repository.update({ patientId }, settingsData);
    
    // Return updated settings
    return await this.findByPatientId(patientId) as NotificationSetting;
  }

  async getOrCreateSettings(patientId: string): Promise<NotificationSetting> {
    let settings = await this.findByPatientId(patientId);
    
    if (!settings) {
      settings = await this.createDefaultSettings(patientId);
    }
    
    return settings;
  }

  async isNotificationsEnabled(patientId: string): Promise<boolean> {
    const settings = await this.findByPatientId(patientId);
    return settings ? settings.notificationsEnabled : false;
  }

  async toggleNotifications(patientId: string, enabled: boolean): Promise<NotificationSetting> {
    return await this.updateSettings(patientId, { notificationsEnabled: enabled });
  }
}