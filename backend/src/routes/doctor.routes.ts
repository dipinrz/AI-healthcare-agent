import { Router } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authenticateToken, requireAdmin, requireDoctorOrAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const doctorController = new DoctorController();

// Public routes (with authentication)
router.get('/', authenticateToken, asyncHandler(doctorController.getAllDoctors));
router.get('/search', authenticateToken, asyncHandler(doctorController.searchDoctors));
router.get('/search/department', authenticateToken, asyncHandler(doctorController.fuzzySearchByDepartment));
router.get('/specializations', authenticateToken, asyncHandler(doctorController.getSpecializations));
router.get('/departments', authenticateToken, asyncHandler(doctorController.getDepartments));
router.get('/stats', authenticateToken, requireDoctorOrAdmin, asyncHandler(doctorController.getDoctorStats));

// Doctor-specific routes
router.get('/:id', authenticateToken, asyncHandler(doctorController.getDoctorById));
router.get('/:id/appointments', authenticateToken, asyncHandler(doctorController.getDoctorAppointments));
router.get('/:id/availability', authenticateToken, asyncHandler(doctorController.getDoctorAvailability));

// Doctor and Admin routes
router.put('/:id/availability', authenticateToken, requireDoctorOrAdmin, asyncHandler(doctorController.updateDoctorAvailability));

// Admin-only routes
router.post('/', authenticateToken, requireAdmin, asyncHandler(doctorController.createDoctor));
router.put('/:id', authenticateToken, requireAdmin, asyncHandler(doctorController.updateDoctor));
router.delete('/:id', authenticateToken, requireAdmin, asyncHandler(doctorController.deleteDoctor));

export default router;