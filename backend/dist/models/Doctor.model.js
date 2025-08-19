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
exports.Doctor = void 0;
const typeorm_1 = require("typeorm");
const Appointment_model_1 = require("./Appointment.model");
const Prescription_model_1 = require("./Prescription.model");
const VitalSigns_model_1 = require("./VitalSigns.model");
const LabResult_model_1 = require("./LabResult.model");
const MedicalDocument_model_1 = require("./MedicalDocument.model");
const DoctorAvailability_model_1 = require("./DoctorAvailability.model");
let Doctor = class Doctor {
};
exports.Doctor = Doctor;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Doctor.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Doctor.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Doctor.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Doctor.prototype, "specialization", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Doctor.prototype, "qualification", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Doctor.prototype, "experience", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true }),
    __metadata("design:type", String)
], Doctor.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Doctor.prototype, "phone", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Doctor.prototype, "department", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { nullable: true }),
    __metadata("design:type", String)
], Doctor.prototype, "bio", void 0);
__decorate([
    (0, typeorm_1.Column)('decimal', { precision: 2, scale: 1, default: 0 }),
    __metadata("design:type", Number)
], Doctor.prototype, "rating", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Doctor.prototype, "isAvailable", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], Doctor.prototype, "availability", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Doctor.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Doctor.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Appointment_model_1.Appointment, appointment => appointment.doctor),
    __metadata("design:type", Array)
], Doctor.prototype, "appointments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Prescription_model_1.Prescription, prescription => prescription.doctor),
    __metadata("design:type", Array)
], Doctor.prototype, "prescriptions", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => VitalSigns_model_1.VitalSigns, vitalSigns => vitalSigns.recordedBy),
    __metadata("design:type", Array)
], Doctor.prototype, "vitalSigns", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => LabResult_model_1.LabResult, labResult => labResult.orderedBy),
    __metadata("design:type", Array)
], Doctor.prototype, "labResults", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => MedicalDocument_model_1.MedicalDocument, document => document.createdBy),
    __metadata("design:type", Array)
], Doctor.prototype, "medicalDocuments", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => DoctorAvailability_model_1.DoctorAvailability, availability => availability.doctor),
    __metadata("design:type", Array)
], Doctor.prototype, "availabilitySlots", void 0);
exports.Doctor = Doctor = __decorate([
    (0, typeorm_1.Entity)()
], Doctor);
