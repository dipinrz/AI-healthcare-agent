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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LabResult = exports.LabResultStatus = void 0;
const typeorm_1 = require("typeorm");
const Patient_1 = require("./Patient");
const Doctor_1 = require("./Doctor");
var LabResultStatus;
(function (LabResultStatus) {
    LabResultStatus["NORMAL"] = "normal";
    LabResultStatus["ABNORMAL"] = "abnormal";
    LabResultStatus["CRITICAL"] = "critical";
    LabResultStatus["LOW"] = "low";
    LabResultStatus["HIGH"] = "high";
    LabResultStatus["PENDING"] = "pending";
})(LabResultStatus || (exports.LabResultStatus = LabResultStatus = {}));
let LabResult = class LabResult {
};
exports.LabResult = LabResult;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], LabResult.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Patient_1.Patient, patient => patient.labResults),
    (0, typeorm_1.JoinColumn)({ name: 'patientId' }),
    __metadata("design:type", typeof (_a = typeof Patient_1.Patient !== "undefined" && Patient_1.Patient) === "function" ? _a : Object)
], LabResult.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Doctor_1.Doctor, doctor => doctor.labResults, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'orderedById' }),
    __metadata("design:type", typeof (_b = typeof Doctor_1.Doctor !== "undefined" && Doctor_1.Doctor) === "function" ? _b : Object)
], LabResult.prototype, "orderedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], LabResult.prototype, "testName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100 }),
    __metadata("design:type", String)
], LabResult.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], LabResult.prototype, "unit", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], LabResult.prototype, "referenceRange", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: LabResultStatus,
        default: LabResultStatus.PENDING
    }),
    __metadata("design:type", String)
], LabResult.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], LabResult.prototype, "testDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], LabResult.prototype, "resultDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LabResult.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], LabResult.prototype, "labFacility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], LabResult.prototype, "interpretation", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LabResult.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LabResult.prototype, "updatedAt", void 0);
exports.LabResult = LabResult = __decorate([
    (0, typeorm_1.Entity)('labresults')
], LabResult);
