import { FindOneOptions } from 'typeorm';
import { BaseRepository } from './base.repository';
import { User } from '../models/User.model';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({
      where: { email, isActive: true },
    });
  }

  async findByEmailWithRelations(email: string): Promise<User | null> {
    return await this.findOne({
      where: { email, isActive: true },
      relations: ['patient', 'doctor'],
    });
  }

  async findByIdWithRelations(id: string): Promise<User | null> {
    return await this.findById(id, {
      relations: ['patient', 'doctor'],
    });
  }

  async findActiveUsers(): Promise<User[]> {
    return await this.findAll({
      where: { isActive: true },
      relations: ['patient', 'doctor'],
    });
  }

  async findByRole(role: string): Promise<User[]> {
    return await this.findAll({
      where: { role: role as any, isActive: true },
      relations: ['patient', 'doctor'],
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.update(id, { lastLogin: new Date() });
  }

  async deactivateUser(id: string): Promise<User | null> {
    return await this.update(id, { isActive: false });
  }

  async activateUser(id: string): Promise<User | null> {
    return await this.update(id, { isActive: true });
  }

  async searchUsers(searchTerm: string): Promise<User[]> {
    return await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.patient', 'patient')
      .leftJoinAndSelect('user.doctor', 'doctor')
      .where('user.isActive = :isActive', { isActive: true })
      .andWhere(
        '(user.email ILIKE :searchTerm OR patient.firstName ILIKE :searchTerm OR patient.lastName ILIKE :searchTerm OR doctor.firstName ILIKE :searchTerm OR doctor.lastName ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .getMany();
  }
}