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
exports.Medication = void 0;
const typeorm_1 = require("typeorm");
let Medication = class Medication {
};
exports.Medication = Medication;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Medication.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Medication.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Medication.prototype, "genericName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Medication.prototype, "brandName", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Medication.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], Medication.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], Medication.prototype, "indications", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], Medication.prototype, "contraindications", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], Medication.prototype, "sideEffects", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], Medication.prototype, "interactions", void 0);
__decorate([
    (0, typeorm_1.Column)('text', { array: true }),
    __metadata("design:type", Array)
], Medication.prototype, "warnings", void 0);
__decorate([
    (0, typeorm_1.Column)('json'),
    __metadata("design:type", Object)
], Medication.prototype, "dosageInfo", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Medication.prototype, "strength", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Medication.prototype, "form", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Medication.prototype, "manufacturer", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], Medication.prototype, "isActive", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Medication.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Medication.prototype, "updatedAt", void 0);
exports.Medication = Medication = __decorate([
    (0, typeorm_1.Entity)()
], Medication);
