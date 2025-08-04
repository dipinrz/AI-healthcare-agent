"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentAIService = void 0;
const database_1 = require("../config/database");
const Doctor_1 = require("../entities/Doctor");
const Patient_1 = require("../entities/Patient");
const Appointment_1 = require("../entities/Appointment");
class AppointmentAIService {
    constructor() {
        this.doctorRepository = database_1.AppDataSource.getRepository(Doctor_1.Doctor);
        this.patientRepository = database_1.AppDataSource.getRepository(Patient_1.Patient);
        this.appointmentRepository = database_1.AppDataSource.getRepository(Appointment_1.Appointment);
    }
    async processMessage(message, patientId, context = {}) {
        const extractedInfo = this.extractIntentAndEntities(message);
        const updatedContext = { ...context, extractedInfo };
        switch (extractedInfo.intent) {
            case 'book_appointment':
                return await this.handleBookingFlow(message, patientId, updatedContext);
            case 'check_availability':
                return await this.handleAvailabilityCheck(message, patientId, updatedContext);
            case 'cancel_appointment':
                return await this.handleCancellation(message, patientId, updatedContext);
            case 'reschedule_appointment':
                return await this.handleReschedule(message, patientId, updatedContext);
            default:
                return await this.handleGeneralQuery(message, patientId, updatedContext);
        }
    }
    extractIntentAndEntities(message) {
        const lowerMessage = message.toLowerCase();
        // Intent detection
        let intent = 'general_query';
        if (this.containsBookingKeywords(lowerMessage)) {
            intent = 'book_appointment';
        }
        else if (this.containsAvailabilityKeywords(lowerMessage)) {
            intent = 'check_availability';
        }
        else if (this.containsCancelKeywords(lowerMessage)) {
            intent = 'cancel_appointment';
        }
        else if (this.containsRescheduleKeywords(lowerMessage)) {
            intent = 'reschedule_appointment';
        }
        // Entity extraction
        const doctorName = this.extractDoctorName(lowerMessage);
        const date = this.extractDate(lowerMessage);
        const time = this.extractTime(lowerMessage);
        const reason = this.extractReason(lowerMessage);
        const appointmentType = this.extractAppointmentType(lowerMessage);
        return {
            intent,
            doctorName,
            date,
            time,
            reason,
            appointmentType: appointmentType || Appointment_1.AppointmentType.CONSULTATION
        };
    }
    containsBookingKeywords(message) {
        const bookingKeywords = [
            'book', 'schedule', 'appointment', 'reserve', 'set up', 'arrange',
            'make an appointment', 'book appointment', 'schedule appointment'
        ];
        return bookingKeywords.some(keyword => message.includes(keyword));
    }
    containsAvailabilityKeywords(message) {
        const availabilityKeywords = [
            'available', 'free', 'open slots', 'check availability', 'when is',
            'what times', 'available times', 'free times'
        ];
        return availabilityKeywords.some(keyword => message.includes(keyword));
    }
    containsCancelKeywords(message) {
        const cancelKeywords = ['cancel', 'cancel appointment', 'remove appointment', 'delete appointment'];
        return cancelKeywords.some(keyword => message.includes(keyword));
    }
    containsRescheduleKeywords(message) {
        const rescheduleKeywords = ['reschedule', 'change appointment', 'move appointment', 'reschedule appointment'];
        return rescheduleKeywords.some(keyword => message.includes(keyword));
    }
    extractDoctorName(message) {
        // Look for patterns like "Dr. Smith", "Doctor Johnson", or "dr smith"
        const doctorPatterns = [
            /(?:dr\.?\s+|doctor\s+)([a-z]+(?:\s+[a-z]+)?)/i,
            /(?:with\s+|see\s+)(?:dr\.?\s+|doctor\s+)?([a-z]+(?:\s+[a-z]+)?)/i
        ];
        for (const pattern of doctorPatterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1].trim();
            }
        }
        return undefined;
    }
    extractDate(message) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        // Handle relative dates
        if (message.includes('today')) {
            return today.toISOString().split('T')[0];
        }
        if (message.includes('tomorrow')) {
            return tomorrow.toISOString().split('T')[0];
        }
        // Handle specific dates
        const datePatterns = [
            /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // MM/DD/YYYY or MM-DD-YYYY
            /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/, // YYYY/MM/DD or YYYY-MM-DD
            /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i,
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/i
        ];
        for (const pattern of datePatterns) {
            const match = message.match(pattern);
            if (match) {
                // Convert to ISO date format
                try {
                    const date = new Date(match[0]);
                    if (!isNaN(date.getTime())) {
                        return date.toISOString().split('T')[0];
                    }
                }
                catch (e) {
                    continue;
                }
            }
        }
        return undefined;
    }
    extractTime(message) {
        const timePatterns = [
            /(\d{1,2}):(\d{2})\s*(am|pm)/i,
            /(\d{1,2})\s*(am|pm)/i,
            /(\d{1,2}):(\d{2})/,
            /(morning|afternoon|evening)/i
        ];
        for (const pattern of timePatterns) {
            const match = message.match(pattern);
            if (match) {
                return match[0].trim();
            }
        }
        return undefined;
    }
    extractReason(message) {
        const reasonKeywords = [
            'checkup', 'consultation', 'follow up', 'follow-up', 'pain', 'headache',
            'fever', 'cough', 'cold', 'routine', 'emergency', 'urgent'
        ];
        for (const keyword of reasonKeywords) {
            if (message.toLowerCase().includes(keyword)) {
                return keyword;
            }
        }
        return undefined;
    }
    extractAppointmentType(message) {
        if (message.includes('follow up') || message.includes('follow-up')) {
            return Appointment_1.AppointmentType.FOLLOW_UP;
        }
        if (message.includes('emergency') || message.includes('urgent')) {
            return Appointment_1.AppointmentType.EMERGENCY;
        }
        if (message.includes('checkup') || message.includes('routine')) {
            return Appointment_1.AppointmentType.ROUTINE_CHECKUP;
        }
        return Appointment_1.AppointmentType.CONSULTATION;
    }
    async handleBookingFlow(message, patientId, context) {
        const { extractedInfo } = context;
        // Step 1: Find or suggest doctors
        if (!extractedInfo?.doctorId && extractedInfo?.doctorName) {
            const doctors = await this.findDoctorsByName(extractedInfo.doctorName);
            if (doctors.length === 0) {
                return {
                    response: `I couldn't find a doctor named "${extractedInfo.doctorName}". Could you please check the name or would you like me to show you available doctors?`,
                    context: { ...context, currentFlow: 'booking' },
                    actions: [{ type: 'suggest_doctors' }]
                };
            }
            if (doctors.length === 1) {
                context.extractedInfo.doctorId = doctors[0].id;
                return await this.proceedWithDateTimeSelection(patientId, context, doctors[0]);
            }
            // Multiple doctors found
            return {
                response: `I found multiple doctors with that name. Please specify which one:\n${doctors.map((d, i) => `${i + 1}. Dr. ${d.firstName} ${d.lastName} - ${d.specialization}`).join('\n')}`,
                context: { ...context, currentFlow: 'booking', doctorSuggestions: doctors }
            };
        }
        // Step 2: Handle date/time selection
        if (extractedInfo?.doctorId && (!extractedInfo?.date || !extractedInfo?.time)) {
            const doctor = await this.doctorRepository.findOne({ where: { id: extractedInfo.doctorId } });
            if (!doctor) {
                return {
                    response: "Sorry, I couldn't find that doctor. Please try again.",
                    context: {}
                };
            }
            return await this.proceedWithDateTimeSelection(patientId, context, doctor);
        }
        // Step 3: Check availability and book
        if (extractedInfo?.doctorId && extractedInfo?.date && extractedInfo?.time) {
            return await this.checkAvailabilityAndBook(patientId, context);
        }
        // Default response if we can't extract enough info
        return {
            response: "I'd be happy to help you book an appointment! Please tell me which doctor you'd like to see and when.",
            context: { ...context, currentFlow: 'booking' }
        };
    }
    async findDoctorsByName(name) {
        const searchTerms = name.split(' ');
        let query = this.doctorRepository.createQueryBuilder('doctor');
        searchTerms.forEach((term, index) => {
            const paramKey = `term${index}`;
            if (index === 0) {
                query = query.where(`(doctor.firstName ILIKE :${paramKey} OR doctor.lastName ILIKE :${paramKey})`, { [paramKey]: `%${term}%` });
            }
            else {
                query = query.orWhere(`(doctor.firstName ILIKE :${paramKey} OR doctor.lastName ILIKE :${paramKey})`, { [paramKey]: `%${term}%` });
            }
        });
        return await query.limit(5).getMany();
    }
    async proceedWithDateTimeSelection(patientId, context, doctor) {
        const { extractedInfo } = context;
        if (!extractedInfo?.date) {
            return {
                response: `Great! I'll help you book an appointment with Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialization}). What date would you prefer? You can say "tomorrow", "next Monday", or specify a date like "December 15th".`,
                context: { ...context, currentFlow: 'booking' }
            };
        }
        if (!extractedInfo?.time) {
            // Get available slots for the date
            const availableSlots = await this.getAvailableSlots(doctor.id, extractedInfo.date);
            if (availableSlots.length === 0) {
                return {
                    response: `Dr. ${doctor.firstName} ${doctor.lastName} is not available on ${this.formatDate(extractedInfo.date)}. Would you like to try a different date?`,
                    context: context
                };
            }
            return {
                response: `Dr. ${doctor.firstName} ${doctor.lastName} has the following available times on ${this.formatDate(extractedInfo.date)}:\n${availableSlots.slice(0, 8).map((slot, i) => `${i + 1}. ${slot.displayTime}`).join('\n')}\n\nWhich time works best for you?`,
                context: { ...context, availableSlots, currentFlow: 'booking' }
            };
        }
        return await this.checkAvailabilityAndBook(patientId, context);
    }
    async checkAvailabilityAndBook(patientId, context) {
        const { extractedInfo } = context;
        if (!extractedInfo?.doctorId || !extractedInfo?.date || !extractedInfo?.time) {
            return {
                response: "I need more information to book your appointment. Please specify the doctor, date, and time.",
                context
            };
        }
        try {
            // Parse the date and time
            const appointmentDateTime = this.parseDateTime(extractedInfo.date, extractedInfo.time);
            // Check if the slot is available
            const isAvailable = await this.isSlotAvailable(extractedInfo.doctorId, appointmentDateTime);
            if (!isAvailable) {
                const availableSlots = await this.getAvailableSlots(extractedInfo.doctorId, extractedInfo.date);
                return {
                    response: `Sorry, Dr. ${await this.getDoctorName(extractedInfo.doctorId)} is not available at ${extractedInfo.time} on ${this.formatDate(extractedInfo.date)}. Here are other available times:\n${availableSlots.slice(0, 5).map((slot, i) => `${i + 1}. ${slot.displayTime}`).join('\n')}`,
                    context: { ...context, availableSlots }
                };
            }
            // Book the appointment
            const patient = await this.patientRepository.findOne({ where: { id: patientId } });
            const doctor = await this.doctorRepository.findOne({ where: { id: extractedInfo.doctorId } });
            if (!patient || !doctor) {
                return {
                    response: "Sorry, there was an error processing your request. Please try again.",
                    context: {}
                };
            }
            const appointment = this.appointmentRepository.create({
                patient,
                doctor,
                appointmentDate: appointmentDateTime,
                duration: 30,
                type: extractedInfo.appointmentType || Appointment_1.AppointmentType.CONSULTATION,
                reason: extractedInfo.reason || 'General consultation',
                status: Appointment_1.AppointmentStatus.SCHEDULED
            });
            await this.appointmentRepository.save(appointment);
            return {
                response: `Perfect! I've successfully booked your appointment with Dr. ${doctor.firstName} ${doctor.lastName} on ${this.formatDate(extractedInfo.date)} at ${extractedInfo.time}. You'll receive a confirmation shortly. Is there anything else you need help with?`,
                context: {},
                actions: [{
                        type: 'appointment_booked',
                        appointmentId: appointment.id,
                        appointmentDetails: {
                            doctor: `Dr. ${doctor.firstName} ${doctor.lastName}`,
                            date: this.formatDate(extractedInfo.date),
                            time: extractedInfo.time,
                            type: extractedInfo.appointmentType
                        }
                    }]
            };
        }
        catch (error) {
            console.error('Booking error:', error);
            return {
                response: "Sorry, there was an error booking your appointment. Please try again or contact support.",
                context: {}
            };
        }
    }
    async handleAvailabilityCheck(message, patientId, context) {
        const { extractedInfo } = context;
        if (!extractedInfo?.doctorName && !extractedInfo?.doctorId) {
            return {
                response: "Which doctor would you like to check availability for?",
                context: { ...context, currentFlow: 'checking_availability' }
            };
        }
        let doctorId = extractedInfo.doctorId;
        if (!doctorId && extractedInfo.doctorName) {
            const doctors = await this.findDoctorsByName(extractedInfo.doctorName);
            if (doctors.length === 0) {
                return {
                    response: `I couldn't find a doctor named "${extractedInfo.doctorName}". Please check the name.`,
                    context
                };
            }
            doctorId = doctors[0].id;
        }
        if (!extractedInfo?.date) {
            return {
                response: "For which date would you like to check availability?",
                context: { ...context, currentFlow: 'checking_availability' }
            };
        }
        try {
            const availableSlots = await this.getAvailableSlots(doctorId, extractedInfo.date);
            const doctorName = await this.getDoctorName(doctorId);
            if (availableSlots.length === 0) {
                return {
                    response: `Dr. ${doctorName} has no available slots on ${this.formatDate(extractedInfo.date)}. Would you like to check a different date?`,
                    context
                };
            }
            return {
                response: `Dr. ${doctorName} has the following available times on ${this.formatDate(extractedInfo.date)}:\n${availableSlots.map((slot, i) => `${i + 1}. ${slot.displayTime}`).join('\n')}\n\nWould you like to book any of these slots?`,
                context: { ...context, availableSlots }
            };
        }
        catch (error) {
            return {
                response: "Sorry, I couldn't check availability right now. Please try again.",
                context
            };
        }
    }
    async handleCancellation(message, patientId, context) {
        // Get patient's upcoming appointments
        const appointments = await this.appointmentRepository.find({
            where: {
                patient: { id: patientId },
                status: Appointment_1.AppointmentStatus.SCHEDULED
            },
            relations: ['doctor'],
            order: { appointmentDate: 'ASC' }
        });
        if (appointments.length === 0) {
            return {
                response: "You don't have any scheduled appointments to cancel.",
                context: {}
            };
        }
        return {
            response: `Here are your upcoming appointments:\n${appointments.map((apt, i) => `${i + 1}. Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} - ${this.formatDateTime(apt.appointmentDate)}`).join('\n')}\n\nWhich appointment would you like to cancel? Please reply with the number.`,
            context: { ...context, currentFlow: 'canceling_appointment', appointments }
        };
    }
    async handleReschedule(message, patientId, context) {
        // Similar to cancellation, but for rescheduling
        const appointments = await this.appointmentRepository.find({
            where: {
                patient: { id: patientId },
                status: Appointment_1.AppointmentStatus.SCHEDULED
            },
            relations: ['doctor'],
            order: { appointmentDate: 'ASC' }
        });
        if (appointments.length === 0) {
            return {
                response: "You don't have any scheduled appointments to reschedule.",
                context: {}
            };
        }
        return {
            response: `Here are your upcoming appointments:\n${appointments.map((apt, i) => `${i + 1}. Dr. ${apt.doctor.firstName} ${apt.doctor.lastName} - ${this.formatDateTime(apt.appointmentDate)}`).join('\n')}\n\nWhich appointment would you like to reschedule? Please reply with the number.`,
            context: { ...context, currentFlow: 'rescheduling_appointment', appointments }
        };
    }
    async handleGeneralQuery(message, patientId, context) {
        return {
            response: "I can help you with booking appointments, checking doctor availability, or managing your existing appointments. What would you like to do today?",
            context: {}
        };
    }
    // Utility methods
    async getAvailableSlots(doctorId, date) {
        const selectedDate = new Date(date);
        const startOfDay = new Date(selectedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate);
        endOfDay.setHours(23, 59, 59, 999);
        const bookedAppointments = await this.appointmentRepository
            .createQueryBuilder('appointment')
            .where('appointment.doctorId = :doctorId', { doctorId })
            .andWhere('appointment.appointmentDate >= :startOfDay', { startOfDay })
            .andWhere('appointment.appointmentDate <= :endOfDay', { endOfDay })
            .andWhere('appointment.status = :status', { status: Appointment_1.AppointmentStatus.SCHEDULED })
            .getMany();
        const workingHours = { start: 9, end: 17, slotDuration: 30 };
        const availableSlots = [];
        for (let hour = workingHours.start; hour < workingHours.end; hour++) {
            for (let minute = 0; minute < 60; minute += workingHours.slotDuration) {
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, minute, 0, 0);
                if (slotTime <= new Date())
                    continue;
                const isBooked = bookedAppointments.some(apt => apt.appointmentDate.getTime() === slotTime.getTime());
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
        return availableSlots;
    }
    async isSlotAvailable(doctorId, appointmentDateTime) {
        const conflictingAppointment = await this.appointmentRepository.findOne({
            where: {
                doctor: { id: doctorId },
                appointmentDate: appointmentDateTime,
                status: Appointment_1.AppointmentStatus.SCHEDULED
            }
        });
        return !conflictingAppointment;
    }
    parseDateTime(date, time) {
        const baseDate = new Date(date);
        // Parse time
        const timeMatch = time.match(/(\d{1,2}):?(\d{0,2})\s*(am|pm)?/i);
        if (timeMatch) {
            let hours = parseInt(timeMatch[1]);
            const minutes = parseInt(timeMatch[2] || '0');
            const meridiem = timeMatch[3]?.toLowerCase();
            if (meridiem === 'pm' && hours !== 12)
                hours += 12;
            if (meridiem === 'am' && hours === 12)
                hours = 0;
            baseDate.setHours(hours, minutes, 0, 0);
        }
        return baseDate;
    }
    async getDoctorName(doctorId) {
        const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
        return doctor ? `${doctor.firstName} ${doctor.lastName}` : 'Unknown Doctor';
    }
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    formatDateTime(date) {
        return date.toLocaleString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    }
}
exports.AppointmentAIService = AppointmentAIService;
