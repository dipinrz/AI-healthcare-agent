import { BaseRepository } from './base.repository';
import { Medication } from '../models/Medication.model';

export class MedicationRepository extends BaseRepository<Medication> {
  constructor() {
    super(Medication);
  }

  async findByName(name: string): Promise<Medication | null> {
    return await this.findOne({
      where: { name },
    });
  }

  async findByCategory(category: string): Promise<Medication[]> {
    return await this.findAll({
      where: { category },
      order: { name: 'ASC' },
    });
  }

  async findByDosageForm(dosageForm: string): Promise<Medication[]> {
    return await this.findAll({
      where: { form: dosageForm },
      order: { name: 'ASC' },
    });
  }

  async searchMedications(searchTerm: string): Promise<Medication[]> {
    return await this.repository
      .createQueryBuilder('medication')
      .where(
        '(medication.name ILIKE :searchTerm OR medication.description ILIKE :searchTerm OR medication.category ILIKE :searchTerm OR medication.form ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` }
      )
      .orderBy('medication.name', 'ASC')
      .getMany();
  }

  async getCategories(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('medication')
      .select('DISTINCT medication.category')
      .where('medication.category IS NOT NULL AND medication.category != \'\'')
      .orderBy('medication.category', 'ASC')
      .getRawMany();

    return result.map(r => r.category);
  }

  async getDosageForms(): Promise<string[]> {
    const result = await this.repository
      .createQueryBuilder('medication')
      .select('DISTINCT medication.form')
      .where('medication.form IS NOT NULL AND medication.form != \'\'')
      .orderBy('medication.form', 'ASC')
      .getRawMany();

    return result.map(r => r.form);
  }

  async isInUse(medicationId: string): Promise<boolean> {
    // Check if medication is referenced in prescriptions
    const count = await this.repository
      .createQueryBuilder('medication')
      .leftJoin('prescription', 'prescription', 'prescription.medicationId = medication.id')
      .where('medication.id = :medicationId', { medicationId })
      .andWhere('prescription.id IS NOT NULL')
      .getCount();

    return count > 0;
  }

  async findMostPrescribed(limit: number = 10): Promise<Medication[]> {
    return await this.repository
      .createQueryBuilder('medication')
      .leftJoin('prescription', 'prescription', 'prescription.medicationId = medication.id')
      .select('medication.*')
      .addSelect('COUNT(prescription.id) as prescription_count')
      .groupBy('medication.id')
      .orderBy('prescription_count', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getMedicationStats() {
    const total = await this.count();
    
    const categoryStats = await this.repository
      .createQueryBuilder('medication')
      .select('medication.category, COUNT(*) as count')
      .groupBy('medication.category')
      .getRawMany();

    const byCategory = categoryStats.reduce((acc, stat) => {
      acc[stat.category] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    const dosageFormStats = await this.repository
      .createQueryBuilder('medication')
      .select('medication.form, COUNT(*) as count')
      .groupBy('medication.form')
      .getRawMany();

    const byDosageForm = dosageFormStats.reduce((acc, stat) => {
      acc[stat.form] = parseInt(stat.count);
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      byCategory,
      byDosageForm,
    };
  }

  async findByStrength(strength: string): Promise<Medication[]> {
    return await this.findAll({
      where: { strength } as any,
      order: { name: 'ASC' },
    });
  }

  async findSimilar(medicationId: string): Promise<Medication[]> {
    const medication = await this.findById(medicationId);
    if (!medication) {
      return [];
    }

    return await this.repository
      .createQueryBuilder('medication')
      .where('medication.id != :medicationId', { medicationId })
      .andWhere('medication.category = :category', { category: medication.category })
      .orderBy('medication.name', 'ASC')
      .limit(5)
      .getMany();
  }
}