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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatLog = exports.AgentType = exports.MessageType = void 0;
const typeorm_1 = require("typeorm");
const Patient_1 = require("./Patient");
var MessageType;
(function (MessageType) {
    MessageType["USER"] = "user";
    MessageType["AGENT"] = "agent";
    MessageType["SYSTEM"] = "system";
})(MessageType || (exports.MessageType = MessageType = {}));
var AgentType;
(function (AgentType) {
    AgentType["ORCHESTRATOR"] = "orchestrator";
    AgentType["FAQ"] = "faq";
    AgentType["APPOINTMENT"] = "appointment";
    AgentType["MEDICATION"] = "medication";
    AgentType["EMOTIONAL_SUPPORT"] = "emotional_support";
    AgentType["ESCALATION"] = "escalation";
})(AgentType || (exports.AgentType = AgentType = {}));
let ChatLog = class ChatLog {
};
exports.ChatLog = ChatLog;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], ChatLog.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChatLog.prototype, "sessionId", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: MessageType
    }),
    __metadata("design:type", String)
], ChatLog.prototype, "messageType", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: AgentType,
        nullable: true
    }),
    __metadata("design:type", String)
], ChatLog.prototype, "agentType", void 0);
__decorate([
    (0, typeorm_1.Column)('text'),
    __metadata("design:type", String)
], ChatLog.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)('json', { nullable: true }),
    __metadata("design:type", Object)
], ChatLog.prototype, "metadata", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' }),
    __metadata("design:type", Date)
], ChatLog.prototype, "timestamp", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChatLog.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Patient_1.Patient, patient => patient.chatLogs, { nullable: true }),
    __metadata("design:type", typeof (_a = typeof Patient_1.Patient !== "undefined" && Patient_1.Patient) === "function" ? _a : Object)
], ChatLog.prototype, "patient", void 0);
exports.ChatLog = ChatLog = __decorate([
    (0, typeorm_1.Entity)()
], ChatLog);
