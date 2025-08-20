"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatientRepository = void 0;
const base_repository_1 = require("./base.repository");
const Patient_model_1 = require("../models/Patient.model");
class PatientRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Patient_model_1.Patient);
    }
    async findByEmail(email) {
        return await this.findOne({
            where: { email, isActive: true },
        });
    }
    async findActivePatients() {
        return await this.findAll({
            where: { isActive: true },
            order: { firstName: 'ASC' },
        });
    }
    async searchPatients(searchTerm) {
        return await this.repository
            .createQueryBuilder('patient')
            .where('patient.isActive = :isActive', { isActive: true })
            .andWhere('(patient.firstName ILIKE :searchTerm OR patient.lastName ILIKE :searchTerm OR patient.email ILIKE :searchTerm OR patient.phone ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` })
            .orderBy('patient.firstName', 'ASC')
            .getMany();
    }
    async findByAge(minAge, maxAge) {
        const query = this.repository
            .createQueryBuilder('patient')
            .where('patient.isActive = :isActive', { isActive: true });
        // Calculate date range based on age
        const maxDate = new Date();
        maxDate.setFullYear(maxDate.getFullYear() - minAge);
        query.andWhere('patient.dateOfBirth <= :maxDate', { maxDate });
        if (maxAge) {
            const minDate = new Date();
            minDate.setFullYear(minDate.getFullYear() - maxAge);
            query.andWhere('patient.dateOfBirth >= :minDate', { minDate });
        }
        return await query.orderBy('patient.firstName', 'ASC').getMany();
    }
    async findByGender(gender) {
        return await this.findAll({
            where: { gender, isActive: true },
            order: { firstName: 'ASC' },
        });
    }
    async getPatientStats() {
        const total = await this.count({ where: { isActive: true } });
        // Gender stats
        const maleCount = await this.count({ where: { gender: 'male', isActive: true } });
        const femaleCount = await this.count({ where: { gender: 'female', isActive: true } });
        const otherCount = total - maleCount - femaleCount;
        // Age group stats (simplified - would need more complex query for accurate age calculation)
        const currentYear = new Date().getFullYear();
        const under18Date = new Date(`${currentYear - 18}-01-01`);
        const seniorDate = new Date(`${currentYear - 65}-01-01`);
        const under18Count = await this.count({
            where: {
                isActive: true,
                dateOfBirth: { $gte: under18Date },
            },
        });
        const seniorCount = await this.count({
            where: {
                isActive: true,
                dateOfBirth: { $lte: seniorDate },
            },
        });
        const adultCount = total - under18Count - seniorCount;
        return {
            total,
            byGender: {
                male: maleCount,
                female: femaleCount,
                other: otherCount,
            },
            byAgeGroup: {
                under18: under18Count,
                adult: adultCount,
                senior: seniorCount,
            },
        };
    }
    async deactivatePatient(id) {
        return await this.update(id, { isActive: false });
    }
    async activatePatient(id) {
        return await this.update(id, { isActive: true });
    }
}
exports.PatientRepository = PatientRepository;
