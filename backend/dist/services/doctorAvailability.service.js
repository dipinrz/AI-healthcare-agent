"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorAvailabilityService = void 0;
const doctorAvailability_repository_1 = require("../repositories/doctorAvailability.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
class DoctorAvailabilityService {
    constructor() {
        this.availabilityRepository = new doctorAvailability_repository_1.DoctorAvailabilityRepository();
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
    }
    async getDoctorSlots(doctorId, filters = {}) {
        try {
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                throw new Error(messages_1.MESSAGES.ERROR.DOCTOR_NOT_FOUND);
            }
            let startDate;
            let endDate;
            if (filters.month) {
                // If month is provided, get all slots for the month
                const [year, monthNum] = filters.month.split('-');
                startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
                endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);
            }
            else if (filters.date) {
                // If specific date is provided, get slots for that day
                startDate = new Date(filters.date);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(filters.date);
                endDate.setHours(23, 59, 59, 999);
            }
            else {
                // Default to next 30 days
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date();
                endDate.setDate(endDate.getDate() + 30);
                endDate.setHours(23, 59, 59, 999);
            }
            const slots = await this.availabilityRepository.findSlotsForDateRange(startDate, endDate, doctorId);
            return slots.map(slot => ({
                slot_id: slot.slotId,
                doctor_id: slot.doctor.id,
                start_time: slot.startTime.toISOString().replace('T', ' ').substring(0, 16),
                end_time: slot.endTime.toISOString().replace('T', ' ').substring(0, 16),
                is_booked: slot.isBooked,
            }));
        }
        catch (error) {
            logger_config_1.logger.error('Get doctor slots error:', error);
            throw error;
        }
    }
    async getAvailableDoctors(startTime, endTime) {
        try {
            const slots = await this.availabilityRepository.findAvailableSlots(startTime, endTime);
            return slots.map(slot => ({
                slot_id: slot.slotId,
                doctor: {
                    id: slot.doctor.id,
                    firstName: slot.doctor.firstName,
                    lastName: slot.doctor.lastName,
                    specialization: slot.doctor.specialization,
                    qualification: slot.doctor.qualification,
                    department: slot.doctor.department,
                    rating: slot.doctor.rating,
                },
                start_time: slot.startTime.toISOString().replace('T', ' ').substring(0, 16),
                end_time: slot.endTime.toISOString().replace('T', ' ').substring(0, 16),
            }));
        }
        catch (error) {
            logger_config_1.logger.error('Get available doctors error:', error);
            throw error;
        }
    }
    async bookSlot(slotId) {
        try {
            const slot = await this.availabilityRepository.findBySlotId(slotId);
            if (!slot) {
                throw new Error('Time slot not found');
            }
            if (slot.isBooked) {
                throw new Error('Time slot is already booked');
            }
            // Check if the slot time is in the future
            if (slot.startTime <= new Date()) {
                throw new Error('Cannot book slots in the past');
            }
            const bookedSlot = await this.availabilityRepository.bookSlot(slotId);
            if (!bookedSlot) {
                throw new Error('Failed to book slot');
            }
            logger_config_1.logger.info(`Slot booked successfully: ${slotId}`);
            return {
                slot_id: bookedSlot.slotId,
                doctor_id: bookedSlot.doctor.id,
                start_time: bookedSlot.startTime.toISOString().replace('T', ' ').substring(0, 16),
                end_time: bookedSlot.endTime.toISOString().replace('T', ' ').substring(0, 16),
                is_booked: bookedSlot.isBooked,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Book slot error:', error);
            throw error;
        }
    }
    async releaseSlot(slotId) {
        try {
            const slot = await this.availabilityRepository.findBySlotId(slotId);
            if (!slot) {
                throw new Error('Time slot not found');
            }
            if (!slot.isBooked) {
                throw new Error('Time slot is not booked');
            }
            const releasedSlot = await this.availabilityRepository.releaseSlot(slotId);
            if (!releasedSlot) {
                throw new Error('Failed to release slot');
            }
            logger_config_1.logger.info(`Slot released successfully: ${slotId}`);
            return {
                slot_id: releasedSlot.slotId,
                doctor_id: releasedSlot.doctor.id,
                start_time: releasedSlot.startTime.toISOString().replace('T', ' ').substring(0, 16),
                end_time: releasedSlot.endTime.toISOString().replace('T', ' ').substring(0, 16),
                is_booked: releasedSlot.isBooked,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Release slot error:', error);
            throw error;
        }
    }
    async generateSlotsForAllDoctors(days = 30) {
        try {
            const doctors = await this.doctorRepository.findAvailableDoctors();
            if (doctors.length === 0) {
                throw new Error('No doctors found in the database');
            }
            let totalSlotsCreated = 0;
            for (const doctor of doctors) {
                const slotsCreated = await this.generateSlotsForDoctor(doctor.id, days);
                totalSlotsCreated += slotsCreated.slotsCount;
            }
            logger_config_1.logger.info(`Generated ${totalSlotsCreated} slots for ${doctors.length} doctors`);
            return {
                message: `Successfully generated ${totalSlotsCreated} slots for ${doctors.length} doctors`,
                slotsCount: totalSlotsCreated,
                doctorsCount: doctors.length,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Generate slots for all doctors error:', error);
            throw error;
        }
    }
    async generateSlotsForDoctor(doctorId, days = 30) {
        try {
            const doctor = await this.doctorRepository.findById(doctorId);
            if (!doctor) {
                throw new Error(`Doctor with ID ${doctorId} not found`);
            }
            const slots = [];
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + days);
            const currentDate = new Date(today);
            while (currentDate <= endDate) {
                // Skip Sundays (0 = Sunday)
                if (currentDate.getDay() !== 0) {
                    const dailySlots = this.generateDailySlots(doctor, new Date(currentDate));
                    slots.push(...dailySlots);
                }
                currentDate.setDate(currentDate.getDate() + 1);
            }
            // Clear existing slots for the date range
            await this.availabilityRepository.getRepository()
                .createQueryBuilder()
                .delete()
                .where('doctorId = :doctorId', { doctorId })
                .andWhere('startTime >= :startDate', { startDate: today })
                .andWhere('startTime <= :endDate', { endDate })
                .execute();
            // Create new slots in batches
            const batchSize = 100;
            for (let i = 0; i < slots.length; i += batchSize) {
                const batch = slots.slice(i, i + batchSize);
                await this.availabilityRepository.getRepository().save(batch);
            }
            logger_config_1.logger.info(`Generated ${slots.length} slots for Dr. ${doctor.firstName} ${doctor.lastName}`);
            return {
                message: `Successfully generated ${slots.length} slots for ${doctor.firstName} ${doctor.lastName}`,
                slotsCount: slots.length,
                doctorId,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Generate slots for doctor error:', error);
            throw error;
        }
    }
    generateDailySlots(doctor, date) {
        const slots = [];
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Define working hours based on day
        let startHour = 9;
        let endHour = 17;
        // Saturday: shorter hours
        if (dayOfWeek === 6) {
            startHour = 9;
            endHour = 14; // Half day on Saturday
        }
        // Skip Sunday
        if (dayOfWeek === 0) {
            return slots;
        }
        // Generate 30-minute slots
        const slotDuration = 30; // minutes
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const startTime = new Date(date);
                startTime.setHours(hour, minute, 0, 0);
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + slotDuration);
                // Skip lunch break (12:30 PM - 1:30 PM)
                if (hour === 12 && minute >= 30 || hour === 13 && minute < 30) {
                    continue;
                }
                // Only create future slots
                if (startTime > new Date()) {
                    const slot = {
                        doctor,
                        startTime,
                        endTime,
                        isBooked: false,
                    };
                    slots.push(slot);
                }
            }
        }
        return slots;
    }
    async getSlotById(slotId) {
        try {
            const slot = await this.availabilityRepository.findBySlotId(slotId);
            if (!slot) {
                throw new Error('Time slot not found');
            }
            return slot;
        }
        catch (error) {
            logger_config_1.logger.error('Get slot by ID error:', error);
            throw error;
        }
    }
    async updateSlotAvailability(slotId, isBooked) {
        try {
            const slot = await this.availabilityRepository.findBySlotId(slotId);
            if (!slot) {
                throw new Error('Time slot not found');
            }
            if (isBooked) {
                return await this.availabilityRepository.bookSlot(slotId);
            }
            else {
                return await this.availabilityRepository.releaseSlot(slotId);
            }
        }
        catch (error) {
            logger_config_1.logger.error('Update slot availability error:', error);
            throw error;
        }
    }
    async getAvailabilityStats(doctorId) {
        try {
            return await this.availabilityRepository.getAvailabilityStats(doctorId);
        }
        catch (error) {
            logger_config_1.logger.error('Get availability stats error:', error);
            throw error;
        }
    }
    async clearOldSlots(beforeDate) {
        try {
            return await this.availabilityRepository.clearOldSlots(beforeDate);
        }
        catch (error) {
            logger_config_1.logger.error('Clear old slots error:', error);
            throw error;
        }
    }
}
exports.DoctorAvailabilityService = DoctorAvailabilityService;
