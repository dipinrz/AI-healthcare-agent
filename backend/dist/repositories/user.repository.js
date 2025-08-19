"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const base_repository_1 = require("./base.repository");
const User_model_1 = require("../models/User.model");
class UserRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(User_model_1.User);
    }
    async findByEmail(email) {
        return await this.findOne({
            where: { email, isActive: true },
        });
    }
    async findByEmailWithRelations(email) {
        return await this.findOne({
            where: { email, isActive: true },
            relations: ['patient', 'doctor'],
        });
    }
    async findByIdWithRelations(id) {
        return await this.findById(id, {
            relations: ['patient', 'doctor'],
        });
    }
    async findActiveUsers() {
        return await this.findAll({
            where: { isActive: true },
            relations: ['patient', 'doctor'],
        });
    }
    async findByRole(role) {
        return await this.findAll({
            where: { role: role, isActive: true },
            relations: ['patient', 'doctor'],
        });
    }
    async updateLastLogin(id) {
        await this.update(id, { lastLogin: new Date() });
    }
    async deactivateUser(id) {
        return await this.update(id, { isActive: false });
    }
    async activateUser(id) {
        return await this.update(id, { isActive: true });
    }
    async searchUsers(searchTerm) {
        return await this.repository
            .createQueryBuilder('user')
            .leftJoinAndSelect('user.patient', 'patient')
            .leftJoinAndSelect('user.doctor', 'doctor')
            .where('user.isActive = :isActive', { isActive: true })
            .andWhere('(user.email ILIKE :searchTerm OR patient.firstName ILIKE :searchTerm OR patient.lastName ILIKE :searchTerm OR doctor.firstName ILIKE :searchTerm OR doctor.lastName ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` })
            .getMany();
    }
}
exports.UserRepository = UserRepository;
