import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Appointment, AppointmentStatus, AppointmentType } from '../entities/Appointment';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { User } from '../entities/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const appointmentRepository = AppDataSource.getRepository(Appointment);
const patientRepository = AppDataSource.getRepository(Patient);
const doctorRepository = AppDataSource.getRepository(Doctor);
const userRepository = AppDataSource.getRepository(User);

router.use(authenticateToken);

// Get appointments (for current user)
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let appointments: Appointment[] = [];

    if (user.role === 'patient') {
      const patientId = user.patientId;
      if (!patientId) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found'
        });
      }

      appointments = await appointmentRepository.find({
        where: { patient: { id: patientId } },
        relations: ['patient', 'doctor'],
        order: { appointmentDate: 'DESC' }
      });
    } else if (user.role === 'doctor') {
      const doctorId = user.doctorId;
      if (!doctorId) {
        return res.status(404).json({
          success: false,
          message: 'Doctor profile not found'
        });
      }

      appointments = await appointmentRepository.find({
        where: { doctor: { id: doctorId } },
        relations: ['patient', 'doctor'],
        order: { appointmentDate: 'DESC' }
      });
    } else {
      // For admin users, they should still not see all appointments by default
      // Admin should use specific endpoints to manage appointments
      return res.status(403).json({
        success: false,
        message: 'Admin users should use specific management endpoints'
      });
    }

    const formattedAppointments = appointments.map(apt => ({
      id: apt.id,
      appointmentDate: apt.appointmentDate,
      duration: apt.duration,
      status: apt.status,
      type: apt.type,
      reason: apt.reason,
      notes: apt.notes,
      symptoms: apt.symptoms,
      diagnosis: apt.diagnosis,
      treatment: apt.treatment,
      followUpInstructions: apt.followUpInstructions,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt,
      patient: {
        id: apt.patient.id,
        firstName: apt.patient.firstName,
        lastName: apt.patient.lastName,
        phone: apt.patient.phone,
        email: apt.patient.email
      },
      doctor: {
        id: apt.doctor.id,
        firstName: apt.doctor.firstName,
        lastName: apt.doctor.lastName,
        specialization: apt.doctor.specialization,
        qualification: apt.doctor.qualification,
        department: apt.doctor.department,
        phone: apt.doctor.phone,
        email: apt.doctor.email
      }
    }));

    res.json({
      success: true,
      data: formattedAppointments
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments'
    });
  }
});

// Create appointment
router.post('/', async (req: Request, res: Response) => {
  try {
    const {
      doctorId,
      appointmentDate,
      duration = 30,
      type = AppointmentType.CONSULTATION,
      reason,
      symptoms
    } = req.body;

    if (!doctorId || !appointmentDate || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID, appointment date, and reason are required'
      });
    }

    const user = (req as any).user;
    const patientId = user.patientId;
    
    if (!patientId) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const patient = await patientRepository.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    const doctor = await doctorRepository.findOne({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const appointmentDateTime = new Date(appointmentDate);
    if (appointmentDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Appointment date must be in the future'
      });
    }

    // Check for conflicts
    const conflictingAppointment = await appointmentRepository.findOne({
      where: {
        doctor: { id: doctorId },
        appointmentDate: appointmentDateTime,
        status: AppointmentStatus.SCHEDULED
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Doctor is not available at this time'
      });
    }

    const appointment = appointmentRepository.create({
      patient,
      doctor,
      appointmentDate: appointmentDateTime,
      duration,
      type,
      reason,
      symptoms,
      status: AppointmentStatus.SCHEDULED
    });

    await appointmentRepository.save(appointment);

    const savedAppointment = await appointmentRepository.findOne({
      where: { id: appointment.id },
      relations: ['patient', 'doctor']
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      data: {
        id: savedAppointment!.id,
        appointmentDate: savedAppointment!.appointmentDate,
        duration: savedAppointment!.duration,
        status: savedAppointment!.status,
        type: savedAppointment!.type,
        reason: savedAppointment!.reason,
        symptoms: savedAppointment!.symptoms,
        patient: {
          id: savedAppointment!.patient.id,
          firstName: savedAppointment!.patient.firstName,
          lastName: savedAppointment!.patient.lastName
        },
        doctor: {
          id: savedAppointment!.doctor.id,
          firstName: savedAppointment!.doctor.firstName,
          lastName: savedAppointment!.doctor.lastName,
          specialization: savedAppointment!.doctor.specialization
        }
      }
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create appointment'
    });
  }
});

