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
exports.NotificationLog = exports.NotificationReminderType = exports.NotificationStatus = void 0;
const typeorm_1 = require("typeorm");
const Appointment_model_1 = require("./Appointment.model");
const Patient_model_1 = require("./Patient.model");
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["FAILED"] = "failed";
    NotificationStatus["CANCELLED"] = "cancelled";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
var NotificationReminderType;
(function (NotificationReminderType) {
    NotificationReminderType["REMINDER_24H"] = "reminder_24h";
    NotificationReminderType["REMINDER_1H"] = "reminder_1h";
    NotificationReminderType["CONFIRMED"] = "confirmed";
    NotificationReminderType["CANCELLED"] = "cancelled";
    NotificationReminderType["RESCHEDULED"] = "rescheduled";
})(NotificationReminderType || (exports.NotificationReminderType = NotificationReminderType = {}));
let NotificationLog = class NotificationLog {
};
exports.NotificationLog = NotificationLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NotificationLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'appointment_id' }),
    __metadata("design:type", String)
], NotificationLog.prototype, "appointmentId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Appointment_model_1.Appointment),
    (0, typeorm_1.JoinColumn)({ name: 'appointment_id' }),
    __metadata("design:type", Appointment_model_1.Appointment)
], NotificationLog.prototype, "appointment", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'patient_id' }),
    __metadata("design:type", String)
], NotificationLog.prototype, "patientId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Patient_model_1.Patient),
    (0, typeorm_1.JoinColumn)({ name: 'patient_id' }),
    __metadata("design:type", Patient_model_1.Patient)
], NotificationLog.prototype, "patient", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: NotificationReminderType,
        name: 'reminder_type'
    }),
    __metadata("design:type", String)
], NotificationLog.prototype, "reminderType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: NotificationStatus,
        default: NotificationStatus.PENDING,
        name: 'status'
    }),
    __metadata("design:type", String)
], NotificationLog.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'scheduled_for', type: 'timestamp' }),
    __metadata("design:type", Date)
], NotificationLog.prototype, "scheduledFor", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'sent_at', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], NotificationLog.prototype, "sentAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notification_title', nullable: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "notificationTitle", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'notification_body', nullable: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "notificationBody", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'error_message', nullable: true }),
    __metadata("design:type", String)
], NotificationLog.prototype, "errorMessage", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'retry_count', default: 0 }),
    __metadata("design:type", Number)
], NotificationLog.prototype, "retryCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], NotificationLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at' }),
    __metadata("design:type", Date)
], NotificationLog.prototype, "updatedAt", void 0);
exports.NotificationLog = NotificationLog = __decorate([
    (0, typeorm_1.Entity)('notification_logs')
], NotificationLog);
