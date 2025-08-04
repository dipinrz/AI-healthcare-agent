"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
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
    url: 'postgresql://neondb_owner:npg_OeyXpbqB6Dz4@ep-square-unit-ad3tr6wu-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
    synchronize: true, // Only use in development
    logging: true,
    ssl: true, // Needed for Neon
    entities: [
        User_1.User,
        Patient_1.Patient,
        Doctor_1.Doctor,
        Appointment_1.Appointment,
        Medication_1.Medication,
        ChatLog_1.ChatLog,
        Prescription_1.Prescription,
        VitalSigns_1.VitalSigns,
        LabResult_1.LabResult,
        MedicalDocument_1.MedicalDocument,
    ],
    migrations: [],
    subscribers: [],
});
