import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorAvailabilityRepository } from '../repositories/doctorAvailability.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { NotificationSettingRepository } from '../repositories/notificationSetting.repository';
import { AutomaticReminderSchedulerService } from './automaticReminderScheduler.service';
import { NotificationReminderType } from '../models/NotificationLog.model';
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
  duration?: number; // in minutes, defaults to 30
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
  private notificationSettingRepository = new NotificationSettingRepository();
  private reminderScheduler = new AutomaticReminderSchedulerService();

  async getAllAppointments(
    filters: AppointmentFilters,
    page: number = 1,
    limit: number = 10,
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }
  ) {
    try {
      logger.info('Getting all appointments with filters:', filters);

      let appointments: Appointment[];

      // Apply role-based filtering
      if (user.role === UserRole.PATIENT) {
        const patientId = user.patientId || user.userId;
        logger.info(`Fetching appointments for patient ID: ${patientId} (user: ${user.userId})`);
        appointments = await this.appointmentRepository.findByPatientId(patientId, filters);
        logger.info(`Found ${appointments.length} appointments for patient`);
      } else if (user.role === UserRole.DOCTOR) {
        const doctorId = user.doctorId || user.userId;
        appointments = await this.appointmentRepository.findByDoctorId(doctorId, filters);
      } else {
        // Admin can see all appointments
        appointments = await this.appointmentRepository.findAll({
          relations: ['patient', 'doctor'],
          order: { appointmentDate: 'DESC' },
        });
      }

      // Apply additional filters
      if (filters.doctorId && user.role === UserRole.ADMIN) {
        appointments = appointments.filter(apt => apt.doctor.id === filters.doctorId);
      }

      if (filters.patientId && user.role === UserRole.ADMIN) {
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
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }
  ): Promise<Appointment> {
    try {
      const appointment = await this.appointmentRepository.findById(id, {
        relations: ['patient', 'doctor'],
      });
      
      if (!appointment) {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
      }

      // Check permissions
      if (user.role === UserRole.PATIENT && appointment.patient.id !== (user.patientId || user.userId)) {
        throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
      }

      if (user.role === UserRole.DOCTOR && appointment.doctor.id !== (user.doctorId || user.userId)) {
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
      const { doctorId, patientId, appointmentDate, reason, type, duration = 30, slotId } = appointmentData;

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
        duration,
        reason,
        type: type as AppointmentType,
        status: AppointmentStatus.SCHEDULED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Appointment created successfully:', appointment.id);

      // Schedule automatic reminders
      try {
        const appointmentWithRelations = await this.appointmentRepository.findById(appointment.id, {
          relations: ['patient', 'doctor']
        });
        if (appointmentWithRelations) {
          await this.reminderScheduler.scheduleRemindersForAppointment(appointmentWithRelations);
          logger.info(`✅ Automatic reminders scheduled for appointment ${appointment.id}`);
        }
      } catch (error) {
        logger.error('Failed to schedule automatic reminders:', error);
        // Don't fail the appointment creation if reminder scheduling fails
      }

      return appointment;
    } catch (error) {
      logger.error('Create appointment error:', error);
      throw error;
    }
  }

  async updateAppointment(
    id: string,
    updateData: UpdateAppointmentData,
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }
  ): Promise<Appointment> {
    try {
      const appointment = await this.getAppointmentById(id, user);

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
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }
  ): Promise<Appointment> {
    try {
      const appointment = await this.getAppointmentById(id, user);

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

      // Cancel all pending reminders and send cancellation notification
      try {
        await this.reminderScheduler.cancelRemindersForAppointment(id);
        
        const appointmentWithRelations = await this.appointmentRepository.findById(id, {
          relations: ['patient', 'doctor']
        });

        if (appointmentWithRelations) {
          await this.reminderScheduler.sendImmediateNotification(
            appointmentWithRelations,
            NotificationReminderType.CANCELLED,
            'Appointment Cancelled ❌',
            `Your appointment with Dr. ${appointmentWithRelations.doctor.firstName} ${appointmentWithRelations.doctor.lastName} on ${appointmentWithRelations.appointmentDate.toLocaleDateString()} at ${appointmentWithRelations.appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} has been cancelled`
          );
        }
        logger.info(`📨 Cancellation notification sent and reminders cancelled for appointment ${id}`);
      } catch (error) {
        logger.error('Failed to handle reminders for cancelled appointment:', error);
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
    newSlotId: number,
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }
  ): Promise<Appointment> {
    try {
      logger.info(`Reschedule appointment: ${id} to slot ${newSlotId}`);
      const appointment = await this.getAppointmentById(id, user);

      if (appointment.status !== 'scheduled') {
        throw new Error('Only scheduled appointments can be rescheduled');
      }

      // Get the new slot details
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

      const newDate = newSlot.startTime;
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

      // Book new slot
      await this.doctorAvailabilityRepository.bookSlot(newSlotId);

      const updatedAppointment = await this.appointmentRepository.update(id, {
        appointmentDate: newDate,
        updatedAt: new Date(),
      });

      if (!updatedAppointment) {
        throw new Error(MESSAGES.ERROR.APPOINTMENT_NOT_FOUND);
      }

      // Return appointment with relations
      const finalAppointment = await this.appointmentRepository.findById(id, {
        relations: ['patient', 'doctor']
      });

      // Cancel old reminders and schedule new ones
      try {
        await this.reminderScheduler.cancelRemindersForAppointment(id);
        await this.reminderScheduler.scheduleRemindersForAppointment(finalAppointment!);
        
        // Send rescheduled notification
        await this.reminderScheduler.sendImmediateNotification(
          finalAppointment!,
          NotificationReminderType.RESCHEDULED,
          'Appointment Rescheduled 📅',
          `Your appointment with Dr. ${finalAppointment!.doctor.firstName} ${finalAppointment!.doctor.lastName} has been rescheduled to ${finalAppointment!.appointmentDate.toLocaleDateString()} at ${finalAppointment!.appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        );
        logger.info(`📨 Rescheduled notification sent and reminders updated for appointment ${id}`);
      } catch (error) {
        logger.error('Failed to update reminders for rescheduled appointment:', error);
      }

      logger.info(`Appointment rescheduled successfully: ${id} to slot ${newSlotId}`);
      return finalAppointment || updatedAppointment;
    } catch (error) {
      logger.error('Reschedule appointment error:', error);
      throw error;
    }
  }

  async completeAppointment(
    id: string,
    completionData: CompletionData,
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }
  ): Promise<Appointment> {
    try {
      if (user.role !== UserRole.DOCTOR && user.role !== UserRole.ADMIN) {
        throw new Error(MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS);
      }

      const appointment = await this.getAppointmentById(id, user);

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
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string },
    limit: number = 10
  ): Promise<Appointment[]> {
    try {
      const id = user.role === UserRole.PATIENT ? (user.patientId || user.userId) : 
                 user.role === UserRole.DOCTOR ? (user.doctorId || user.userId) : user.userId;
      return await this.appointmentRepository.findUpcoming(id, user.role.toLowerCase(), limit);
    } catch (error) {
      logger.error('Get upcoming appointments error:', error);
      throw error;
    }
  }

  async getPastAppointments(
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string },
    limit: number = 10
  ): Promise<Appointment[]> {
    try {
      const id = user.role === UserRole.PATIENT ? (user.patientId || user.userId) : 
                 user.role === UserRole.DOCTOR ? (user.doctorId || user.userId) : user.userId;
      return await this.appointmentRepository.findPast(id, user.role.toLowerCase(), limit);
    } catch (error) {
      logger.error('Get past appointments error:', error);
      throw error;
    }
  }

  async searchAppointments(
    searchTerm: string,
    user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }
  ): Promise<Appointment[]> {
    try {
      const id = user.role === UserRole.PATIENT ? (user.patientId || user.userId) : 
                 user.role === UserRole.DOCTOR ? (user.doctorId || user.userId) : user.userId;
      return await this.appointmentRepository.searchAppointments(
        searchTerm,
        id,
        user.role.toLowerCase()
      );
    } catch (error) {
      logger.error('Search appointments error:', error);
      throw error;
    }
  }

  async getAppointmentStats(user: { userId: string; role: UserRole; patientId?: string; doctorId?: string }) {
    try {
      const id = user.role === UserRole.PATIENT ? (user.patientId || user.userId) : 
                 user.role === UserRole.DOCTOR ? (user.doctorId || user.userId) : user.userId;
      return await this.appointmentRepository.getAppointmentStats(id, user.role.toLowerCase());
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
        patient,
        doctor: slot.doctor,
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
      
      // Get appointment with relations for scheduling
      const appointmentWithRelations = await this.appointmentRepository.findById(appointment.id, {
        relations: ['patient', 'doctor']
      });

      // Schedule automatic reminders
      try {
        await this.reminderScheduler.scheduleRemindersForAppointment(appointmentWithRelations!);
        logger.info(`✅ Automatic reminders scheduled for appointment ${appointment.id}`);
      } catch (error) {
        logger.error('Failed to schedule automatic reminders:', error);
        // Don't fail the appointment booking if reminder scheduling fails
      }

      // Send immediate confirmation notification
      try {
        await this.reminderScheduler.sendImmediateNotification(
          appointmentWithRelations!,
          NotificationReminderType.CONFIRMED,
          'Appointment Confirmed ✅',
          `Your appointment with Dr. ${appointmentWithRelations!.doctor.firstName} ${appointmentWithRelations!.doctor.lastName} on ${appointmentWithRelations!.appointmentDate.toLocaleDateString()} at ${appointmentWithRelations!.appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} has been confirmed`
        );
        logger.info(`📨 Confirmation notification sent for appointment ${appointment.id}`);
      } catch (error) {
        logger.error('Failed to send confirmation notification:', error);
      }
      
      return appointmentWithRelations;
    } catch (error) {
      logger.error('Book slot appointment error:', error);
      throw error;
    }
  }

  async getAvailableSlots(doctorId: string, date: string) {
    try {
      // Verify doctor exists
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      console.log(`Looking for slots for doctor: ${doctorId} on date: ${date}`);

      // Parse the date
      const targetDate = new Date(date);
      if (isNaN(targetDate.getTime())) {
        throw new Error('Invalid date format');
      }

      // Get available slots for the doctor on the specific date
      // Create start and end of the target date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

      // First, check if there are ANY slots for this doctor
      const allSlotsForDoctor = await this.doctorAvailabilityRepository.findAvailableSlots(
        undefined, 
        undefined,
        doctorId
      );
      console.log(`Total slots for doctor ${doctorId}: ${allSlotsForDoctor.length}`);

      // Now get slots for the specific date
      const slots = await this.doctorAvailabilityRepository.findAvailableSlots(
        startOfDay.toISOString(), 
        endOfDay.toISOString(),
        doctorId
      );

      console.log(`Slots found for date range:`, slots.length);
      console.log('First few slots:', slots.slice(0, 3));

      // Filter out booked slots and return in the expected format
      const availableSlots = slots
        .filter(slot => !slot.isBooked)
        .map(slot => ({
          slotId: slot.slotId,
          time: slot.startTime,
          displayTime: slot.startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }),
          startTime: slot.startTime,
          endTime: slot.endTime,
          is_booked: slot.isBooked,
          doctor: {
            id: slot.doctor?.id,
            firstName: slot.doctor?.firstName,
            lastName: slot.doctor?.lastName,
            specialization: slot.doctor?.specialization
          }
        }));

      console.log(`Final available slots: ${availableSlots.length}`);
      logger.info(`Retrieved ${availableSlots.length} available slots for doctor ${doctorId} on ${date}`);
      return availableSlots;
    } catch (error) {
      logger.error('Get available slots error:', error);
      throw error;
    }
  }

  // Notification-related methods
  async canSendNotificationToPatient(
    patientId: string, 
    notificationType: '24h' | '1h' | 'confirmed' | 'cancelled' | 'rescheduled'
  ): Promise<boolean> {
    try {
      logger.info(`Checking notification permission for patient ${patientId}, type: ${notificationType}`);
      
      const settings = await this.notificationSettingRepository.getOrCreateSettings(patientId);
      
      // First check if notifications are enabled globally
      if (!settings.notificationsEnabled) {
        logger.info(`Notifications disabled for patient ${patientId}`);
        return false;
      }

      // Check specific notification type
      switch (notificationType) {
        case '24h':
          return settings.reminder24h;
        case '1h':
          return settings.reminder1h;
        case 'confirmed':
          return settings.appointmentConfirmed;
        case 'cancelled':
          return settings.appointmentCancelled;
        case 'rescheduled':
          return settings.appointmentRescheduled;
        default:
          return false;
      }
    } catch (error) {
      logger.error('Error checking notification permission:', error);
      return false; // Default to not sending if error occurs
    }
  }

  async getAppointmentsEligibleForReminders(type: '24h' | '1h'): Promise<Appointment[]> {
    try {
      const now = new Date();
      let targetTime: Date;

      // Calculate target time based on reminder type
      if (type === '24h') {
        targetTime = new Date(now);
        targetTime.setHours(targetTime.getHours() + 24);
      } else {
        targetTime = new Date(now);
        targetTime.setHours(targetTime.getHours() + 1);
      }

      // Get appointments around the target time (with 30-minute window)
      const startWindow = new Date(targetTime);
      startWindow.setMinutes(startWindow.getMinutes() - 15);
      
      const endWindow = new Date(targetTime);
      endWindow.setMinutes(endWindow.getMinutes() + 15);

      // Get appointments in the time window that are scheduled or confirmed
      const appointments = await this.appointmentRepository.findAppointmentsInTimeWindow(
        startWindow,
        endWindow,
        ['scheduled', 'confirmed']
      );

      // Filter appointments based on patient notification preferences
      const eligibleAppointments = [];
      
      for (const appointment of appointments) {
        const canSend = await this.canSendNotificationToPatient(
          appointment.patient.id, 
          type
        );
        
        if (canSend) {
          eligibleAppointments.push(appointment);
        }
      }

      logger.info(`Found ${eligibleAppointments.length} appointments eligible for ${type} reminders`);
      return eligibleAppointments;
    } catch (error) {
      logger.error(`Error getting appointments eligible for ${type} reminders:`, error);
      return [];
    }
  }
}