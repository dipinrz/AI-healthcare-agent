"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResultRepository = void 0;
const base_repository_1 = require("./base.repository");
const LabResult_model_1 = require("../models/LabResult.model");
class LabResultRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(LabResult_model_1.LabResult);
    }
    async findByPatientId(patientId) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('patient.id = :patientId', { patientId })
            .orderBy('labResult.testDate', 'DESC')
            .getMany();
    }
    async findByDoctorId(doctorId) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('orderedBy.id = :doctorId', { doctorId })
            .orderBy('labResult.testDate', 'DESC')
            .getMany();
    }
    async findByTestName(patientId, testName) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('LOWER(labResult.testName) LIKE LOWER(:testName)', { testName: `%${testName}%` })
            .orderBy('labResult.testDate', 'DESC')
            .getMany();
    }
    async findByStatus(patientId, status) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('labResult.status = :status', { status })
            .orderBy('labResult.testDate', 'DESC')
            .getMany();
    }
    async findAbnormalResults(patientId) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('labResult.status IN (:...statuses)', {
            statuses: ['abnormal', 'critical', 'high', 'low']
        })
            .orderBy('labResult.testDate', 'DESC')
            .getMany();
    }
    async findByDateRange(patientId, startDate, endDate) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('labResult.testDate >= :startDate', { startDate })
            .andWhere('labResult.testDate <= :endDate', { endDate })
            .orderBy('labResult.testDate', 'DESC')
            .getMany();
    }
    async findLatestByPatientId(patientId, limit = 10) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('patient.id = :patientId', { patientId })
            .orderBy('labResult.testDate', 'DESC')
            .limit(limit)
            .getMany();
    }
    async searchLabResults(patientId, searchTerm) {
        return await this.repository
            .createQueryBuilder('labResult')
            .leftJoinAndSelect('labResult.patient', 'patient')
            .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('(LOWER(labResult.testName) LIKE LOWER(:searchTerm) OR LOWER(labResult.notes) LIKE LOWER(:searchTerm) OR LOWER(labResult.interpretation) LIKE LOWER(:searchTerm))', { searchTerm: `%${searchTerm}%` })
            .orderBy('labResult.testDate', 'DESC')
            .getMany();
    }
    async getLabStats(patientId) {
        let query = this.repository
            .createQueryBuilder('labResult')
            .select('labResult.status', 'status')
            .addSelect('COUNT(*)', 'count');
        if (patientId) {
            query = query
                .leftJoinAndSelect('labResult.patient', 'patient')
                .where('patient.id = :patientId', { patientId });
        }
        const stats = await query
            .groupBy('labResult.status')
            .getRawMany();
        // Convert to a more usable format
        const result = {};
        stats.forEach(stat => {
            result[stat.status] = parseInt(stat.count);
        });
        return result;
    }
}
exports.LabResultRepository = LabResultRepository;
