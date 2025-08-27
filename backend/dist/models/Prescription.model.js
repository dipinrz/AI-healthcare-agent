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
exports.Prescription = exports.PrescriptionStatus = void 0;
const typeorm_1 = require("typeorm");
const Patient_model_1 = require("./Patient.model");
const Doctor_model_1 = require("./Doctor.model");
const PrescriptionItem_model_1 = require("./PrescriptionItem.model");
var PrescriptionStatus;
(function (PrescriptionStatus) {
    PrescriptionStatus["ACTIVE"] = "active";
    PrescriptionStatus["COMPLETED"] = "completed";
    PrescriptionStatus["DISCONTINUED"] = "discontinued";
    PrescriptionStatus["ON_HOLD"] = "on_hold";
})(PrescriptionStatus || (exports.PrescriptionStatus = PrescriptionStatus = {}));
let Prescription = class Prescription {
};
exports.Prescription = Prescription;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Prescription.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "prescriptionNotes", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: PrescriptionStatus,
        default: PrescriptionStatus.ACTIVE
    }),
    __metadata("design:type", String)
], Prescription.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], Prescription.prototype, "startDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], Prescription.prototype, "endDate", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Prescription.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Prescription.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Prescription.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Patient_model_1.Patient, patient => patient.prescriptions),
    __metadata("design:type", Patient_model_1.Patient)
], Prescription.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Doctor_model_1.Doctor, doctor => doctor.prescriptions),
    __metadata("design:type", Doctor_model_1.Doctor)
], Prescription.prototype, "doctor", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => PrescriptionItem_model_1.PrescriptionItem, prescriptionItem => prescriptionItem.prescription, { cascade: true }),
    __metadata("design:type", Array)
], Prescription.prototype, "prescriptionItems", void 0);
exports.Prescription = Prescription = __decorate([
    (0, typeorm_1.Entity)()
], Prescription);
