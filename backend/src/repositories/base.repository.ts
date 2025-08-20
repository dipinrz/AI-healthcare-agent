import { Repository, FindManyOptions, FindOneOptions, DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/db.config';
import { logger } from '../config/logger.config';

export abstract class BaseRepository<T> {
  protected repository: Repository<T>;

  constructor(private entityClass: new () => T) {
    this.repository = AppDataSource.getRepository(entityClass);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    try {
      return await this.repository.find(options);
    } catch (error) {
      logger.error(`Error finding all ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  async findById(id: string, options?: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne({
        where: { id } as any,
        ...options,
      });
    } catch (error) {
      logger.error(`Error finding ${this.entityClass.name} by ID:`, error);
      throw error;
    }
  }

  async findOne(options: FindOneOptions<T>): Promise<T | null> {
    try {
      return await this.repository.findOne(options);
    } catch (error) {
      logger.error(`Error finding one ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  async create(data: DeepPartial<T>): Promise<T> {
    try {
      const entity = this.repository.create(data);
      return await this.repository.save(entity);
    } catch (error) {
      logger.error(`Error creating ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  async update(id: string, data: DeepPartial<T>): Promise<T | null> {
    try {
      await this.repository.update(id, data as any);
      return await this.findById(id);
    } catch (error) {
      logger.error(`Error updating ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.repository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error) {
      logger.error(`Error deleting ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  async count(options?: FindManyOptions<T>): Promise<number> {
    try {
      return await this.repository.count(options);
    } catch (error) {
      logger.error(`Error counting ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  async exists(options: FindOneOptions<T>): Promise<boolean> {
    try {
      const entity = await this.repository.findOne(options);
      return !!entity;
    } catch (error) {
      logger.error(`Error checking existence of ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    options?: FindManyOptions<T>
  ): Promise<{ data: T[]; total: number; page: number; limit: number; pages: number }> {
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
    } catch (error) {
      logger.error(`Error finding paginated ${this.entityClass.name}:`, error);
      throw error;
    }
  }

  // Public method to access repository for complex operations
  getRepository(): Repository<T> {
    return this.repository;
  }

  // Bulk delete method for services
  async deleteAll(conditions?: any): Promise<number> {
    try {
      const result = await this.repository.delete(conditions || {});
      return result.affected || 0;
    } catch (error) {
      logger.error(`Error deleting all ${this.entityClass.name}:`, error);
      throw error;
    }
  }
}