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
    async fuzzySearchByDepartment(searchTerm) {
        const normalizedSearch = searchTerm.toLowerCase().trim();
        return await this.repository
            .createQueryBuilder('doctor')
            .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
            .andWhere(`(
          LOWER(doctor.department) ILIKE :exactMatch OR
          LOWER(doctor.department) ILIKE :startsWith OR
          LOWER(doctor.department) ILIKE :contains OR
          LOWER(doctor.specialization) ILIKE :exactMatch OR
          LOWER(doctor.specialization) ILIKE :startsWith OR
          LOWER(doctor.specialization) ILIKE :contains
        )`, {
            exactMatch: normalizedSearch,
            startsWith: `${normalizedSearch}%`,
            contains: `%${normalizedSearch}%`
        })
            .orderBy(`
        CASE 
          WHEN LOWER(doctor.department) = :normalizedSearch THEN 1
          WHEN LOWER(doctor.specialization) = :normalizedSearch THEN 2
          WHEN LOWER(doctor.department) ILIKE :startsWith THEN 3
          WHEN LOWER(doctor.specialization) ILIKE :startsWith THEN 4
          WHEN LOWER(doctor.department) ILIKE :contains THEN 5
          WHEN LOWER(doctor.specialization) ILIKE :contains THEN 6
          ELSE 7
        END
      `)
            .addOrderBy('doctor.rating', 'DESC')
            .setParameters({ normalizedSearch, startsWith: `${normalizedSearch}%`, contains: `%${normalizedSearch}%` })
            .getMany();
    }
    async searchDoctorsByName(name) {
        const normalizedName = name.toLowerCase().trim();
        return await this.repository
            .createQueryBuilder('doctor')
            .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
            .andWhere(`(
          LOWER(doctor.firstName) ILIKE :exactMatch OR
          LOWER(doctor.lastName) ILIKE :exactMatch OR
          LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) ILIKE :exactMatch OR
          LOWER(doctor.firstName) ILIKE :startsWith OR
          LOWER(doctor.lastName) ILIKE :startsWith OR
          LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) ILIKE :startsWith OR
          LOWER(doctor.firstName) ILIKE :contains OR
          LOWER(doctor.lastName) ILIKE :contains OR
          LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) ILIKE :contains
        )`, {
            exactMatch: normalizedName,
            startsWith: `${normalizedName}%`,
            contains: `%${normalizedName}%`
        })
            .orderBy(`
        CASE 
          WHEN LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) = :normalizedName THEN 1
          WHEN LOWER(doctor.firstName) = :normalizedName THEN 2
          WHEN LOWER(doctor.lastName) = :normalizedName THEN 3
          WHEN LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) ILIKE :startsWith THEN 4
          WHEN LOWER(doctor.firstName) ILIKE :startsWith THEN 5
          WHEN LOWER(doctor.lastName) ILIKE :startsWith THEN 6
          ELSE 7
        END
      `)
            .addOrderBy('doctor.rating', 'DESC')
            .setParameters({ normalizedName, startsWith: `${normalizedName}%`, contains: `%${normalizedName}%` })
            .getMany();
    }
}
exports.DoctorRepository = DoctorRepository;
