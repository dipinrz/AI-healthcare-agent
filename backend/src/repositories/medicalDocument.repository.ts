import { BaseRepository } from './base.repository';
import { MedicalDocument, DocumentType } from '../models/MedicalDocument.model';

export class MedicalDocumentRepository extends BaseRepository<MedicalDocument> {
  constructor() {
    super(MedicalDocument);
  }

  async findByPatientId(patientId: string): Promise<MedicalDocument[]> {
    return await this.repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('document.isActive = :isActive', { isActive: true })
      .orderBy('document.documentDate', 'DESC')
      .getMany();
  }

  async findByDoctorId(doctorId: string): Promise<MedicalDocument[]> {
    return await this.repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .where('createdBy.id = :doctorId', { doctorId })
      .andWhere('document.isActive = :isActive', { isActive: true })
      .orderBy('document.documentDate', 'DESC')
      .getMany();
  }

  async findByType(patientId: string, type: DocumentType): Promise<MedicalDocument[]> {
    return await this.repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('document.type = :type', { type })
      .andWhere('document.isActive = :isActive', { isActive: true })
      .orderBy('document.documentDate', 'DESC')
      .getMany();
  }

  async findByPatientAndDoctor(patientId: string, doctorId: string): Promise<MedicalDocument[]> {
    return await this.repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('createdBy.id = :doctorId', { doctorId })
      .andWhere('document.isActive = :isActive', { isActive: true })
      .orderBy('document.documentDate', 'DESC')
      .getMany();
  }

  async searchDocuments(patientId: string, searchTerm: string): Promise<MedicalDocument[]> {
    return await this.repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('document.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(document.name) LIKE LOWER(:searchTerm) OR LOWER(document.description) LIKE LOWER(:searchTerm) OR LOWER(document.notes) LIKE LOWER(:searchTerm))',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('document.documentDate', 'DESC')
      .getMany();
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.repository.update(id, { 
      isActive: false,
      updatedAt: new Date()
    });
    return result.affected !== undefined && result.affected > 0;
  }

  async getDocumentStats(patientId?: string) {
    let query = this.repository
      .createQueryBuilder('document')
      .select('document.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('document.isActive = :isActive', { isActive: true });

    if (patientId) {
      query = query
        .leftJoinAndSelect('document.patient', 'patient')
        .andWhere('patient.id = :patientId', { patientId });
    }

    const stats = await query
      .groupBy('document.type')
      .getRawMany();

    // Convert to a more usable format
    const result: { [key: string]: number } = {};
    stats.forEach(stat => {
      result[stat.type] = parseInt(stat.count);
    });

    return result;
  }

  async findRecentDocuments(patientId: string, limit: number = 5): Promise<MedicalDocument[]> {
    return await this.repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.patient', 'patient')
      .leftJoinAndSelect('document.createdBy', 'createdBy')
      .where('patient.id = :patientId', { patientId })
      .andWhere('document.isActive = :isActive', { isActive: true })
      .orderBy('document.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}