// Reschedule appointment
router.put('/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { appointmentDate } = req.body;

    if (!appointmentDate) {
      return res.status(400).json({
        success: false,
        message: 'New appointment date is required'
      });
    }

    const user = (req as any).user;
    const appointment = await appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor']
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions - only patient can reschedule their own appointments
    if (user.role === 'patient') {
      const patientId = user.patientId;
      if (!patientId || appointment.patient.id !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      return res.status(400).json({
        success: false,
        message: 'Can only reschedule scheduled appointments'
      });
    }

    const newDate = new Date(appointmentDate);
    if (newDate <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'New appointment date must be in the future'
      });
    }

    // Check for conflicts
    const conflictingAppointment = await appointmentRepository.findOne({
      where: {
        doctor: { id: appointment.doctor.id },
        appointmentDate: newDate,
        status: AppointmentStatus.SCHEDULED
      }
    });

    if (conflictingAppointment && conflictingAppointment.id !== appointment.id) {
      return res.status(409).json({
        success: false,
        message: 'Doctor is not available at this time'
      });
    }

    appointment.appointmentDate = newDate;
    await appointmentRepository.save(appointment);

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment'
    });
  }
});

// Cancel appointment
router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const appointment = await appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor']
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions
    if (user.role === 'patient') {
      const patientId = user.patientId;
      if (!patientId || appointment.patient.id !== patientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (user.role === 'doctor') {
      const doctorId = user.doctorId;
      if (!doctorId || appointment.doctor.id !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointments'
      });
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await appointmentRepository.save(appointment);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: appointment
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
});

// Get available slots for a doctor
router.get('/available-slots/:doctorId', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const doctor = await doctorRepository.findOne({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const selectedDate = new Date(date as string);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // For PostgreSQL, we need to use Between or MoreThanOrEqual/LessThanOrEqual
    const bookedAppointments = await appointmentRepository
      .createQueryBuilder('appointment')
      .where('appointment.doctorId = :doctorId', { doctorId })
      .andWhere('appointment.appointmentDate >= :startOfDay', { startOfDay })
      .andWhere('appointment.appointmentDate <= :endOfDay', { endOfDay })
      .andWhere('appointment.status = :status', { status: AppointmentStatus.SCHEDULED })
      .getMany();

    const workingHours = {
      start: 9,
      end: 17,
      slotDuration: 30
    };

    const availableSlots = [];
    for (let hour = workingHours.start; hour < workingHours.end; hour++) {
      for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
        const slotTime = new Date(selectedDate);
        slotTime.setHours(hour, minute, 0, 0);

        if (slotTime <= new Date()) continue;

        const isBooked = bookedAppointments.some(apt => 
          apt.appointmentDate.getTime() === slotTime.getTime()
        );

        if (!isBooked) {
          availableSlots.push({
            time: slotTime,
            displayTime: slotTime.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })
          });
        }
      }
    }

    res.json({
      success: true,
      data: availableSlots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available slots'
    });
  }
});

// Complete appointment
router.put('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { diagnosis, treatment, followUpInstructions, notes } = req.body;
    const user = (req as any).user;

    const appointment = await appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor']
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check permissions - only doctor can complete their own appointments
    if (user.role === 'doctor') {
      const doctorId = user.doctorId;
      if (!doctorId || appointment.doctor.id !== doctorId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already completed'
      });
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return res.status(400).json({
        success: false,
        message: 'Cannot complete cancelled appointments'
      });
    }

    // Update appointment with completion details
    appointment.status = AppointmentStatus.COMPLETED;
    if (diagnosis) appointment.diagnosis = diagnosis;
    if (treatment) appointment.treatment = treatment;
    if (followUpInstructions) appointment.followUpInstructions = followUpInstructions;
    if (notes) appointment.notes = notes;

    await appointmentRepository.save(appointment);

    const completedAppointment = await appointmentRepository.findOne({
      where: { id },
      relations: ['patient', 'doctor']
    });

    res.json({
      success: true,
      message: 'Appointment completed successfully',
      data: {
        id: completedAppointment!.id,
        appointmentDate: completedAppointment!.appointmentDate,
        duration: completedAppointment!.duration,
        status: completedAppointment!.status,
        type: completedAppointment!.type,
        reason: completedAppointment!.reason,
        symptoms: completedAppointment!.symptoms,
        diagnosis: completedAppointment!.diagnosis,
        treatment: completedAppointment!.treatment,
        followUpInstructions: completedAppointment!.followUpInstructions,
        notes: completedAppointment!.notes,
        createdAt: completedAppointment!.createdAt,
        updatedAt: completedAppointment!.updatedAt,
        patient: {
          id: completedAppointment!.patient.id,
          firstName: completedAppointment!.patient.firstName,
          lastName: completedAppointment!.patient.lastName,
          phone: completedAppointment!.patient.phone,
          email: completedAppointment!.patient.email
        },
        doctor: {
          id: completedAppointment!.doctor.id,
          firstName: completedAppointment!.doctor.firstName,
          lastName: completedAppointment!.doctor.lastName,
          specialization: completedAppointment!.doctor.specialization,
          qualification: completedAppointment!.doctor.qualification,
          department: completedAppointment!.doctor.department,
          phone: completedAppointment!.doctor.phone,
          email: completedAppointment!.doctor.email
        }
      }
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete appointment'
    });
  }
});

export default router;