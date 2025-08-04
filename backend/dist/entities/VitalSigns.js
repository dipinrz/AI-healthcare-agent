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
exports.VitalSigns = void 0;
const typeorm_1 = require("typeorm");
const Patient_1 = require("./Patient");
const Doctor_1 = require("./Doctor");
let VitalSigns = class VitalSigns {
};
exports.VitalSigns = VitalSigns;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], VitalSigns.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Patient_1.Patient, patient => patient.vitalSigns),
    (0, typeorm_1.JoinColumn)({ name: 'patientId' }),
    __metadata("design:type", Patient_1.Patient)
], VitalSigns.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Doctor_1.Doctor, doctor => doctor.vitalSigns, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'recordedById' }),
    __metadata("design:type", Doctor_1.Doctor)
], VitalSigns.prototype, "recordedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], VitalSigns.prototype, "recordedDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], VitalSigns.prototype, "systolicBP", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], VitalSigns.prototype, "diastolicBP", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], VitalSigns.prototype, "heartRate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 4, scale: 1, nullable: true }),
    __metadata("design:type", Number)
], VitalSigns.prototype, "temperature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], VitalSigns.prototype, "weight", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2, nullable: true }),
    __metadata("design:type", Number)
], VitalSigns.prototype, "height", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], VitalSigns.prototype, "oxygenSaturation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], VitalSigns.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], VitalSigns.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], VitalSigns.prototype, "updatedAt", void 0);
exports.VitalSigns = VitalSigns = __decorate([
    (0, typeorm_1.Entity)('vitalsigns')
], VitalSigns);
