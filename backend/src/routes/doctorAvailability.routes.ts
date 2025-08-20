import { Router } from 'express';
import { DoctorAvailabilityController } from '../controllers/doctorAvailability.controller';
import { authenticateToken, requireAdmin, requireDoctorOrAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const doctorAvailabilityController = new DoctorAvailabilityController();

// Public routes (with authentication)
router.get('/available-doctors', authenticateToken, asyncHandler(doctorAvailabilityController.getAvailableDoctors));
router.get('/stats', authenticateToken, asyncHandler(doctorAvailabilityController.getAvailabilityStats));

// Doctor-specific routes
router.get('/doctor/:doctorId/slots', asyncHandler(doctorAvailabilityController.getDoctorSlots));
router.post('/doctor/:doctorId/generate-slots', authenticateToken, requireDoctorOrAdmin, asyncHandler(doctorAvailabilityController.generateSlotsForDoctor));

// Slot management
router.get('/slot/:slotId', authenticateToken, asyncHandler(doctorAvailabilityController.getSlotById));
router.put('/slot/:slotId/book', authenticateToken, asyncHandler(doctorAvailabilityController.bookSlot));
router.put('/slot/:slotId/release', authenticateToken, asyncHandler(doctorAvailabilityController.releaseSlot));
router.put('/slot/:slotId/availability', authenticateToken, requireDoctorOrAdmin, asyncHandler(doctorAvailabilityController.updateSlotAvailability));

// Admin-only routes
router.post('/generate-all-slots', authenticateToken, requireAdmin, asyncHandler(doctorAvailabilityController.generateSlotsForAllDoctors));
router.post('/seed-data', authenticateToken,
    //  requireAdmin,
      asyncHandler(doctorAvailabilityController.generateSlotsForAllDoctors)); // Legacy compatibility
router.post('/public-seed-data', asyncHandler(doctorAvailabilityController.generateSlotsForAllDoctors)); // Temporary public endpoint
router.delete('/clear-old-slots', authenticateToken, requireAdmin, asyncHandler(doctorAvailabilityController.clearOldSlots));

export default router;