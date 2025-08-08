// import { DataSource } from "typeorm";
// import { User } from "../entities/User";
// import { Patient } from "../entities/Patient";
// import { Doctor } from "../entities/Doctor";
// import { Appointment } from "../entities/Appointment";
// import { Medication } from "../entities/Medication";
// import { ChatLog } from "../entities/ChatLog";
// import { Prescription } from "../entities/Prescription";
// import { VitalSigns } from "../entities/VitalSigns";
// import { LabResult } from "../entities/LabResult";
// import { MedicalDocument } from "../entities/MedicalDocument";

// export const AppDataSource = new DataSource({
//   type: "postgres",
//   host: "localhost",
//   port: 5432,
//   username: "postgres",
//   password: "root",
//   database: "ai-agent",
//   synchronize: true, // Only for development
//   logging: true,
//   entities: [
//     User,
//     Patient,
//     Doctor,
//     Appointment,
//     Medication,
//     ChatLog,
//     Prescription,
//     VitalSigns,
//     LabResult,
//     MedicalDocument,
//   ],
//   migrations: [],
//   subscribers: [],
// });

import { DataSource } from 'typeorm';
import { User } from '../entities/User';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { Appointment } from '../entities/Appointment';
import { Medication } from '../entities/Medication';
import { ChatLog } from '../entities/ChatLog';
import { Prescription } from '../entities/Prescription';
import { VitalSigns } from '../entities/VitalSigns';
import { LabResult } from '../entities/LabResult';
import { MedicalDocument } from '../entities/MedicalDocument';
import { DoctorAvailability } from '../entities/DoctorAvailability';

// Database configuration based on environment
const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_OeyXpbqB6Dz4@ep-square-unit-ad3tr6wu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  synchronize: true, // Only use in development, disable in production
  logging:false, // Disable logging in production for performance
  ssl: databaseUrl.includes('neon.tech') || databaseUrl.includes('amazonaws.com'), // SSL for cloud providers
  entities: [
    User,
    Patient,
    Doctor,
    Appointment,
    Medication,
    ChatLog,
    Prescription,
    VitalSigns,
    LabResult,
    MedicalDocument,
    DoctorAvailability
  ],
  migrations: [],
  subscribers: [],
});
