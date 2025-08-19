import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorAvailabilityRepository } from '../repositories/doctorAvailability.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { Appointment, AppointmentStatus, AppointmentType } from '../models/Appointment.model';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';
import { UserRole } from '../models/User.model';

export interface AppointmentFilters {
  status?: string;
  doctorId?: string;
  patientId?: string;
  startDate?: Date;
  endDate?: Date;
  type?: string;
}

export interface CreateAppointmentData {
  doctorId: string;
  patientId?: string;
  appointmentDate: Date;
  reason: string;
  type: string;
  slotId?: number;
}

export interface UpdateAppointmentData {
  appointmentDate?: Date;
  reason?: string;
  type?: string;
  status?: string;
  notes?: string;
  diagnosis?: string;
}

export interface CompletionData {
  diagnosis?: string;
  notes?: string;
  prescriptions?: any[];
}

export class AppointmentService {
  private appointmentRepository = new AppointmentRepository();
  private doctorAvailabilityRepository = new DoctorAvailabilityRepository();
  private patientRepository = new PatientRepository();
  private doctorRepository = new DoctorRepository();

  async getAllAppointments(
    filters: AppointmentFilters,
    page: number = 1,
    limit: number = 10,
    userRole: UserRole,
    userId: string
  ) {
    try {
      logger.info('Getting all appointments with filters:', filters);

      let appointments: Appointment[];

      // Apply role-based filtering
      if (userRole === UserRole.PATIENT) {
        appointments = await this.appointmentRepository.findByPatientId(userId, filters);
      } else if (userRole === UserRole.DOCTOR) {
        appointments = await this.appointmentRepository.findByDoctorId(userId, filters);
      } else {
        // Admin can see all appointments
        appointments = await this.appointmentRepository.findAll({
          relations: ['patient', 'doctor'],
          order: { appointmentDate: 'DESC' },
        });
      }

      // Apply additional filters
      if (filters.doctorId && userRole === UserRole.ADMIN) {
        appointments = appointments.filter(apt => apt.doctor.id === filters.doctorId);
      }

      if (filters.patientId && userRole === UserRole.ADMIN) {
        appointments = appointments.filter(apt => apt.patient.id === filters.patientId);
      }

      if (filters.status) {
        appointments = appointments.filter(apt => apt.status === filters.status);
      }

      if (filters.type) {
        appointments = appointments.filter(apt => apt.type === filters.type);
      }

      const total = appointments.length;
      const paginatedAppointments = appointments.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedAppointments,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all appointments error:', error);
      throw error;
    }
  }

  async getAppointmentById(
    id: string,
    userRole: UserRole,
    userId: string
  ): Promise<Appointment> {
    try {
      const appointment = await this.appointmentRepository.findById(id, {
        relations: ['patient', 'doctor'],
      });
      
      if (!appointment) {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
      }

      // Check permissions
      if (userRole === UserRole.PATIENT && appointment.patient.id !== userId) {
        throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
      }

      if (userRole === UserRole.DOCTOR && appointment.doctor.id !== userId) {
        throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
      }

      return appointment;
    } catch (error) {
      logger.error('Get appointment by ID error:', error);
      throw error;
    }
  }

