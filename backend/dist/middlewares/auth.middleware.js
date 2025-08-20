"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDoctorOrAdmin = exports.requireAdmin = exports.requireDoctor = exports.requirePatient = exports.requireRole = exports.authenticateToken = void 0;
const auth_service_1 = require("../services/auth.service");
const User_model_1 = require("../models/User.model");
const messages_1 = require("../constants/messages");
const statusCodes_1 = require("../constants/statusCodes");
const authService = new auth_service_1.AuthService();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            res.status(statusCodes_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: messages_1.MESSAGES.ERROR.TOKEN_REQUIRED
            });
            return;
        }
        const decoded = authService.verifyToken(token);
        (req.user) = decoded;
        next();
    }
    catch (error) {
        res.status(statusCodes_1.HTTP_STATUS.FORBIDDEN).json({
            success: false,
            message: messages_1.MESSAGES.ERROR.INVALID_TOKEN
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!(req.user)) {
            res.status(statusCodes_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: messages_1.MESSAGES.ERROR.UNAUTHORIZED
            });
            return;
        }
        if (!roles.includes((req.user).role)) {
            res.status(statusCodes_1.HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: messages_1.MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS
            });
            return;
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requirePatient = (0, exports.requireRole)(User_model_1.UserRole.PATIENT);
exports.requireDoctor = (0, exports.requireRole)(User_model_1.UserRole.DOCTOR);
exports.requireAdmin = (0, exports.requireRole)(User_model_1.UserRole.ADMIN);
exports.requireDoctorOrAdmin = (0, exports.requireRole)(User_model_1.UserRole.DOCTOR, User_model_1.UserRole.ADMIN);
