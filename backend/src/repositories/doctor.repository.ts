import { BaseRepository } from './base.repository';
import { Doctor } from '../models/Doctor.model';

export class DoctorRepository extends BaseRepository<Doctor> {
  constructor() {
    super(Doctor);
  }

  async findByEmail(email: string): Promise<Doctor | null> {
    return await this.findOne({
      where: { email },
    });
  }

  async findAvailableDoctors(): Promise<Doctor[]> {
    return await this.findAll({
      where: { isAvailable: true },
      order: { firstName: 'ASC' },
    });
  }

  async findBySpecialization(specialization: string): Promise<Doctor[]> {
    return await this.findAll({
      where: { specialization, isAvailable: true },
      order: { rating: 'DESC' },
    });
  }

  async findByDepartment(department: string): Promise<Doctor[]> {
    return await this.findAll({
      where: { department, isAvailable: true },
      order: { firstName: 'ASC' },
    });
  }

  async searchDoctors(searchTerm: string): Promise<Doctor[]> {
    return await this.repository
      .createQueryBuilder('doctor')
      .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere(
        '(doctor.firstName ILIKE :searchTerm OR doctor.lastName ILIKE :searchTerm OR doctor.specialization ILIKE :searchTerm OR doctor.department ILIKE :searchTerm OR doctor.qualification ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('doctor.rating', 'DESC')
      .getMany();
  }

  async findTopRatedDoctors(limit: number = 10): Promise<Doctor[]> {
    return await this.findAll({
      where: { isAvailable: true },
      order: { rating: 'DESC' },
      take: limit,
    });
  }

  async findDoctorsWithMinRating(minRating: number): Promise<Doctor[]> {
    return await this.repository
      .createQueryBuilder('doctor')
      .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('doctor.rating >= :minRating', { minRating })
      .orderBy('doctor.rating', 'DESC')
      .getMany();
  }

  async findByExperienceRange(minExperience: number, maxExperience?: number): Promise<Doctor[]> {
    const query = this.repository
      .createQueryBuilder('doctor')
      .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere('doctor.experience >= :minExperience', { minExperience });

    if (maxExperience) {
      query.andWhere('doctor.experience <= :maxExperience', { maxExperience });
    }

    return await query.orderBy('doctor.experience', 'DESC').getMany();
  }

  async getDoctorStats(): Promise<{
    total: number;
    available: number;
    bySpecialization: Record<string, number>;
    byDepartment: Record<string, number>;
    averageRating: number;
    averageExperience: number;
  }> {
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
    }, {} as Record<string, number>);

    // Get department distribution
    const departmentStats = await this.repository
      .createQueryBuilder('doctor')
      .select('doctor.department, COUNT(*) as count')
      .groupBy('doctor.department')
      .getRawMany();

    const byDepartment = departmentStats.reduce((acc, stat) => {
      acc[stat.department] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

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

  async updateAvailability(id: string, isAvailable: boolean): Promise<Doctor | null> {
    return await this.update(id, { isAvailable });
  }

  async updateRating(id: string, rating: number): Promise<Doctor | null> {
    return await this.update(id, { rating });
  }

  async getSpecializationList(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.specialization')
      .where('doctor.specialization IS NOT NULL AND doctor.specialization != \'\'')
      .orderBy('doctor.specialization', 'ASC')
      .getRawMany();

    return result.map(r => r.specialization);
  }

  async getDepartmentList(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('doctor')
      .select('DISTINCT doctor.department')
      .where('doctor.department IS NOT NULL AND doctor.department != \'\'')
      .orderBy('doctor.department', 'ASC')
      .getRawMany();

    return result.map(r => r.department);
  }

  async fuzzySearchByDepartment(searchTerm: string): Promise<Doctor[]> {
    const normalizedSearch = searchTerm.toLowerCase().trim();
    
    return await this.repository
      .createQueryBuilder('doctor')
      .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere(
        `(
          LOWER(doctor.department) ILIKE :exactMatch OR
          LOWER(doctor.department) ILIKE :startsWith OR
          LOWER(doctor.department) ILIKE :contains OR
          LOWER(doctor.specialization) ILIKE :exactMatch OR
          LOWER(doctor.specialization) ILIKE :startsWith OR
          LOWER(doctor.specialization) ILIKE :contains
        )`,
        {
          exactMatch: normalizedSearch,
          startsWith: `${normalizedSearch}%`,
          contains: `%${normalizedSearch}%`
        }
      )
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

  async searchDoctorsByName(name: string): Promise<Doctor[]> {
    const normalizedName = name.toLowerCase().trim();
    
    return await this.repository
      .createQueryBuilder('doctor')
      .where('doctor.isAvailable = :isAvailable', { isAvailable: true })
      .andWhere(
        `(
          LOWER(doctor.firstName) ILIKE :exactMatch OR
          LOWER(doctor.lastName) ILIKE :exactMatch OR
          LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) ILIKE :exactMatch OR
          LOWER(doctor.firstName) ILIKE :startsWith OR
          LOWER(doctor.lastName) ILIKE :startsWith OR
          LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) ILIKE :startsWith OR
          LOWER(doctor.firstName) ILIKE :contains OR
          LOWER(doctor.lastName) ILIKE :contains OR
          LOWER(CONCAT(doctor.firstName, ' ', doctor.lastName)) ILIKE :contains
        )`,
        {
          exactMatch: normalizedName,
          startsWith: `${normalizedName}%`,
          contains: `%${normalizedName}%`
        }
      )
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