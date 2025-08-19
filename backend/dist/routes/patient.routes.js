"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const patient_controller_1 = require("../controllers/patient.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const patientController = new patient_controller_1.PatientController();
// Public routes (with authentication)
router.get('/', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(patientController.getAllPatients));
router.get('/search', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(patientController.searchPatients));
router.get('/stats', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(patientController.getPatientStats));
// Patient-specific routes
router.get('/:id', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(patientController.getPatientById));
router.get('/:id/appointments', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(patientController.getPatientAppointments));
router.get('/:id/prescriptions', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(patientController.getPatientPrescriptions));
// Admin-only routes
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(patientController.createPatient));
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(patientController.updatePatient));
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(patientController.deletePatient));
exports.default = router;
