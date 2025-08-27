"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VitalSignsRepository = void 0;
const base_repository_1 = require("./base.repository");
const VitalSigns_model_1 = require("../models/VitalSigns.model");
class VitalSignsRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(VitalSigns_model_1.VitalSigns);
    }
    async findByPatientId(patientId) {
        return await this.repository
            .createQueryBuilder('vitals')
            .leftJoinAndSelect('vitals.patient', 'patient')
            .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
            .where('patient.id = :patientId', { patientId })
            .orderBy('vitals.recordedDate', 'DESC')
            .getMany();
    }
    async findByDoctorId(doctorId) {
        return await this.repository
            .createQueryBuilder('vitals')
            .leftJoinAndSelect('vitals.patient', 'patient')
            .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
            .where('recordedBy.id = :doctorId', { doctorId })
            .orderBy('vitals.recordedDate', 'DESC')
            .getMany();
    }
    async findByPatientAndDateRange(patientId, startDate, endDate) {
        return await this.repository
            .createQueryBuilder('vitals')
            .leftJoinAndSelect('vitals.patient', 'patient')
            .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('vitals.recordedDate >= :startDate', { startDate })
            .andWhere('vitals.recordedDate <= :endDate', { endDate })
            .orderBy('vitals.recordedDate', 'DESC')
            .getMany();
    }
    async findLatestByPatientId(patientId, limit = 1) {
        return await this.repository
            .createQueryBuilder('vitals')
            .leftJoinAndSelect('vitals.patient', 'patient')
            .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
            .where('patient.id = :patientId', { patientId })
            .orderBy('vitals.recordedDate', 'DESC')
            .limit(limit)
            .getMany();
    }
    async getVitalSignsTrends(patientId, days = 30) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        return await this.findByPatientAndDateRange(patientId, startDate, new Date());
    }
}
exports.VitalSignsRepository = VitalSignsRepository;
