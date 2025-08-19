"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const appointment_controller_1 = require("../controllers/appointment.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const appointmentController = new appointment_controller_1.AppointmentController();
// All appointment routes require authentication
router.use(auth_middleware_1.authenticateToken);
// General appointment routes
router.get('/', (0, error_middleware_1.asyncHandler)(appointmentController.getAllAppointments));
router.get('/upcoming', (0, error_middleware_1.asyncHandler)(appointmentController.getUpcomingAppointments));
router.get('/past', (0, error_middleware_1.asyncHandler)(appointmentController.getPastAppointments));
router.get('/stats', (0, error_middleware_1.asyncHandler)(appointmentController.getAppointmentStats));
router.get('/search', (0, error_middleware_1.asyncHandler)(appointmentController.searchAppointments));
// Specific appointment operations
router.get('/:id', (0, error_middleware_1.asyncHandler)(appointmentController.getAppointmentById));
router.post('/', (0, error_middleware_1.asyncHandler)(appointmentController.createAppointment));
router.put('/:id', (0, error_middleware_1.asyncHandler)(appointmentController.updateAppointment));
router.put('/:id/cancel', (0, error_middleware_1.asyncHandler)(appointmentController.cancelAppointment));
router.put('/:id/reschedule', (0, error_middleware_1.asyncHandler)(appointmentController.rescheduleAppointment));
// Doctor-only operations
router.put('/:id/complete', auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(appointmentController.completeAppointment));
// Patient-specific routes
router.get('/patient/:patientId', (0, error_middleware_1.asyncHandler)(appointmentController.getPatientAppointments));
// Doctor-specific routes
router.get('/doctor/:doctorId', (0, error_middleware_1.asyncHandler)(appointmentController.getDoctorAppointments));
exports.default = router;
