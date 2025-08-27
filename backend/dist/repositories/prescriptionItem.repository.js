"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionItemRepository = void 0;
const PrescriptionItem_model_1 = require("../models/PrescriptionItem.model");
const base_repository_1 = require("./base.repository");
class PrescriptionItemRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(PrescriptionItem_model_1.PrescriptionItem);
    }
    async findByPrescriptionId(prescriptionId) {
        return await this.repository
            .createQueryBuilder('prescriptionItem')
            .leftJoinAndSelect('prescriptionItem.medication', 'medication')
            .where('prescriptionItem.prescriptionId = :prescriptionId', { prescriptionId })
            .orderBy('prescriptionItem.createdAt', 'ASC')
            .getMany();
    }
    async findByMedicationId(medicationId) {
        return await this.repository
            .createQueryBuilder('prescriptionItem')
            .leftJoinAndSelect('prescriptionItem.prescription', 'prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .where('prescriptionItem.medicationId = :medicationId', { medicationId })
            .orderBy('prescriptionItem.createdAt', 'DESC')
            .getMany();
    }
    async deletePrescriptionItems(prescriptionId) {
        await this.repository
            .createQueryBuilder()
            .delete()
            .from(PrescriptionItem_model_1.PrescriptionItem)
            .where('prescriptionId = :prescriptionId', { prescriptionId })
            .execute();
    }
    async createBulkPrescriptionItems(prescriptionItems) {
        const entities = this.repository.create(prescriptionItems);
        return await this.repository.save(entities);
    }
}
exports.PrescriptionItemRepository = PrescriptionItemRepository;
