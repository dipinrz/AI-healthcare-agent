import { Router } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authenticateToken, requireAdmin, requireDoctorOrAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const patientController = new PatientController();

// Public routes (with authentication)
router.get('/', authenticateToken, asyncHandler(patientController.getAllPatients));
router.get('/search', authenticateToken, asyncHandler(patientController.searchPatients));
router.get('/stats', authenticateToken, requireDoctorOrAdmin, asyncHandler(patientController.getPatientStats));

// Patient-specific routes
router.get('/:id', authenticateToken, asyncHandler(patientController.getPatientById));
router.get('/:id/summary', authenticateToken, asyncHandler(patientController.getPatientSummary));
router.get('/:id/appointments', authenticateToken, asyncHandler(patientController.getPatientAppointments));
router.get('/:id/prescriptions', authenticateToken, asyncHandler(patientController.getPatientPrescriptions));

// Admin-only routes
router.post('/', authenticateToken, requireAdmin, asyncHandler(patientController.createPatient));
router.put('/:id', authenticateToken, requireAdmin, asyncHandler(patientController.updatePatient));
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(patientController.deletePatient));

export default router;