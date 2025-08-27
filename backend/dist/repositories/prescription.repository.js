"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrescriptionRepository = void 0;
const base_repository_1 = require("./base.repository");
const Prescription_model_1 = require("../models/Prescription.model");
class PrescriptionRepository extends base_repository_1.BaseRepository {
    constructor() {
        super(Prescription_model_1.Prescription);
    }
    async findByPatientId(patientId) {
        return await this.repository
            .createQueryBuilder('prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .leftJoinAndSelect('prescription.prescriptionItems', 'prescriptionItems')
            .leftJoinAndSelect('prescriptionItems.medication', 'medication')
            .where('patient.id = :patientId', { patientId })
            .orderBy('prescription.createdAt', 'DESC')
            .getMany();
    }
    async findByDoctorId(doctorId) {
        return await this.repository
            .createQueryBuilder('prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .leftJoinAndSelect('prescription.prescriptionItems', 'prescriptionItems')
            .leftJoinAndSelect('prescriptionItems.medication', 'medication')
            .where('doctor.id = :doctorId', { doctorId })
            .orderBy('prescription.createdAt', 'DESC')
            .getMany();
    }
    async findByMedicationId(medicationId) {
        return await this.repository
            .createQueryBuilder('prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .leftJoinAndSelect('prescription.prescriptionItems', 'prescriptionItems')
            .leftJoinAndSelect('prescriptionItems.medication', 'medication')
            .where('medication.id = :medicationId', { medicationId })
            .orderBy('prescription.createdAt', 'DESC')
            .getMany();
    }
    async findActiveByPatientId(patientId) {
        return await this.repository
            .createQueryBuilder('prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .leftJoinAndSelect('prescription.prescriptionItems', 'prescriptionItems')
            .leftJoinAndSelect('prescriptionItems.medication', 'medication')
            .where('patient.id = :patientId', { patientId })
            .andWhere('prescription.status = :status', { status: 'active' })
            .orderBy('prescription.createdAt', 'DESC')
            .getMany();
    }
    async findByStatus(status) {
        return await this.repository
            .createQueryBuilder('prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .leftJoinAndSelect('prescription.prescriptionItems', 'prescriptionItems')
            .leftJoinAndSelect('prescriptionItems.medication', 'medication')
            .where('prescription.status = :status', { status })
            .orderBy('prescription.createdAt', 'DESC')
            .getMany();
    }
    async searchPrescriptions(searchTerm) {
        return await this.repository
            .createQueryBuilder('prescription')
            .leftJoinAndSelect('prescription.patient', 'patient')
            .leftJoinAndSelect('prescription.doctor', 'doctor')
            .leftJoinAndSelect('prescription.prescriptionItems', 'prescriptionItems')
            .leftJoinAndSelect('prescriptionItems.medication', 'medication')
            .where('(patient.firstName ILIKE :searchTerm OR patient.lastName ILIKE :searchTerm OR doctor.firstName ILIKE :searchTerm OR doctor.lastName ILIKE :searchTerm OR medication.name ILIKE :searchTerm OR prescription.notes ILIKE :searchTerm)', { searchTerm: `%${searchTerm}%` })
            .orderBy('prescription.createdAt', 'DESC')
            .getMany();
    }
    async getPrescriptionStats() {
        const total = await this.count();
        const active = await this.count({
            where: { status: 'active' }
        });
        const completed = await this.count({
            where: { status: 'completed' }
        });
        const discontinued = await this.count({
            where: { status: 'discontinued' }
        });
        return {
            total,
            active,
            completed,
            discontinued,
        };
    }
}
exports.PrescriptionRepository = PrescriptionRepository;
