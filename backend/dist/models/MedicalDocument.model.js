"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MedicalDocument = exports.DocumentType = void 0;
const typeorm_1 = require("typeorm");
const Patient_model_1 = require("./Patient.model");
const Doctor_model_1 = require("./Doctor.model");
var DocumentType;
(function (DocumentType) {
    DocumentType["LAB_RESULT"] = "lab_result";
    DocumentType["IMAGING"] = "imaging";
    DocumentType["PHYSICAL_EXAM"] = "physical_exam";
    DocumentType["PRESCRIPTION"] = "prescription";
    DocumentType["CONSULTATION_NOTE"] = "consultation_note";
    DocumentType["DISCHARGE_SUMMARY"] = "discharge_summary";
    DocumentType["REFERRAL"] = "referral";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
let MedicalDocument = class MedicalDocument {
};
exports.MedicalDocument = MedicalDocument;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MedicalDocument.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Patient_model_1.Patient, patient => patient.medicalDocuments),
    (0, typeorm_1.JoinColumn)({ name: 'patientId' }),
    __metadata("design:type", Patient_model_1.Patient)
], MedicalDocument.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Doctor_model_1.Doctor, doctor => doctor.medicalDocuments, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'createdById' }),
    __metadata("design:type", Doctor_model_1.Doctor)
], MedicalDocument.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], MedicalDocument.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: DocumentType,
        default: DocumentType.OTHER
    }),
    __metadata("design:type", String)
], MedicalDocument.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], MedicalDocument.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], MedicalDocument.prototype, "documentDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500, nullable: true }),
    __metadata("design:type", String)
], MedicalDocument.prototype, "filePath", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], MedicalDocument.prototype, "fileName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], MedicalDocument.prototype, "fileType", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], MedicalDocument.prototype, "fileSize", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], MedicalDocument.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], MedicalDocument.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MedicalDocument.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], MedicalDocument.prototype, "updatedAt", void 0);
exports.MedicalDocument = MedicalDocument = __decorate([
    (0, typeorm_1.Entity)('medicaldocuments')
], MedicalDocument);
