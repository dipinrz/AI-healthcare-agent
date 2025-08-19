import { Router } from 'express';
import { MedicationController } from '../controllers/medication.controller';
import { PrescriptionController } from '../controllers/prescription.controller';
import { authenticateToken, requireAdmin, requireDoctorOrAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const medicationController = new MedicationController();
const prescriptionController = new PrescriptionController();

// Public routes (with authentication)
router.get('/', authenticateToken, asyncHandler(medicationController.getAllMedications));
router.get('/search', authenticateToken, asyncHandler(medicationController.searchMedications));
router.get('/categories', authenticateToken, asyncHandler(medicationController.getMedicationCategories));
router.get('/:id', authenticateToken, asyncHandler(medicationController.getMedicationById));

// Doctor and Admin routes
router.post('/', authenticateToken, requireDoctorOrAdmin, asyncHandler(medicationController.createMedication));
router.put('/:id', authenticateToken, requireDoctorOrAdmin, asyncHandler(medicationController.updateMedication));

// Admin-only routes
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(medicationController.deleteMedication));

// Prescription routes (nested under medications)
router.get('/prescriptions/all', authenticateToken, asyncHandler(prescriptionController.getAllPrescriptions));
router.post('/prescriptions', authenticateToken, requireDoctorOrAdmin, asyncHandler(prescriptionController.createPrescription));
router.put('/prescriptions/:id', authenticateToken, requireDoctorOrAdmin, asyncHandler(prescriptionController.updatePrescription));

export default router;