"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const patient_routes_1 = __importDefault(require("./patient.routes"));
const doctor_routes_1 = __importDefault(require("./doctor.routes"));
const appointment_routes_1 = __importDefault(require("./appointment.routes"));
const medication_routes_1 = __importDefault(require("./medication.routes"));
const prescription_routes_1 = __importDefault(require("./prescription.routes"));
const doctorAvailability_routes_1 = __importDefault(require("./doctorAvailability.routes"));
const seed_routes_1 = __importDefault(require("./seed.routes"));
// import healthRecordRoutes from './healthRecord.routes';
// import chatRoutes from './chat.routes';
const router = (0, express_1.Router)();
// Mount all routes
router.use('/auth', auth_routes_1.default);
router.use('/patients', patient_routes_1.default);
router.use('/doctors', doctor_routes_1.default);
router.use('/appointments', appointment_routes_1.default);
router.use('/medications', medication_routes_1.default);
router.use('/prescriptions', prescription_routes_1.default);
router.use('/doctor-availability', doctorAvailability_routes_1.default);
router.use('/seed', seed_routes_1.default);
// router.use('/health-records', healthRecordRoutes);
// router.use('/chat', chatRoutes);
// API documentation route
router.get('/', (req, res) => {
    res.json({
        message: 'AI Healthcare API',
        version: '1.0.0',
        documentation: '/api/docs',
        environment: process.env.NODE_ENV || 'development',
        routes: {
            auth: '/api/auth',
            patients: '/api/patients',
            doctors: '/api/doctors',
            appointments: '/api/appointments',
            medications: '/api/medications',
            prescriptions: '/api/prescriptions',
            doctorAvailability: '/api/doctor-availability',
            seed: '/api/seed',
            // healthRecords: '/api/health-records',
            // chat: '/api/chat',
        },
    });
});
exports.default = router;
