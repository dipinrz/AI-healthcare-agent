"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRepository = void 0;
const db_config_1 = require("../config/db.config");
const logger_config_1 = require("../config/logger.config");
class BaseRepository {
    constructor(entityClass) {
        this.entityClass = entityClass;
        this.repository = db_config_1.AppDataSource.getRepository(entityClass);
    }
    async findAll(options) {
        try {
            return await this.repository.find(options);
        }
        catch (error) {
            logger_config_1.logger.error(`Error finding all ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    async findById(id, options) {
        try {
            return await this.repository.findOne({
                where: { id },
                ...options,
            });
        }
        catch (error) {
            logger_config_1.logger.error(`Error finding ${this.entityClass.name} by ID:`, error);
            throw error;
        }
    }
    async findOne(options) {
        try {
            return await this.repository.findOne(options);
        }
        catch (error) {
            logger_config_1.logger.error(`Error finding one ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    async create(data) {
        try {
            const entity = this.repository.create(data);
            return await this.repository.save(entity);
        }
        catch (error) {
            logger_config_1.logger.error(`Error creating ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    async update(id, data) {
        try {
            await this.repository.update(id, data);
            return await this.findById(id);
        }
        catch (error) {
            logger_config_1.logger.error(`Error updating ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    async delete(id) {
        try {
            const result = await this.repository.delete(id);
            return (result.affected ?? 0) > 0;
        }
        catch (error) {
            logger_config_1.logger.error(`Error deleting ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    async count(options) {
        try {
            return await this.repository.count(options);
        }
        catch (error) {
            logger_config_1.logger.error(`Error counting ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    async exists(options) {
        try {
            const entity = await this.repository.findOne(options);
            return !!entity;
        }
        catch (error) {
            logger_config_1.logger.error(`Error checking existence of ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    async findWithPagination(page = 1, limit = 10, options) {
        try {
            const skip = (page - 1) * limit;
            const [data, total] = await this.repository.findAndCount({
                ...options,
                skip,
                take: limit,
            });
            const pages = Math.ceil(total / limit);
            return {
                data,
                total,
                page,
                limit,
                pages,
            };
        }
        catch (error) {
            logger_config_1.logger.error(`Error finding paginated ${this.entityClass.name}:`, error);
            throw error;
        }
    }
    // Public method to access repository for complex operations
    getRepository() {
        return this.repository;
    }
    // Bulk delete method for services
    async deleteAll(conditions) {
        try {
            const result = await this.repository.delete(conditions || {});
            return result.affected || 0;
        }
        catch (error) {
            logger_config_1.logger.error(`Error deleting all ${this.entityClass.name}:`, error);
            throw error;
        }
    }
}
exports.BaseRepository = BaseRepository;
