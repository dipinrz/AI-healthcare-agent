"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prescription_controller_1 = require("../controllers/prescription.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const User_model_1 = require("../models/User.model");
const router = (0, express_1.Router)();
const prescriptionController = new prescription_controller_1.PrescriptionController();
// Apply authentication to all routes
router.use(auth_middleware_1.authenticateToken);
// Main prescription routes
router.get('/', prescriptionController.getAllPrescriptions);
router.get('/active', prescriptionController.getActivePrescriptions);
router.get('/search', prescriptionController.searchPrescriptions);
router.get('/stats', prescriptionController.getPrescriptionStats);
router.get('/:id', prescriptionController.getPrescriptionById);
// Creating prescriptions (only doctors and admins)
router.post('/', auth_middleware_1.requireDoctorOrAdmin, prescriptionController.createPrescription);
// Updating prescriptions (only doctors and admins)
router.put('/:id', auth_middleware_1.requireDoctorOrAdmin, prescriptionController.updatePrescription);
router.patch('/:id/discontinue', auth_middleware_1.requireDoctorOrAdmin, prescriptionController.discontinuePrescription);
router.patch('/:id/complete', auth_middleware_1.requireDoctorOrAdmin, prescriptionController.completePrescription);
// Patient-specific routes (accessible by patients, doctors, and admins)
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);
// Doctor-specific routes (accessible by doctors and admins)
router.get('/doctor/:doctorId', (0, auth_middleware_1.requireRole)(User_model_1.UserRole.DOCTOR, User_model_1.UserRole.ADMIN), prescriptionController.getDoctorPrescriptions);
exports.default = router;
