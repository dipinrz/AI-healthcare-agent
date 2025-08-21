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
exports.NotificationSetting = void 0;
const typeorm_1 = require("typeorm");
const Patient_model_1 = require("./Patient.model");
let NotificationSetting = class NotificationSetting {
};
exports.NotificationSetting = NotificationSetting;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NotificationSetting.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_id' }),
    __metadata("design:type", String)
], NotificationSetting.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Patient_model_1.Patient),
    (0, typeorm_1.JoinColumn)({ name: 'patient_id' }),
    __metadata("design:type", Patient_model_1.Patient)
], NotificationSetting.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notifications_enabled', default: false }),
    __metadata("design:type", Boolean)
], NotificationSetting.prototype, "notificationsEnabled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reminder_24h', default: true }),
    __metadata("design:type", Boolean)
], NotificationSetting.prototype, "reminder24h", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'reminder_1h', default: true }),
    __metadata("design:type", Boolean)
], NotificationSetting.prototype, "reminder1h", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'appointment_confirmed', default: true }),
    __metadata("design:type", Boolean)
], NotificationSetting.prototype, "appointmentConfirmed", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'appointment_cancelled', default: true }),
    __metadata("design:type", Boolean)
], NotificationSetting.prototype, "appointmentCancelled", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'appointment_rescheduled', default: true }),
    __metadata("design:type", Boolean)
], NotificationSetting.prototype, "appointmentRescheduled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], NotificationSetting.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], NotificationSetting.prototype, "updatedAt", void 0);
exports.NotificationSetting = NotificationSetting = __decorate([
    (0, typeorm_1.Entity)('notification_settings')
], NotificationSetting);
