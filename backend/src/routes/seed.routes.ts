import { Router } from 'express';
import { SeedController } from '../controllers/seed.controller';
import { authenticateToken, requireAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const seedController = new SeedController();

// All seed endpoints require admin authentication
router.use(authenticateToken, requireAdmin);

// Master seed operations
router.post('/all', asyncHandler(seedController.seedAll));
router.get('/status', asyncHandler(seedController.getSeedStatus));
router.post('/demo-scenario', asyncHandler(seedController.seedDemoScenario));

// Individual entity seeding
router.post('/doctors', asyncHandler(seedController.seedDoctors));
router.post('/patients', asyncHandler(seedController.seedPatients));
router.post('/medications', asyncHandler(seedController.seedMedications));
router.post('/appointments', asyncHandler(seedController.seedAppointments));
router.post('/prescriptions', asyncHandler(seedController.seedPrescriptions));
router.post('/health-records', asyncHandler(seedController.seedHealthRecords));
router.post('/doctor-availability', asyncHandler(seedController.seedDoctorAvailability));

// Dangerous operations - require double confirmation
router.delete('/all', asyncHandler(seedController.clearAllData));
router.delete('/entity/:entity', asyncHandler(seedController.resetEntity));

export default router;