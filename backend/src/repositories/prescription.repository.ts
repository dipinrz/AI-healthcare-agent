import { BaseRepository } from './base.repository';
import { Prescription } from '../models/Prescription.model';

export class PrescriptionRepository extends BaseRepository<Prescription> {
  constructor() {
    super(Prescription);
  }

  async findByPatientId(patientId: string): Promise<Prescription[]> {
    return await this.repository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .leftJoinAndSelect('prescription.medication', 'medication')
      .where('patient.id = :patientId', { patientId })
      .orderBy('prescription.createdAt', 'DESC')
      .getMany();
  }

  async findByDoctorId(doctorId: string): Promise<Prescription[]> {
    return await this.repository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .leftJoinAndSelect('prescription.medication', 'medication')
      .where('doctor.id = :doctorId', { doctorId })
      .orderBy('prescription.createdAt', 'DESC')
      .getMany();
  }

  async findByMedicationId(medicationId: string): Promise<Prescription[]> {
    return await this.repository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .leftJoinAndSelect('prescription.medication', 'medication')
      .where('medication.id = :medicationId', { medicationId })
      .orderBy('prescription.createdAt', 'DESC')
      .getMany();
  }

  async findActiveByPatientId(patientId: string): Promise<Prescription[]> {
    return await this.repository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .leftJoinAndSelect('prescription.medication', 'medication')
      .where('patient.id = :patientId', { patientId })
      .andWhere('prescription.status = :status', { status: 'active' })
      .orderBy('prescription.createdAt', 'DESC')
      .getMany();
  }

  async findByStatus(status: string): Promise<Prescription[]> {
    return await this.repository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .leftJoinAndSelect('prescription.medication', 'medication')
      .where('prescription.status = :status', { status })
      .orderBy('prescription.createdAt', 'DESC')
      .getMany();
  }

  async searchPrescriptions(searchTerm: string): Promise<Prescription[]> {
    return await this.repository
      .createQueryBuilder('prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .leftJoinAndSelect('prescription.medication', 'medication')
      .where(
        '(patient.firstName ILIKE :searchTerm OR patient.lastName ILIKE :searchTerm OR doctor.firstName ILIKE :searchTerm OR doctor.lastName ILIKE :searchTerm OR medication.name ILIKE :searchTerm OR prescription.notes ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('prescription.createdAt', 'DESC')
      .getMany();
  }

  async getPrescriptionStats() {
    const total = await this.count();
    
    const active = await this.count({ 
      where: { status: 'active' as any } 
    });
    
    const completed = await this.count({ 
      where: { status: 'completed' as any } 
    });
    
    const cancelled = await this.count({ 
      where: { status: 'cancelled' as any } 
    });

    return {
      total,
      active,
      completed,
      cancelled,
    };
  }
}