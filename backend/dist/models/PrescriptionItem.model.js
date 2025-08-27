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
exports.PrescriptionItem = void 0;
const typeorm_1 = require("typeorm");
const Prescription_model_1 = require("./Prescription.model");
const Medication_model_1 = require("./Medication.model");
let PrescriptionItem = class PrescriptionItem {
};
exports.PrescriptionItem = PrescriptionItem;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "dosage", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "frequency", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "duration", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "instructions", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PrescriptionItem.prototype, "quantity", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PrescriptionItem.prototype, "refills", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], PrescriptionItem.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PrescriptionItem.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PrescriptionItem.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Prescription_model_1.Prescription, prescription => prescription.prescriptionItems, { onDelete: 'CASCADE' }),
    __metadata("design:type", Prescription_model_1.Prescription)
], PrescriptionItem.prototype, "prescription", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Medication_model_1.Medication),
    __metadata("design:type", Medication_model_1.Medication)
], PrescriptionItem.prototype, "medication", void 0);
exports.PrescriptionItem = PrescriptionItem = __decorate([
    (0, typeorm_1.Entity)()
], PrescriptionItem);