  async createAppointment(
    appointmentData: CreateAppointmentData,
    user: { userId: string; role: UserRole; patientId?: string }
  ): Promise<Appointment> {
    try {
      const { doctorId, patientId, appointmentDate, reason, type, slotId } = appointmentData;

      // Determine patient ID
      let finalPatientId = patientId;
      if (user.role === UserRole.PATIENT) {
        finalPatientId = user.patientId || user.userId;
      }

      if (!finalPatientId) {
        throw new Error(MESSAGES.VALIDATION.PATIENT_ID_REQUIRED);
      }

      // Validate doctor exists
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      // Validate patient exists
      const patient = await this.patientRepository.findById(finalPatientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Check if appointment is in the future
      if (appointmentDate <= new Date()) {
        throw new Error(MESSAGES.ERROR.PAST_APPOINTMENT_TIME);
      }

      // Book the slot if slotId is provided
      if (slotId) {
        const slot = await this.doctorAvailabilityRepository.findBySlotId(slotId);
        if (!slot) {
          throw new Error(MESSAGES.ERROR.SLOT_NOT_AVAILABLE);
        }

        if (slot.isBooked) {
          throw new Error(MESSAGES.ERROR.SLOT_ALREADY_BOOKED);
        }

        if (slot.doctor.id !== doctorId) {
          throw new Error('Slot does not belong to the specified doctor');
        }

        // Book the slot
        await this.doctorAvailabilityRepository.bookSlot(slotId);
      }

      // Create appointment
      const appointment = await this.appointmentRepository.create({
        patient,
        doctor,
        appointmentDate,
        reason,
        type: type as AppointmentType,
        status: AppointmentStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Appointment created successfully:', appointment.id);
      return appointment;
    } catch (error) {
      logger.error('Create appointment error:', error);
      throw error;
    }
  }

  async updateAppointment(
    id: string,
    updateData: UpdateAppointmentData,
    userRole: UserRole,
    userId: string
  ): Promise<Appointment> {
    try {
      const appointment = await this.getAppointmentById(id, userRole, userId);

      // Only allow updates to scheduled appointments
      if (appointment.status !== 'scheduled') {
        throw new Error('Only scheduled appointments can be updated');
      }

      const updatedAppointment = await this.appointmentRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      } as any);

      if (!updatedAppointment) {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
      }

      logger.info('Appointment updated successfully:', id);
      return updatedAppointment;
    } catch (error) {
      logger.error('Update appointment error:', error);
      throw error;
    }
  }

  async cancelAppointment(
    id: string,
    reason: string,
    userRole: UserRole,
    userId: string
  ): Promise<Appointment> {
    try {
      const appointment = await this.getAppointmentById(id, userRole, userId);

      if (appointment.status === 'cancelled') {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_ALREADY_CANCELLED);
      }

      if (appointment.status === 'completed') {
        throw new Error(MESSAGES.ERROR.CANNOT_CANCEL_COMPLETED);
      }

      // Release the slot if there's a linked availability slot
      // Note: You'd need to track slotId in appointment or find by time/doctor
      const availabilitySlots = await this.doctorAvailabilityRepository.findByDoctorId(
        appointment.doctor.id,
        {
          startDate: appointment.appointmentDate,
          endDate: appointment.appointmentDate,
        }
      );

      const matchingSlot = availabilitySlots.find(slot => 
        slot.startTime.getTime() === appointment.appointmentDate.getTime() && slot.isBooked
      );

      if (matchingSlot) {
        await this.doctorAvailabilityRepository.releaseSlot(matchingSlot.slotId);
      }

      const updatedAppointment = await this.appointmentRepository.update(id, {
        status: AppointmentStatus.CANCELLED,
        notes: reason ? `Cancelled: ${reason}` : 'Appointment cancelled',
        updatedAt: new Date(),
      });

      if (!updatedAppointment) {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
      }

      logger.info('Appointment cancelled successfully:', id);
      return updatedAppointment;
    } catch (error) {
      logger.error('Cancel appointment error:', error);
      throw error;
    }
  }

  async rescheduleAppointment(
    id: string,
    newDate: Date,
    newSlotId: number | undefined,
    userRole: UserRole,
    userId: string
  ): Promise<Appointment> {
    try {
      const appointment = await this.getAppointmentById(id, userRole, userId);

      if (appointment.status !== 'scheduled') {
        throw new Error('Only scheduled appointments can be rescheduled');
      }

      if (newDate <= new Date()) {
        throw new Error(MESSAGES.ERROR.PAST_APPOINTMENT_TIME);
      }

      // Release old slot
      const oldSlots = await this.doctorAvailabilityRepository.findByDoctorId(
        appointment.doctor.id,
        {
          startDate: appointment.appointmentDate,
          endDate: appointment.appointmentDate,
        }
      );

      const oldMatchingSlot = oldSlots.find(slot => 
        slot.startTime.getTime() === appointment.appointmentDate.getTime() && slot.isBooked
      );

      if (oldMatchingSlot) {
        await this.doctorAvailabilityRepository.releaseSlot(oldMatchingSlot.slotId);
      }

      // Book new slot if provided
      if (newSlotId) {
        const newSlot = await this.doctorAvailabilityRepository.findBySlotId(newSlotId);
        if (!newSlot) {
          throw new Error(MESSAGES.ERROR.SLOT_NOT_AVAILABLE);
        }

        if (newSlot.isBooked) {
          throw new Error(MESSAGES.ERROR.SLOT_ALREADY_BOOKED);
        }

        if (newSlot.doctor.id !== appointment.doctor.id) {
          throw new Error('Cannot reschedule to a different doctor');
        }

        await this.doctorAvailabilityRepository.bookSlot(newSlotId);
      }

      const updatedAppointment = await this.appointmentRepository.update(id, {
        appointmentDate: newDate,
        updatedAt: new Date(),
      });

      if (!updatedAppointment) {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
      }

      logger.info('Appointment rescheduled successfully:', id);
      return updatedAppointment;
    } catch (error) {
      logger.error('Reschedule appointment error:', error);
      throw error;
    }
  }

