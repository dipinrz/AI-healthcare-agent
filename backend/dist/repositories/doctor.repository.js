"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorRepository = void 0;
const base_repository_1 = require("./base.repository");
const Doctor_model_1 = require("../models/Doctor.model");
class DoctorRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Doctor_model_1.Doctor);
    }
    async findByEmail(email) {
        return await this.findOne({
            where: { email },
        });
    }
    async findAvailableDoctors() {
        return await this.findAll({
            where: { isAvailable: true },
            order: { firstName: 'ASC' },
        });
    }
    async findBySpecialization(specialization) {
        return await this.findAll({
            where: { specialization, isAvailable: true },
            order: { rating: 'DESC' },
        });
    }
    async findByDepartment(department) {
        return await this.findAll({
            where: { department, isAvailable: true },
            order: { firstName: 'ASC' },
        });
    }
    async searchDoctors(searchTerm) {
        return await this.repository
            .createQueryBuilder('doctor')
            .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
            .andWhere('(doctor.firstName ILIKE :searchTerm OR doctor.lastName ILIKE :searchTerm OR doctor.specialization ILIKE :searchTerm OR doctor.department ILIKE :searchTerm OR doctor.qualification ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` })
            .orderBy('doctor.rating', 'DESC')
            .getMany();
    }
    async findTopRatedDoctors(limit = 10) {
        return await this.findAll({
            where: { isAvailable: true },
            order: { rating: 'DESC' },
            take: limit,
        });
    }
    async findDoctorsWithMinRating(minRating) {
        return await this.repository
            .createQueryBuilder('doctor')
            .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
            .andWhere('doctor.rating >= :minRating', { minRating })
            .orderBy('doctor.rating', 'DESC')
            .getMany();
    }
    async findByExperienceRange(minExperience, maxExperience) {
        const query = this.repository
            .createQueryBuilder('doctor')
            .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
            .andWhere('doctor.experience >= :minExperience', { minExperience });
        if (maxExperience) {
            query.andWhere('doctor.experience <= :maxExperience', { maxExperience });
        }
        return await query.orderBy('doctor.experience', 'DESC').getMany();
    }
    async getDoctorStats() {
        const total = await this.count();
        const available = await this.count({ where: { isAvailable: true } });
        // Get specialization distribution
        const specializationStats = await this.repository
            .createQueryBuilder('doctor')
            .select('doctor.specialization, COUNT(*) as count')
            .groupBy('doctor.specialization')
            .getRawMany();
        const bySpecialization = specializationStats.reduce((acc, stat) => {
            acc[stat.specialization] = parseInt(stat.count);
            return acc;
        }, {});
        // Get department distribution
        const departmentStats = await this.repository
            .createQueryBuilder('doctor')
            .select('doctor.department, COUNT(*) as count')
            .groupBy('doctor.department')
            .getRawMany();
        const byDepartment = departmentStats.reduce((acc, stat) => {
            acc[stat.department] = parseInt(stat.count);
            return acc;
        }, {});
        // Calculate averages
        const avgStats = await this.repository
            .createQueryBuilder('doctor')
            .select('AVG(doctor.rating) as avgRating, AVG(doctor.experience) as avgExperience')
            .getRawOne();
        return {
            total,
            available,
            bySpecialization,
            byDepartment,
            averageRating: parseFloat(avgStats.avgRating || '0'),
            averageExperience: parseFloat(avgStats.avgExperience || '0'),
        };
    }
    async updateAvailability(id, isAvailable) {
        return await this.update(id, { isAvailable });
    }
    async updateRating(id, rating) {
        return await this.update(id, { rating });
    }
    async getSpecializationList() {
        const result = await this.repository
            .createQueryBuilder('doctor')
            .select('DISTINCT doctor.specialization')
            .where('doctor.specialization IS NOT NULL AND doctor.specialization != \'\'')
            .orderBy('doctor.specialization', 'ASC')
            .getRawMany();
        return result.map(r => r.specialization);
    }
    async getDepartmentList() {
        const result = await this.repository
            .createQueryBuilder('doctor')
            .select('DISTINCT doctor.department')
            .where('doctor.department IS NOT NULL AND doctor.department != \'\'')
            .orderBy('doctor.department', 'ASC')
            .getRawMany();
        return result.map(r => r.department);
    }
}
exports.DoctorRepository = DoctorRepository;
