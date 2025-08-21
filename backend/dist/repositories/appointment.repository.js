"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppointmentRepository = void 0;
const base_repository_1 = require("./base.repository");
const Appointment_model_1 = require("../models/Appointment.model");
class AppointmentRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Appointment_model_1.Appointment);
    }
    async findByPatientId(patientId, filters = {}) {
        const query = this.repository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('patient.id = :patientId', { patientId });
        if (filters.status) {
            query.andWhere('appointment.status = :status', { status: filters.status });
        }
        if (filters.startDate) {
            query.andWhere('appointment.appointmentDate >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            query.andWhere('appointment.appointmentDate <= :endDate', { endDate: filters.endDate });
        }
        return await query.orderBy('appointment.appointmentDate', 'DESC').getMany();
    }
    async findByDoctorId(doctorId, filters = {}) {
        const query = this.repository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('doctor.id = :doctorId', { doctorId });
        if (filters.status) {
            query.andWhere('appointment.status = :status', { status: filters.status });
        }
        if (filters.startDate) {
            query.andWhere('appointment.appointmentDate >= :startDate', { startDate: filters.startDate });
        }
        if (filters.endDate) {
            query.andWhere('appointment.appointmentDate <= :endDate', { endDate: filters.endDate });
        }
        return await query.orderBy('appointment.appointmentDate', 'DESC').getMany();
    }
    async findUpcoming(userId, role, limit = 10) {
        const query = this.repository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.appointmentDate > :now', { now: new Date() })
            .andWhere('appointment.status IN (:...statuses)', { statuses: ['scheduled', 'confirmed'] });
        if (role === 'patient') {
            query.andWhere('patient.id = :userId', { userId });
        }
        else if (role === 'doctor') {
            query.andWhere('doctor.id = :userId', { userId });
        }
        return await query
            .orderBy('appointment.appointmentDate', 'ASC')
            .limit(limit)
            .getMany();
    }
    async findPast(userId, role, limit = 10) {
        const query = this.repository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.appointmentDate < :now', { now: new Date() });
        if (role === 'patient') {
            query.andWhere('patient.id = :userId', { userId });
        }
        else if (role === 'doctor') {
            query.andWhere('doctor.id = :userId', { userId });
        }
        return await query
            .orderBy('appointment.appointmentDate', 'DESC')
            .limit(limit)
            .getMany();
    }
    async searchAppointments(searchTerm, userId, role) {
        const query = this.repository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('(patient.firstName ILIKE :searchTerm OR patient.lastName ILIKE :searchTerm OR doctor.firstName ILIKE :searchTerm OR doctor.lastName ILIKE :searchTerm OR appointment.reason ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` });
        if (role === 'patient') {
            query.andWhere('patient.id = :userId', { userId });
        }
        else if (role === 'doctor') {
            query.andWhere('doctor.id = :userId', { userId });
        }
        return await query.orderBy('appointment.appointmentDate', 'DESC').getMany();
    }
    async getAppointmentStats(userId, role) {
        const createBaseQuery = () => {
            const query = this.repository
                .createQueryBuilder('appointment')
                .leftJoinAndSelect('appointment.patient', 'patient')
                .leftJoinAndSelect('appointment.doctor', 'doctor');
            if (role === 'patient') {
                query.where('patient.id = :userId', { userId });
            }
            else if (role === 'doctor') {
                query.where('doctor.id = :userId', { userId });
            }
            return query;
        };
        const total = await createBaseQuery().getCount();
        const upcoming = await createBaseQuery()
            .andWhere('appointment.appointmentDate > :now', { now: new Date() })
            .andWhere('appointment.status IN (:...statuses)', { statuses: ['scheduled', 'confirmed'] })
            .getCount();
        const completed = await createBaseQuery()
            .andWhere('appointment.status = :status', { status: 'completed' })
            .getCount();
        const cancelled = await createBaseQuery()
            .andWhere('appointment.status = :status', { status: 'cancelled' })
            .getCount();
        return {
            total,
            upcoming,
            completed,
            cancelled,
        };
    }
    async findAppointmentsInTimeWindow(startWindow, endWindow, statuses = ['scheduled', 'confirmed']) {
        return await this.repository
            .createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .where('appointment.appointmentDate >= :startWindow', { startWindow })
            .andWhere('appointment.appointmentDate <= :endWindow', { endWindow })
            .andWhere('appointment.status IN (:...statuses)', { statuses })
            .getMany();
    }
}
exports.AppointmentRepository = AppointmentRepository;
