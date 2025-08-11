import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Appointment, AppointmentStatus, AppointmentType } from '../entities/Appointment';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { User } from '../entities/User';
import { DoctorAvailability } from '../entities/DoctorAvailability';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const appointmentRepository = AppDataSource.getRepository(Appointment);
const patientRepository = AppDataSource.getRepository(Patient);
const doctorRepository = AppDataSource.getRepository(Doctor);
const userRepository = AppDataSource.getRepository(User);
const availabilityRepository = AppDataSource.getRepository(DoctorAvailability);

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
      slotId,
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

    // Check availability using the new slot system
    let availabilitySlot = null;
    
    if (slotId) {
      // If slotId is provided, check that specific slot
      availabilitySlot = await availabilityRepository.findOne({
        where: { 
          slotId: parseInt(slotId),
          doctor: { id: doctorId }
        },
        relations: ['doctor']
      });

      if (!availabilitySlot) {
        return res.status(404).json({
          success: false,
          message: 'Availability slot not found'
        });
      }

      if (availabilitySlot.isBooked) {
        return res.status(409).json({
          success: false,
          message: 'This time slot is already booked'
        });
      }

      if (availabilitySlot.startTime.getTime() !== appointmentDateTime.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'Appointment date does not match the selected slot'
        });
      }
    } else {
      // If no slotId provided, find available slot for the requested time
      availabilitySlot = await availabilityRepository.findOne({
        where: {
          doctor: { id: doctorId },
          startTime: appointmentDateTime,
          isBooked: false
        },
        relations: ['doctor']
      });

      if (!availabilitySlot) {
        return res.status(409).json({
          success: false,
          message: 'Doctor is not available at this time'
        });
      }
    }

    // Mark the slot as booked
    availabilitySlot.isBooked = true;
    await availabilityRepository.save(availabilitySlot);

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
        slotId: availabilitySlot.slotId,
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

    // Find the old slot and release it
    const oldSlot = await availabilityRepository.findOne({
      where: {
        doctor: { id: appointment.doctor.id },
        startTime: appointment.appointmentDate,
        isBooked: true
      }
    });

    if (oldSlot) {
      oldSlot.isBooked = false;
      await availabilityRepository.save(oldSlot);
    }

    // Find and book the new slot
    const newSlot = await availabilityRepository.findOne({
      where: {
        doctor: { id: appointment.doctor.id },
        startTime: newDate,
        isBooked: false
      }
    });

    if (!newSlot) {
      return res.status(409).json({
        success: false,
        message: 'Doctor is not available at this time - no available slot'
      });
    }

    // Book the new slot
    newSlot.isBooked = true;
    await availabilityRepository.save(newSlot);

    // Update appointment
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

    // Find and release the booked slot
    const bookedSlot = await availabilityRepository.findOne({
      where: {
        doctor: { id: appointment.doctor.id },
        startTime: appointment.appointmentDate,
        isBooked: true
      }
    });

    if (bookedSlot) {
      bookedSlot.isBooked = false;
      await availabilityRepository.save(bookedSlot);
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

// Reschedule appointment using patient ID and new slot ID
router.put('/patient/:patientId/appointment/:appointmentId/reschedule', async (req: Request, res: Response) => {
  try {
    const { patientId, appointmentId } = req.params;
    const { newSlotId } = req.body;

    if (!newSlotId) {
      return res.status(400).json({
        success: false,
        message: 'New slot ID is required'
      });
    }

    // Verify patient exists
    const patient = await patientRepository.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get the appointment
    const appointment = await appointmentRepository.findOne({
      where: { 
        id: appointmentId,
        patient: { id: patientId }
      },
      relations: ['patient', 'doctor']
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found for this patient'
      });
    }

    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      return res.status(400).json({
        success: false,
        message: 'Can only reschedule scheduled appointments'
      });
    }

    // Get the new slot
    const newSlot = await availabilityRepository.findOne({
      where: { slotId: parseInt(newSlotId) },
      relations: ['doctor']
    });

    if (!newSlot) {
      return res.status(404).json({
        success: false,
        message: 'New slot not found'
      });
    }

    if (newSlot.isBooked) {
      return res.status(409).json({
        success: false,
        message: 'New slot is already booked'
      });
    }

    if (newSlot.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to past slots'
      });
    }

    // Must be same doctor
    if (newSlot.doctor.id !== appointment.doctor.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule to a different doctor'
      });
    }

    // Release old slot
    const oldSlot = await availabilityRepository.findOne({
      where: {
        doctor: { id: appointment.doctor.id },
        startTime: appointment.appointmentDate,
        isBooked: true
      }
    });

    if (oldSlot) {
      oldSlot.isBooked = false;
      await availabilityRepository.save(oldSlot);
    }

    // Book new slot
    newSlot.isBooked = true;
    await availabilityRepository.save(newSlot);

    // Update appointment
    appointment.appointmentDate = newSlot.startTime;
    await appointmentRepository.save(appointment);

    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      data: {
        appointmentId: appointment.id,
        oldSlotId: oldSlot?.slotId || null,
        newSlotId: newSlot.slotId,
        newAppointmentDate: appointment.appointmentDate,
        patient: {
          id: appointment.patient.id,
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`
        },
        doctor: {
          id: appointment.doctor.id,
          name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
        }
      }
    });
  } catch (error) {
    console.error('Reschedule appointment with patient ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule appointment'
    });
  }
});

// Cancel appointment using patient ID
router.put('/patient/:patientId/appointment/:appointmentId/cancel', async (req: Request, res: Response) => {
  try {
    const { patientId, appointmentId } = req.params;
    const { reason } = req.body; // Optional cancellation reason

    // Verify patient exists
    const patient = await patientRepository.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get the appointment
    const appointment = await appointmentRepository.findOne({
      where: { 
        id: appointmentId,
        patient: { id: patientId }
      },
      relations: ['patient', 'doctor']
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found for this patient'
      });
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

    // Find and release the booked slot
    const bookedSlot = await availabilityRepository.findOne({
      where: {
        doctor: { id: appointment.doctor.id },
        startTime: appointment.appointmentDate,
        isBooked: true
      }
    });

    if (bookedSlot) {
      bookedSlot.isBooked = false;
      await availabilityRepository.save(bookedSlot);
    }

    // Update appointment
    appointment.status = AppointmentStatus.CANCELLED;
    if (reason) {
      appointment.notes = (appointment.notes || '') + `\nCancellation reason: ${reason}`;
    }
    await appointmentRepository.save(appointment);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: {
        appointmentId: appointment.id,
        releasedSlotId: bookedSlot?.slotId || null,
        cancelledDate: new Date(),
        reason: reason || 'No reason provided',
        patient: {
          id: appointment.patient.id,
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`
        },
        doctor: {
          id: appointment.doctor.id,
          name: `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
        }
      }
    });
  } catch (error) {
    console.error('Cancel appointment with patient ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment'
    });
  }
});

// Book appointment using patient ID and slot ID
router.post('/book-slot', async (req: Request, res: Response) => {
  try {
    const {
      patientId,
      slotId,
      reason,
      symptoms,
      type = AppointmentType.CONSULTATION
    } = req.body;

    if (!patientId || !slotId || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID, slot ID, and reason are required'
      });
    }

    // Verify patient exists
    const patient = await patientRepository.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Get the availability slot
    const availabilitySlot = await availabilityRepository.findOne({
      where: { slotId: parseInt(slotId) },
      relations: ['doctor']
    });

    if (!availabilitySlot) {
      return res.status(404).json({
        success: false,
        message: 'Availability slot not found'
      });
    }

    if (availabilitySlot.isBooked) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is already booked'
      });
    }

    // Check if the slot time is in the future
    if (availabilitySlot.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book slots in the past'
      });
    }

    // Check for existing appointment conflicts for this patient
    const existingAppointment = await appointmentRepository.findOne({
      where: {
        patient: { id: patientId },
        appointmentDate: availabilitySlot.startTime,
        status: AppointmentStatus.SCHEDULED
      }
    });

    if (existingAppointment) {
      return res.status(409).json({
        success: false,
        message: 'Patient already has an appointment at this time'
      });
    }

    // Mark the slot as booked
    availabilitySlot.isBooked = true;
    await availabilityRepository.save(availabilitySlot);

    // Create the appointment
    const appointment = appointmentRepository.create({
      patient,
      doctor: availabilitySlot.doctor,
      appointmentDate: availabilitySlot.startTime,
      duration: 30, // Default 30 minutes
      type,
      reason,
      symptoms: symptoms || '',
      status: AppointmentStatus.SCHEDULED
    });

    await appointmentRepository.save(appointment);

    const savedAppointment = await appointmentRepository.findOne({
      where: { id: appointment.id },
      relations: ['patient', 'doctor']
    });

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully using slot',
      data: {
        appointmentId: savedAppointment!.id,
        slotId: availabilitySlot.slotId,
        appointmentDate: savedAppointment!.appointmentDate,
        duration: savedAppointment!.duration,
        status: savedAppointment!.status,
        type: savedAppointment!.type,
        reason: savedAppointment!.reason,
        symptoms: savedAppointment!.symptoms,
        patient: {
          id: savedAppointment!.patient.id,
          name: `${savedAppointment!.patient.firstName} ${savedAppointment!.patient.lastName}`,
          phone: savedAppointment!.patient.phone,
          email: savedAppointment!.patient.email
        },
        doctor: {
          id: savedAppointment!.doctor.id,
          name: `Dr. ${savedAppointment!.doctor.firstName} ${savedAppointment!.doctor.lastName}`,
          specialization: savedAppointment!.doctor.specialization,
          qualification: savedAppointment!.doctor.qualification,
          department: savedAppointment!.doctor.department,
          phone: savedAppointment!.doctor.phone
        },
        slot: {
          slotId: availabilitySlot.slotId,
          startTime: availabilitySlot.startTime.toISOString().replace('T', ' ').substring(0, 16),
          endTime: availabilitySlot.endTime.toISOString().replace('T', ' ').substring(0, 16),
          isBooked: availabilitySlot.isBooked
        }
      }
    });
  } catch (error) {
    console.error('Book appointment with slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book appointment'
    });
  }
});

// Get all appointments for a patient with optional filters
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params;
    const { appointmentDate, doctorId } = req.query;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required'
      });
    }

    // Verify patient exists
    const patient = await patientRepository.findOne({
      where: { id: patientId }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Build the query conditions
    const whereConditions: any = {
      patient: { id: patientId }
    };

    // Add optional filters
    if (doctorId) {
      whereConditions.doctor = { id: doctorId as string };
    }

    if (appointmentDate) {
      // Parse the date and create date range for the entire day
      const targetDate = new Date(appointmentDate as string);
      if (isNaN(targetDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid appointment date format'
        });
      }

      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      // Use query builder for date range
      const queryBuilder = appointmentRepository
        .createQueryBuilder('appointment')
        .leftJoinAndSelect('appointment.patient', 'patient')
        .leftJoinAndSelect('appointment.doctor', 'doctor')
        .where('appointment.patientId = :patientId', { patientId })
        .andWhere('appointment.appointmentDate >= :startOfDay', { startOfDay })
        .andWhere('appointment.appointmentDate <= :endOfDay', { endOfDay });

      if (doctorId) {
        queryBuilder.andWhere('appointment.doctorId = :doctorId', { doctorId });
      }

      const appointments = await queryBuilder
        .orderBy('appointment.appointmentDate', 'DESC')
        .getMany();

      const formattedAppointments = appointments.map(apt => ({
        appointmentId: apt.id,
        patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
        doctorId: apt.doctor.id,
        doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
        appointmentDate: apt.appointmentDate,
        status: apt.status,
        type: apt.type,
        reason: apt.reason
      }));

      return res.json({
        success: true,
        message: 'Patient appointments retrieved successfully',
        data: formattedAppointments,
        filters: {
          patientId,
          appointmentDate: appointmentDate as string,
          doctorId: doctorId as string || null
        }
      });
    }

    // Query without date filter
    const appointments = await appointmentRepository.find({
      where: whereConditions,
      relations: ['patient', 'doctor'],
      order: { appointmentDate: 'DESC' }
    });

    const formattedAppointments = appointments.map(apt => ({
      appointmentId: apt.id,
      patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      doctorId: apt.doctor.id,
      doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
      appointmentDate: apt.appointmentDate,
      status: apt.status,
      type: apt.type,
      reason: apt.reason
    }));

    res.json({
      success: true,
      message: 'Patient appointments retrieved successfully',
      data: formattedAppointments,
      filters: {
        patientId,
        appointmentDate: null,
        doctorId: doctorId as string || null
      }
    });

  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient appointments'
    });
  }
});

export default router;