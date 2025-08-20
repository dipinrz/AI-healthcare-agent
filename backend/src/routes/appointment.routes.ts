import { Router } from 'express';
import { AppointmentController } from '../controllers/appointment.controller';
import { authenticateToken, requireDoctorOrAdmin } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const appointmentController = new AppointmentController();

// All appointment routes require authentication
router.use(authenticateToken);

// General appointment routes
router.get('/', asyncHandler(appointmentController.getAllAppointments));
router.get('/upcoming', asyncHandler(appointmentController.getUpcomingAppointments));
router.get('/past', asyncHandler(appointmentController.getPastAppointments));
router.get('/stats', asyncHandler(appointmentController.getAppointmentStats));
router.get('/search', asyncHandler(appointmentController.searchAppointments));
router.get('/available-slots/:doctorId', asyncHandler(appointmentController.getAvailableSlots));

// Specific appointment operations
router.get('/:id', asyncHandler(appointmentController.getAppointmentById));
router.post('/', asyncHandler(appointmentController.createAppointment));
router.post('/book-slot', asyncHandler(appointmentController.bookSlotAppointment));
router.put('/:id', asyncHandler(appointmentController.updateAppointment));
router.put('/:id/cancel', asyncHandler(appointmentController.cancelAppointment));
router.put('/:id/reschedule', asyncHandler(appointmentController.rescheduleAppointment));

// Doctor-only operations
router.put('/:id/complete', requireDoctorOrAdmin, asyncHandler(appointmentController.completeAppointment));

// Patient-specific routes
router.get('/patient/:patientId', asyncHandler(appointmentController.getPatientAppointments));
router.put('/patient/:patientId/appointment/:appointmentId/cancel', asyncHandler(appointmentController.cancelPatientAppointment));
router.put('/patient/:patientId/appointment/:appointmentId/reschedule', asyncHandler(appointmentController.reschedulePatientAppointment));

// Doctor-specific routes
router.get('/doctor/:doctorId', asyncHandler(appointmentController.getDoctorAppointments));

export default router;