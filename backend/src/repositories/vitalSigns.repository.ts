import { BaseRepository } from './base.repository';
import { VitalSigns } from '../models/VitalSigns.model';

export class VitalSignsRepository extends BaseRepository<VitalSigns> {
  constructor() {
    super(VitalSigns);
  }

  async findByPatientId(patientId: string): Promise<VitalSigns[]> {
    return await this.repository
      .createQueryBuilder('vitals')
      .leftJoinAndSelect('vitals.patient', 'patient')
      .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
      .where('patient.id = :patientId', { patientId })
      .orderBy('vitals.recordedDate', 'DESC')
      .getMany();
  }

  async findByDoctorId(doctorId: string): Promise<VitalSigns[]> {
    return await this.repository
      .createQueryBuilder('vitals')
      .leftJoinAndSelect('vitals.patient', 'patient')
      .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
      .where('recordedBy.id = :doctorId', { doctorId })
      .orderBy('vitals.recordedDate', 'DESC')
      .getMany();
  }

  async findByPatientAndDateRange(
    patientId: string,
    startDate: Date,
    endDate: Date
  ): Promise<VitalSigns[]> {
    return await this.repository
      .createQueryBuilder('vitals')
      .leftJoinAndSelect('vitals.patient', 'patient')
      .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('vitals.recordedDate >= :startDate', { startDate })
      .andWhere('vitals.recordedDate <= :endDate', { endDate })
      .orderBy('vitals.recordedDate', 'DESC')
      .getMany();
  }

  async findLatestByPatientId(patientId: string, limit: number = 1): Promise<VitalSigns[]> {
    return await this.repository
      .createQueryBuilder('vitals')
      .leftJoinAndSelect('vitals.patient', 'patient')
      .leftJoinAndSelect('vitals.recordedBy', 'recordedBy')
      .where('patient.id = :patientId', { patientId })
      .orderBy('vitals.recordedDate', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getVitalSignsTrends(patientId: string, days: number = 30): Promise<VitalSigns[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.findByPatientAndDateRange(patientId, startDate, new Date());
  }
}