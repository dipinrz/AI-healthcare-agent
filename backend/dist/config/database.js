"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("../entities/User");
const Patient_1 = require("../entities/Patient");
const Doctor_1 = require("../entities/Doctor");
const Appointment_1 = require("../entities/Appointment");
const Medication_1 = require("../entities/Medication");
const ChatLog_1 = require("../entities/ChatLog");
const Prescription_1 = require("../entities/Prescription");
const VitalSigns_1 = require("../entities/VitalSigns");
const LabResult_1 = require("../entities/LabResult");
const MedicalDocument_1 = require("../entities/MedicalDocument");
exports.AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'postgres',
    password: 'root',
    database: 'ai-agent',
    synchronize: true, // Only for development
    logging: true,
    entities: [User_1.User, Patient_1.Patient, Doctor_1.Doctor, Appointment_1.Appointment, Medication_1.Medication, ChatLog_1.ChatLog, Prescription_1.Prescription, VitalSigns_1.VitalSigns, LabResult_1.LabResult, MedicalDocument_1.MedicalDocument],
    migrations: [],
    subscribers: [],
});
