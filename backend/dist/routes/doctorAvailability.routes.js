"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const doctorAvailability_controller_1 = require("../controllers/doctorAvailability.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const doctorAvailabilityController = new doctorAvailability_controller_1.DoctorAvailabilityController();
// Public routes (with authentication)
router.get('/available-doctors', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.getAvailableDoctors));
router.get('/stats', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.getAvailabilityStats));
// Doctor-specific routes
router.get('/doctor/:doctorId/slots', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.getDoctorSlots));
router.post('/doctor/:doctorId/generate-slots', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.generateSlotsForDoctor));
// Slot management
router.get('/slot/:slotId', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.getSlotById));
router.put('/slot/:slotId/book', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.bookSlot));
router.put('/slot/:slotId/release', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.releaseSlot));
router.put('/slot/:slotId/availability', auth_middleware_1.authenticateToken, auth_middleware_1.requireDoctorOrAdmin, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.updateSlotAvailability));
// Admin-only routes
router.post('/generate-all-slots', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.generateSlotsForAllDoctors));
router.post('/seed-data', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.generateSlotsForAllDoctors)); // Legacy compatibility
router.post('/public-seed-data', (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.generateSlotsForAllDoctors)); // Temporary public endpoint
router.delete('/clear-old-slots', auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin, (0, error_middleware_1.asyncHandler)(doctorAvailabilityController.clearOldSlots));
exports.default = router;
