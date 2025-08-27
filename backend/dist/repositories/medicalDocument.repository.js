"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalDocumentRepository = void 0;
const base_repository_1 = require("./base.repository");
const MedicalDocument_model_1 = require("../models/MedicalDocument.model");
class MedicalDocumentRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(MedicalDocument_model_1.MedicalDocument);
    }
    async findByPatientId(patientId) {
        return await this.repository
            .createQueryBuilder('document')
            .leftJoinAndSelect('document.patient', 'patient')
            .leftJoinAndSelect('document.createdBy', 'createdBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('document.isActive = :isActive', { isActive: true })
            .orderBy('document.documentDate', 'DESC')
            .getMany();
    }
    async findByDoctorId(doctorId) {
        return await this.repository
            .createQueryBuilder('document')
            .leftJoinAndSelect('document.patient', 'patient')
            .leftJoinAndSelect('document.createdBy', 'createdBy')
            .where('createdBy.id = :doctorId', { doctorId })
            .andWhere('document.isActive = :isActive', { isActive: true })
            .orderBy('document.documentDate', 'DESC')
            .getMany();
    }
    async findByType(patientId, type) {
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
    async findByPatientAndDoctor(patientId, doctorId) {
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
    async searchDocuments(patientId, searchTerm) {
        return await this.repository
            .createQueryBuilder('document')
            .leftJoinAndSelect('document.patient', 'patient')
            .leftJoinAndSelect('document.createdBy', 'createdBy')
            .where('patient.id = :patientId', { patientId })
            .andWhere('document.isActive = :isActive', { isActive: true })
            .andWhere('(LOWER(document.name) LIKE LOWER(:searchTerm) OR LOWER(document.description) LIKE LOWER(:searchTerm) OR LOWER(document.notes) LIKE LOWER(:searchTerm))', { searchTerm: `%${searchTerm}%` })
            .orderBy('document.documentDate', 'DESC')
            .getMany();
    }
    async softDelete(id) {
        const result = await this.repository.update(id, {
            isActive: false,
            updatedAt: new Date()
        });
        return result.affected !== undefined && result.affected > 0;
    }
    async getDocumentStats(patientId) {
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
        const result = {};
        stats.forEach(stat => {
            result[stat.type] = parseInt(stat.count);
        });
        return result;
    }
    async findRecentDocuments(patientId, limit = 5) {
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
exports.MedicalDocumentRepository = MedicalDocumentRepository;
