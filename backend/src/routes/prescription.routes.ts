import { Router } from 'express';
import { PrescriptionController } from '../controllers/prescription.controller';
import { authenticateToken, requireDoctorOrAdmin, requireRole } from '../middlewares/auth.middleware';
import { UserRole } from '../models/User.model';

const router = Router();
const prescriptionController = new PrescriptionController();

// Apply authentication to all routes
router.use(authenticateToken);

// Main prescription routes
router.get('/', prescriptionController.getAllPrescriptions);
router.get('/active', prescriptionController.getActivePrescriptions);
router.get('/search', prescriptionController.searchPrescriptions);
router.get('/stats', prescriptionController.getPrescriptionStats);
router.get('/:id', prescriptionController.getPrescriptionById);

// Creating prescriptions (only doctors and admins)
router.post('/', requireDoctorOrAdmin, prescriptionController.createPrescription);

// Updating prescriptions (only doctors and admins)
router.put('/:id', requireDoctorOrAdmin, prescriptionController.updatePrescription);
router.patch('/:id/discontinue', requireDoctorOrAdmin, prescriptionController.discontinuePrescription);
router.patch('/:id/complete', requireDoctorOrAdmin, prescriptionController.completePrescription);

// Patient-specific routes (accessible by patients, doctors, and admins)
router.get('/patient/:patientId', prescriptionController.getPatientPrescriptions);

// Doctor-specific routes (accessible by doctors and admins)
router.get('/doctor/:doctorId', requireRole(UserRole.DOCTOR, UserRole.ADMIN), prescriptionController.getDoctorPrescriptions);

export default router;