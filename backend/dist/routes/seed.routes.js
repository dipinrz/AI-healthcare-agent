"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const seed_controller_1 = require("../controllers/seed.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const seedController = new seed_controller_1.SeedController();
// All seed endpoints require admin authentication
router.use(auth_middleware_1.authenticateToken, auth_middleware_1.requireAdmin);
// Master seed operations
router.post('/all', (0, error_middleware_1.asyncHandler)(seedController.seedAll));
router.get('/status', (0, error_middleware_1.asyncHandler)(seedController.getSeedStatus));
router.post('/demo-scenario', (0, error_middleware_1.asyncHandler)(seedController.seedDemoScenario));
// Individual entity seeding
router.post('/doctors', (0, error_middleware_1.asyncHandler)(seedController.seedDoctors));
router.post('/patients', (0, error_middleware_1.asyncHandler)(seedController.seedPatients));
router.post('/medications', (0, error_middleware_1.asyncHandler)(seedController.seedMedications));
router.post('/appointments', (0, error_middleware_1.asyncHandler)(seedController.seedAppointments));
router.post('/prescriptions', (0, error_middleware_1.asyncHandler)(seedController.seedPrescriptions));
router.post('/health-records', (0, error_middleware_1.asyncHandler)(seedController.seedHealthRecords));
router.post('/doctor-availability', (0, error_middleware_1.asyncHandler)(seedController.seedDoctorAvailability));
// Dangerous operations - require double confirmation
router.delete('/all', (0, error_middleware_1.asyncHandler)(seedController.clearAllData));
router.delete('/entity/:entity', (0, error_middleware_1.asyncHandler)(seedController.resetEntity));
exports.default = router;
