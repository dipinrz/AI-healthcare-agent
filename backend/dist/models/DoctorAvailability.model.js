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
exports.DoctorAvailability = void 0;
const typeorm_1 = require("typeorm");
const Doctor_model_1 = require("./Doctor.model");
let DoctorAvailability = class DoctorAvailability {
};
exports.DoctorAvailability = DoctorAvailability;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], DoctorAvailability.prototype, "slotId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], DoctorAvailability.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], DoctorAvailability.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], DoctorAvailability.prototype, "isBooked", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DoctorAvailability.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DoctorAvailability.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Doctor_model_1.Doctor, doctor => doctor.availabilitySlots, { onDelete: 'CASCADE' }),
    __metadata("design:type", Doctor_model_1.Doctor)
], DoctorAvailability.prototype, "doctor", void 0);
exports.DoctorAvailability = DoctorAvailability = __decorate([
    (0, typeorm_1.Entity)(),
    (0, typeorm_1.Index)(['doctor', 'startTime'], { unique: true })
], DoctorAvailability);
