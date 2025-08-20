"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const index_1 = require("./index");
const User_model_1 = require("../models/User.model");
const Patient_model_1 = require("../models/Patient.model");
const Doctor_model_1 = require("../models/Doctor.model");
const Appointment_model_1 = require("../models/Appointment.model");
const Medication_model_1 = require("../models/Medication.model");
const ChatLog_model_1 = require("../models/ChatLog.model");
const Prescription_model_1 = require("../models/Prescription.model");
const VitalSigns_model_1 = require("../models/VitalSigns.model");
const LabResult_model_1 = require("../models/LabResult.model");
const MedicalDocument_model_1 = require("../models/MedicalDocument.model");
const DoctorAvailability_model_1 = require("../models/DoctorAvailability.model");
// Database configuration based on environment
const isProduction = index_1.config.NODE_ENV === 'production';
const databaseUrl = process.env.DATABASE_URL ||
    `postgresql://${index_1.config.DB_USERNAME}:${index_1.config.DB_PASSWORD}@${index_1.config.DB_HOST}:${index_1.config.DB_PORT}/${index_1.config.DB_NAME}`;
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    url: databaseUrl,
    synchronize: !isProduction, // Only use in development
    logging: index_1.config.NODE_ENV === 'development' && index_1.config.LOG_LEVEL === 'debug',
    ssl: databaseUrl.includes('neon.tech') ||
        databaseUrl.includes('amazonaws.com') ||
        databaseUrl.includes('supabase.co'),
    entities: [
        User_model_1.User,
        Patient_model_1.Patient,
        Doctor_model_1.Doctor,
        Appointment_model_1.Appointment,
        Medication_model_1.Medication,
        ChatLog_model_1.ChatLog,
        Prescription_model_1.Prescription,
        VitalSigns_model_1.VitalSigns,
        LabResult_model_1.LabResult,
        MedicalDocument_model_1.MedicalDocument,
        DoctorAvailability_model_1.DoctorAvailability
    ],
    migrations: ['src/migrations/*.ts'],
    subscribers: ['src/subscribers/*.ts'],
    // Connection pool settings
    extra: {
        max: 20,
        min: 5,
        acquire: 60000,
        idle: 10000,
    },
});
