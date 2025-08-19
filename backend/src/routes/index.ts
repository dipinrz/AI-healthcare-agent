import { Router } from 'express';
import authRoutes from './auth.routes';
import patientRoutes from './patient.routes';
import doctorRoutes from './doctor.routes';
import appointmentRoutes from './appointment.routes';
import medicationRoutes from './medication.routes';
import prescriptionRoutes from './prescription.routes';
import doctorAvailabilityRoutes from './doctorAvailability.routes';
import seedRoutes from './seed.routes';
// import healthRecordRoutes from './healthRecord.routes';
// import chatRoutes from './chat.routes';

const router = Router();

// Mount all routes
router.use('/auth', authRoutes);
router.use('/patients', patientRoutes);
router.use('/doctors', doctorRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/medications', medicationRoutes);
router.use('/prescriptions', prescriptionRoutes);
router.use('/doctor-availability', doctorAvailabilityRoutes);
router.use('/seed', seedRoutes);
// router.use('/health-records', healthRecordRoutes);
// router.use('/chat', chatRoutes);

// API documentation route
router.get('/', (req, res) => {
  res.json({
    message: 'AI Healthcare API',
    version: '1.0.0',
    documentation: '/api/docs',
    environment: process.env.NODE_ENV || 'development',
    routes: {
      auth: '/api/auth',
      patients: '/api/patients',
      doctors: '/api/doctors',
      appointments: '/api/appointments',
      medications: '/api/medications',
      prescriptions: '/api/prescriptions',
      doctorAvailability: '/api/doctor-availability',
      seed: '/api/seed',
      // healthRecords: '/api/health-records',
      // chat: '/api/chat',
    },
  });
});

export default router;