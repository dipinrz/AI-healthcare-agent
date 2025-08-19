"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctor_controller_1 = require("../controllers/doctor.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const doctorController = new doctor_controller_1.DoctorController();
// Public routes (with authentication)
router.get('/', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.getAllDoctors));
router.get('/search', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.searchDoctors));
router.get('/search/department', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.fuzzySearchByDepartment));
router.get('/specializations', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.getSpecializations));
router.get('/departments', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.getDepartments));
router.get('/stats', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(doctorController.getDoctorStats));
// Doctor-specific routes
router.get('/:id', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.getDoctorById));
router.get('/:id/appointments', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.getDoctorAppointments));
router.get('/:id/availability', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorController.getDoctorAvailability));
// Doctor and Admin routes
router.put('/:id/availability', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(doctorController.updateDoctorAvailability));
// Admin-only routes
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(doctorController.createDoctor));
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(doctorController.updateDoctor));
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(doctorController.deleteDoctor));
exports.default = router;
