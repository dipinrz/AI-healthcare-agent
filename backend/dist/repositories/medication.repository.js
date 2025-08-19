"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicationRepository = void 0;
const base_repository_1 = require("./base.repository");
const Medication_model_1 = require("../models/Medication.model");
class MedicationRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Medication_model_1.Medication);
    }
    async findByName(name) {
        return await this.findOne({
            where: { name },
        });
    }
    async findByCategory(category) {
        return await this.findAll({
            where: { category },
            order: { name: 'ASC' },
        });
    }
    async findByDosageForm(dosageForm) {
        return await this.findAll({
            where: { dosageForm },
            order: { name: 'ASC' },
        });
    }
    async searchMedications(searchTerm) {
        return await this.repository
            .createQueryBuilder('medication')
            .where('(medication.name ILIKE :searchTerm OR medication.description ILIKE :searchTerm OR medication.category ILIKE :searchTerm OR medication.dosageForm ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` })
            .orderBy('medication.name', 'ASC')
            .getMany();
    }
    async getCategories() {
        const result = await this.repository
            .createQueryBuilder('medication')
            .select('DISTINCT medication.category')
            .where('medication.category IS NOT NULL AND medication.category != \'\'')
            .orderBy('medication.category', 'ASC')
            .getRawMany();
        return result.map(r => r.category);
    }
    async getDosageForms() {
        const result = await this.repository
            .createQueryBuilder('medication')
            .select('DISTINCT medication.dosageForm')
            .where('medication.dosageForm IS NOT NULL AND medication.dosageForm != \'\'')
            .orderBy('medication.dosageForm', 'ASC')
            .getRawMany();
        return result.map(r => r.dosageForm);
    }
    async isInUse(medicationId) {
        // Check if medication is referenced in prescriptions
        const count = await this.repository
            .createQueryBuilder('medication')
            .leftJoin('prescription', 'prescription', 'prescription.medicationId = medication.id')
            .where('medication.id = :medicationId', { medicationId })
            .andWhere('prescription.id IS NOT NULL')
            .getCount();
        return count > 0;
    }
    async findMostPrescribed(limit = 10) {
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
        }, {});
        const dosageFormStats = await this.repository
            .createQueryBuilder('medication')
            .select('medication.dosageForm, COUNT(*) as count')
            .groupBy('medication.dosageForm')
            .getRawMany();
        const byDosageForm = dosageFormStats.reduce((acc, stat) => {
            acc[stat.dosageForm] = parseInt(stat.count);
            return acc;
        }, {});
        return {
            total,
            byCategory,
            byDosageForm,
        };
    }
    async findByStrength(strength) {
        return await this.findAll({
            where: { strength },
            order: { name: 'ASC' },
        });
    }
    async findSimilar(medicationId) {
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
exports.MedicationRepository = MedicationRepository;
