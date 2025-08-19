"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const medication_controller_1 = require("../controllers/medication.controller");
const prescription_controller_1 = require("../controllers/prescription.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const medicationController = new medication_controller_1.MedicationController();
const prescriptionController = new prescription_controller_1.PrescriptionController();
// Public routes (with authentication)
router.get('/', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(medicationController.getAllMedications));
router.get('/search', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(medicationController.searchMedications));
router.get('/categories', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(medicationController.getMedicationCategories));
router.get('/:id', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(medicationController.getMedicationById));
// Doctor and Admin routes
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(medicationController.createMedication));
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(medicationController.updateMedication));
// Admin-only routes
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(medicationController.deleteMedication));
// Prescription routes (nested under medications)
router.get('/prescriptions/all', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(prescriptionController.getAllPrescriptions));
router.post('/prescriptions', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(prescriptionController.createPrescription));
router.put('/prescriptions/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(prescriptionController.updatePrescription));
exports.default = router;
