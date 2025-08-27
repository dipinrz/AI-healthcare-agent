import { DataSource } from 'typeorm';
import { config } from './index';
import { User } from '../models/User.model';
import { Patient } from '../models/Patient.model';
import { Doctor } from '../models/Doctor.model';
import { Appointment } from '../models/Appointment.model';
import { Medication } from '../models/Medication.model';
import { ChatLog } from '../models/ChatLog.model';
import { Prescription } from '../models/Prescription.model';
import { VitalSigns } from '../models/VitalSigns.model';
import { LabResult } from '../models/LabResult.model';
import { MedicalDocument } from '../models/MedicalDocument.model';
import { DoctorAvailability } from '../models/DoctorAvailability.model';
import { NotificationSetting } from '../models/NotificationSetting.model';
import { NotificationLog } from '../models/NotificationLog.model';
import { PrescriptionItem } from '../models/PrescriptionItem.model';

// Database configuration based on environment
const isProduction = config.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL 
|| 
  `postgresql://${config.DB_USERNAME}:${config.DB_PASSWORD}@${config.DB_HOST}:${config.DB_PORT}/${config.DB_NAME}`;

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: false, // Use migrations instead of auto-sync
  migrationsRun: true, // Automatically run migrations on startup
  logging: config.NODE_ENV === 'development' && config.LOG_LEVEL === 'debug',
  ssl: databaseUrl.includes('neon.tech') || 
       databaseUrl.includes('amazonaws.com') || 
       databaseUrl.includes('supabase.co'),
  entities: [
    User,
    Patient,
    Doctor,
    Appointment,
    Medication,
    ChatLog,
    Prescription,
    PrescriptionItem,
    VitalSigns,
    LabResult,
    MedicalDocument,
    DoctorAvailability,
    NotificationSetting,
    NotificationLog
  ],
  migrations: [__dirname + '/../migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts'],
  // Connection pool settings
  extra: {
    max: 20,
    min: 5,
    acquire: 60000,
    idle: 10000,
  },
});