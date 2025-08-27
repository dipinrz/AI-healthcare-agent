import { PrescriptionItem } from '../models/PrescriptionItem.model';
import { BaseRepository } from './base.repository';

export class PrescriptionItemRepository extends BaseRepository<PrescriptionItem> {
  constructor() {
    super(PrescriptionItem);
  }

  async findByPrescriptionId(prescriptionId: string): Promise<PrescriptionItem[]> {
    return await this.repository
      .createQueryBuilder('prescriptionItem')
      .leftJoinAndSelect('prescriptionItem.medication', 'medication')
      .where('prescriptionItem.prescriptionId = :prescriptionId', { prescriptionId })
      .orderBy('prescriptionItem.createdAt', 'ASC')
      .getMany();
  }

  async findByMedicationId(medicationId: string): Promise<PrescriptionItem[]> {
    return await this.repository
      .createQueryBuilder('prescriptionItem')
      .leftJoinAndSelect('prescriptionItem.prescription', 'prescription')
      .leftJoinAndSelect('prescription.patient', 'patient')
      .leftJoinAndSelect('prescription.doctor', 'doctor')
      .where('prescriptionItem.medicationId = :medicationId', { medicationId })
      .orderBy('prescriptionItem.createdAt', 'DESC')
      .getMany();
  }

  async deletePrescriptionItems(prescriptionId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(PrescriptionItem)
      .where('prescriptionId = :prescriptionId', { prescriptionId })
      .execute();
  }

  async createBulkPrescriptionItems(prescriptionItems: Partial<PrescriptionItem>[]): Promise<PrescriptionItem[]> {
    const entities = this.repository.create(prescriptionItems);
    return await this.repository.save(entities);
  }
}