import { BaseRepository } from './base.repository';
import { LabResult } from '../models/LabResult.model';

export class LabResultRepository extends BaseRepository<LabResult> {
  constructor() {
    super(LabResult);
  }

  async findByPatientId(patientId: string): Promise<LabResult[]> {
    return await this.repository
      .createQueryBuilder('labResult')
      .leftJoinAndSelect('labResult.patient', 'patient')
      .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
      .where('patient.id = :patientId', { patientId })
      .orderBy('labResult.testDate', 'DESC')
      .getMany();
  }

  async findByDoctorId(doctorId: string): Promise<LabResult[]> {
    return await this.repository
      .createQueryBuilder('labResult')
      .leftJoinAndSelect('labResult.patient', 'patient')
      .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
      .where('orderedBy.id = :doctorId', { doctorId })
      .orderBy('labResult.testDate', 'DESC')
      .getMany();
  }

  async findByTestName(patientId: string, testName: string): Promise<LabResult[]> {
    return await this.repository
      .createQueryBuilder('labResult')
      .leftJoinAndSelect('labResult.patient', 'patient')
      .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('LOWER(labResult.testName) LIKE LOWER(:testName)', { testName: `%${testName}%` })
      .orderBy('labResult.testDate', 'DESC')
      .getMany();
  }

  async findByStatus(patientId: string, status: string): Promise<LabResult[]> {
    return await this.repository
      .createQueryBuilder('labResult')
      .leftJoinAndSelect('labResult.patient', 'patient')
      .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('labResult.status = :status', { status })
      .orderBy('labResult.testDate', 'DESC')
      .getMany();
  }

  async findAbnormalResults(patientId: string): Promise<LabResult[]> {
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

  async findByDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<LabResult[]> {
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

  async findLatestByPatientId(patientId: string, limit: number = 10): Promise<LabResult[]> {
    return await this.repository
      .createQueryBuilder('labResult')
      .leftJoinAndSelect('labResult.patient', 'patient')
      .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
      .where('patient.id = :patientId', { patientId })
      .orderBy('labResult.testDate', 'DESC')
      .limit(limit)
      .getMany();
  }

  async searchLabResults(patientId: string, searchTerm: string): Promise<LabResult[]> {
    return await this.repository
      .createQueryBuilder('labResult')
      .leftJoinAndSelect('labResult.patient', 'patient')
      .leftJoinAndSelect('labResult.orderedBy', 'orderedBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere(
        '(LOWER(labResult.testName) LIKE LOWER(:searchTerm) OR LOWER(labResult.notes) LIKE LOWER(:searchTerm) OR LOWER(labResult.interpretation) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('labResult.testDate', 'DESC')
      .getMany();
  }

  async getLabStats(patientId?: string) {
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
    const result: { [key: string]: number } = {};
    stats.forEach(stat => {
      result[stat.status] = parseInt(stat.count);
    });

    return result;
  }
}