  async completeAppointment(
    id: string,
    completionData: CompletionData,
    userRole: UserRole,
    userId: string
  ): Promise<Appointment> {
    try {
      if (userRole !== UserRole.DOCTOR && userRole !== UserRole.ADMIN) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      const appointment = await this.getAppointmentById(id, userRole, userId);

      if (appointment.status === 'completed') {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_ALREADY_COMPLETED);
      }

      if (appointment.status === 'cancelled') {
        throw new Error(MESSAGES.ERROR.CANNOT_COMPLETE_CANCELLED);
      }

      const updatedAppointment = await this.appointmentRepository.update(id, {
        status: AppointmentStatus.COMPLETED,
        diagnosis: completionData.diagnosis,
        notes: completionData.notes,
        updatedAt: new Date(),
      });

      if (!updatedAppointment) {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
      }

      logger.info('Appointment completed successfully:', id);
      return updatedAppointment;
    } catch (error) {
      logger.error('Complete appointment error:', error);
      throw error;
    }
  }

  async getUpcomingAppointments(
    userRole: UserRole,
    userId: string,
    limit: number = 10
  ): Promise<Appointment[]> {
    try {
      return await this.appointmentRepository.findUpcoming(userId, userRole.toLowerCase(), limit);
    } catch (error) {
      logger.error('Get upcoming appointments error:', error);
      throw error;
    }
  }

  async getPastAppointments(
    userRole: UserRole,
    userId: string,
    limit: number = 10
  ): Promise<Appointment[]> {
    try {
      return await this.appointmentRepository.findPast(userId, userRole.toLowerCase(), limit);
    } catch (error) {
      logger.error('Get past appointments error:', error);
      throw error;
    }
  }

  async searchAppointments(
    searchTerm: string,
    userRole: UserRole,
    userId: string
  ): Promise<Appointment[]> {
    try {
      return await this.appointmentRepository.searchAppointments(
        searchTerm,
        userId,
        userRole.toLowerCase()
      );
    } catch (error) {
      logger.error('Search appointments error:', error);
      throw error;
    }
  }

  async getAppointmentStats(userRole: UserRole, userId: string) {
    try {
      return await this.appointmentRepository.getAppointmentStats(userId, userRole.toLowerCase());
    } catch (error) {
      logger.error('Get appointment stats error:', error);
      throw error;
    }
  }

  async getPatientAppointments(patientId: string, filters: AppointmentFilters = {}) {
    try {
      return await this.appointmentRepository.findByPatientId(patientId, filters);
    } catch (error) {
      logger.error('Get patient appointments error:', error);
      throw error;
    }
  }

  async getDoctorAppointments(doctorId: string, filters: AppointmentFilters = {}) {
    try {
      return await this.appointmentRepository.findByDoctorId(doctorId, filters);
    } catch (error) {
      logger.error('Get doctor appointments error:', error);
      throw error;
    }
  }

  async bookSlotAppointment(data: {
    patientId: string;
    slotId: number;
    reason: string;
    symptoms?: string;
    type?: string;
  }) {
    try {
      const { patientId, slotId, reason, symptoms, type } = data;

      // Verify patient exists
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(MESSAGES.ERROR.PATIENT_NOT_FOUND);
      }

      // Get the slot details
      const slot = await this.doctorAvailabilityRepository.findBySlotId(slotId);
      if (!slot) {
        throw new Error('Time slot not found');
      }

      if (slot.isBooked) {
        throw new Error('This time slot is already booked');
      }

      // Verify doctor exists
      if (!slot.doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      // Create the appointment
      const appointmentData = {
        patientId,
        doctorId: slot.doctor.id,
        appointmentDate: slot.startTime,
        duration: 30, // Default 30 minutes
        status: AppointmentStatus.SCHEDULED,
        type: (type as AppointmentType) || AppointmentType.CONSULTATION,
        reason,
        symptoms: symptoms || '',
      };

      const appointment = await this.appointmentRepository.create(appointmentData);

      // Mark the slot as booked
      await this.doctorAvailabilityRepository.bookSlot(slotId);

      logger.info(`Appointment booked successfully: ${appointment.id} for slot ${slotId}`);
      
      // Return appointment with basic data
      return await this.appointmentRepository.findById(appointment.id);
    } catch (error) {
      logger.error('Book slot appointment error:', error);
      throw error;
    }
  }
}