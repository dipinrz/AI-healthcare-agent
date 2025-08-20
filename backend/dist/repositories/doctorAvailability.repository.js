"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorAvailabilityRepository = void 0;
const base_repository_1 = require("./base.repository");
const DoctorAvailability_model_1 = require("../models/DoctorAvailability.model");
class DoctorAvailabilityRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(DoctorAvailability_model_1.DoctorAvailability);
    }
    async findByDoctorId(doctorId, filters = {}) {
        const query = this.repository
            .createQueryBuilder('availability')
            .leftJoinAndSelect('availability.doctor', 'doctor')
            .where('doctor.id = :doctorId', { doctorId });
        if (filters.date) {
            const startOfDay = new Date(filters.date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(filters.date);
            endOfDay.setHours(23, 59, 59, 999);
            query.andWhere('availability.startTime >= :startOfDay', { startOfDay });
            query.andWhere('availability.startTime <= :endOfDay', { endOfDay });
        }
        if (filters.startDate) {
            query.andWhere('availability.startTime >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            query.andWhere('availability.startTime <= :endDate', { endDate: filters.endDate });
        }
        return await query.orderBy('availability.startTime', 'ASC').getMany();
    }
    async findAvailableSlots(startTime, endTime, doctorId) {
        const query = this.repository
            .createQueryBuilder('availability')
            .leftJoinAndSelect('availability.doctor', 'doctor')
            .where('availability.isBooked = :isBooked', { isBooked: false });
        // Add date range filtering if provided
        if (startTime && endTime) {
            query.andWhere('availability.startTime >= :startTime', { startTime });
            query.andWhere('availability.startTime <= :endTime', { endTime });
        }
        else {
            // Only show future slots if no specific date range is provided
            query.andWhere('availability.startTime > :now', { now: new Date() });
        }
        if (doctorId) {
            query.andWhere('doctor.id = :doctorId', { doctorId });
        }
        return await query.orderBy('availability.startTime', 'ASC').getMany();
    }
    async findBySlotId(slotId) {
        return await this.repository
            .createQueryBuilder('availability')
            .leftJoinAndSelect('availability.doctor', 'doctor')
            .where('availability.slotId = :slotId', { slotId })
            .getOne();
    }
    async bookSlot(slotId) {
        await this.repository.update({ slotId }, { isBooked: true });
        return await this.findBySlotId(slotId);
    }
    async releaseSlot(slotId) {
        await this.repository.update({ slotId }, { isBooked: false });
        return await this.findBySlotId(slotId);
    }
    async findSlotsForDateRange(startDate, endDate, doctorId) {
        const query = this.repository
            .createQueryBuilder('availability')
            .leftJoinAndSelect('availability.doctor', 'doctor')
            .where('availability.startTime >= :startDate', { startDate })
            .andWhere('availability.startTime <= :endDate', { endDate });
        if (doctorId) {
            query.andWhere('doctor.id = :doctorId', { doctorId });
        }
        return await query.orderBy('availability.startTime', 'ASC').getMany();
    }
    async getAvailabilityStats(doctorId) {
        const query = this.repository.createQueryBuilder('availability');
        if (doctorId) {
            query.leftJoinAndSelect('availability.doctor', 'doctor');
            query.where('doctor.id = :doctorId', { doctorId });
        }
        const total = await query.getCount();
        const booked = await query.andWhere('availability.isBooked = :isBooked', { isBooked: true }).getCount();
        const available = total - booked;
        // Get future slots
        query.andWhere('availability.startTime > :now', { now: new Date() });
        const futureTotal = await query.getCount();
        const futureBooked = await query.andWhere('availability.isBooked = :isBooked', { isBooked: true }).getCount();
        const futureAvailable = futureTotal - futureBooked;
        return {
            total,
            booked,
            available,
            future: {
                total: futureTotal,
                booked: futureBooked,
                available: futureAvailable,
            },
        };
    }
    async clearOldSlots(beforeDate) {
        const result = await this.repository
            .createQueryBuilder()
            .delete()
            .where('startTime < :beforeDate', { beforeDate })
            .execute();
        return { deletedCount: result.affected || 0 };
    }
    async findConflictingSlots(doctorId, startTime, endTime) {
        return await this.repository
            .createQueryBuilder('availability')
            .leftJoinAndSelect('availability.doctor', 'doctor')
            .where('doctor.id = :doctorId', { doctorId })
            .andWhere('availability.isBooked = :isBooked', { isBooked: true })
            .andWhere('(availability.startTime < :endTime AND availability.endTime > :startTime)', { startTime, endTime })
            .getMany();
    }
    async getMonthlyAvailability(doctorId, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59, 999);
        return await this.repository
            .createQueryBuilder('availability')
            .leftJoinAndSelect('availability.doctor', 'doctor')
            .where('doctor.id = :doctorId', { doctorId })
            .andWhere('availability.startTime >= :startDate', { startDate })
            .andWhere('availability.startTime <= :endDate', { endDate })
            .orderBy('availability.startTime', 'ASC')
            .getMany();
    }
}
exports.DoctorAvailabilityRepository = DoctorAvailabilityRepository;
