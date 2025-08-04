"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDoctorOrAdmin = exports.requireAdmin = exports.requireDoctor = exports.requirePatient = exports.requireRole = exports.authenticateToken = void 0;
const authService_1 = require("../services/authService");
const User_1 = require("../entities/User");
const authService = new authService_1.AuthService();
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }
        const decoded = authService.verifyToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};
exports.authenticateToken = authenticateToken;
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
exports.requirePatient = (0, exports.requireRole)(User_1.UserRole.PATIENT);
exports.requireDoctor = (0, exports.requireRole)(User_1.UserRole.DOCTOR);
exports.requireAdmin = (0, exports.requireRole)(User_1.UserRole.ADMIN);
exports.requireDoctorOrAdmin = (0, exports.requireRole)(User_1.UserRole.DOCTOR, User_1.UserRole.ADMIN);
