"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_repository_1 = require("../repositories/user.repository");
const patient_repository_1 = require("../repositories/patient.repository");
const doctor_repository_1 = require("../repositories/doctor.repository");
const User_model_1 = require("../models/User.model");
const config_1 = require("../config");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class AuthService {
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
        this.patientRepository = new patient_repository_1.PatientRepository();
        this.doctorRepository = new doctor_repository_1.DoctorRepository();
    }
    async register(data) {
        try {
            const { email, password, role = User_model_1.UserRole.PATIENT, firstName, lastName, phone, dateOfBirth, gender, specialization, qualification, experience, department } = data;
            // Check if user already exists
            const existingUser = await this.userRepository.findByEmail(email);
            if (existingUser) {
                throw new Error(messages_1.MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
            }
            // Hash password
            const hashedPassword = await bcryptjs_1.default.hash(password, 12);
            // Create user
            const userData = {
                email,
                password: hashedPassword,
                role,
                isActive: true,
            };
            const user = await this.userRepository.create(userData);
            // Create profile based on role
            let profileId;
            if (role === User_model_1.UserRole.PATIENT) {
                const patientData = {
                    firstName,
                    lastName,
                    email,
                    phone,
                    password: hashedPassword,
                    dateOfBirth,
                    gender,
                    isActive: true,
                };
                const patient = await this.patientRepository.create(patientData);
                profileId = patient.id;
                // Link patient to user
                await this.userRepository.update(user.id, { patient });
            }
            else if (role === User_model_1.UserRole.DOCTOR) {
                const doctorData = {
                    firstName,
                    lastName,
                    specialization: specialization || '',
                    qualification: qualification || '',
                    experience: experience || 0,
                    email,
                    phone,
                    department: department || '',
                    isAvailable: true,
                    rating: 0,
                };
                const doctor = await this.doctorRepository.create(doctorData);
                profileId = doctor.id;
                // Link doctor to user
                await this.userRepository.update(user.id, { doctor });
            }
            // Generate JWT token
            const tokenPayload = {
                userId: user.id,
                role: user.role,
                ...(role === User_model_1.UserRole.PATIENT && { patientId: profileId }),
                ...(role === User_model_1.UserRole.DOCTOR && { doctorId: profileId }),
            };
            const token = this.generateToken(tokenPayload);
            // Get complete user with relations
            const completeUser = await this.userRepository.findByIdWithRelations(user.id);
            logger_config_1.logger.info(`User registered successfully: ${email} with role: ${role}`);
            return {
                user: completeUser,
                token,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Registration error:', error);
            throw error;
        }
    }
    async login(data) {
        try {
            const { email, password } = data;
            // Find user with relations
            const user = await this.userRepository.findByEmailWithRelations(email);
            if (!user) {
                throw new Error(messages_1.MESSAGES.ERROR.INVALID_CREDENTIALS);
            }
            if (!user.isActive) {
                throw new Error(messages_1.MESSAGES.ERROR.UNAUTHORIZED);
            }
            // Verify password
            const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
            if (!isPasswordValid) {
                throw new Error(messages_1.MESSAGES.ERROR.INVALID_CREDENTIALS);
            }
            // Update last login
            await this.userRepository.update(user.id, { lastLogin: new Date() });
            // Generate JWT token
            const tokenPayload = {
                userId: user.id,
                role: user.role,
                ...(user.patient && { patientId: user.patient.id }),
                ...(user.doctor && { doctorId: user.doctor.id }),
            };
            const token = this.generateToken(tokenPayload);
            logger_config_1.logger.info(`User logged in successfully: ${email}`);
            return {
                user,
                token,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Login error:', error);
            throw error;
        }
    }
    async getUserById(userId) {
        try {
            const user = await this.userRepository.findByIdWithRelations(userId);
            if (!user) {
                throw new Error(messages_1.MESSAGES.ERROR.USER_NOT_FOUND);
            }
            return user;
        }
        catch (error) {
            logger_config_1.logger.error('Get user by ID error:', error);
            throw error;
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        try {
            const user = await this.userRepository.findById(userId);
            if (!user) {
                throw new Error(messages_1.MESSAGES.ERROR.USER_NOT_FOUND);
            }
            // Verify current password
            const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
            if (!isCurrentPasswordValid) {
                throw new Error(messages_1.MESSAGES.ERROR.INCORRECT_PASSWORD);
            }
            // Hash new password
            const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
            // Update password
            await this.userRepository.update(userId, { password: hashedNewPassword });
            logger_config_1.logger.info(`Password changed for user: ${userId}`);
            return {
                message: messages_1.MESSAGES.SUCCESS.PASSWORD_CHANGED,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Change password error:', error);
            throw error;
        }
    }
    async resetPassword(email) {
        try {
            const user = await this.userRepository.findByEmail(email);
            if (!user) {
                throw new Error(messages_1.MESSAGES.ERROR.USER_NOT_FOUND);
            }
            // Generate reset token
            const resetToken = jsonwebtoken_1.default.sign({ userId: user.id, type: 'password_reset' }, config_1.config.JWT_SECRET, { expiresIn: '1h' });
            const resetTokenExpiry = new Date();
            resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
            // Save reset token
            await this.userRepository.update(user.id, {
                resetToken,
                resetTokenExpiry,
            });
            logger_config_1.logger.info(`Password reset requested for user: ${email}`);
            return {
                message: messages_1.MESSAGES.SUCCESS.PASSWORD_RESET_EMAIL_SENT,
                resetToken, // In production, send this via email instead
            };
        }
        catch (error) {
            logger_config_1.logger.error('Password reset error:', error);
            throw error;
        }
    }
    async confirmPasswordReset(resetToken, newPassword) {
        try {
            // Verify reset token
            let decoded;
            try {
                decoded = jsonwebtoken_1.default.verify(resetToken, config_1.config.JWT_SECRET);
            }
            catch {
                throw new Error(messages_1.MESSAGES.ERROR.INVALID_TOKEN);
            }
            const user = await this.userRepository.findById(decoded.userId);
            if (!user || user.resetToken !== resetToken) {
                throw new Error(messages_1.MESSAGES.ERROR.INVALID_TOKEN);
            }
            if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
                throw new Error(messages_1.MESSAGES.ERROR.PASSWORD_RESET_EXPIRED);
            }
            // Hash new password
            const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
            // Update password and clear reset token
            await this.userRepository.update(user.id, {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            });
            logger_config_1.logger.info(`Password reset completed for user: ${user.id}`);
            return {
                message: messages_1.MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS,
            };
        }
        catch (error) {
            logger_config_1.logger.error('Confirm password reset error:', error);
            throw error;
        }
    }
    generateToken(payload) {
        return jsonwebtoken_1.default.sign(payload, config_1.config.JWT_SECRET, {
            expiresIn: config_1.config.JWT_EXPIRES_IN,
        });
    }
    verifyToken(token) {
        try {
            return jsonwebtoken_1.default.verify(token, config_1.config.JWT_SECRET);
        }
        catch (error) {
            logger_config_1.logger.error('Token verification error:', error);
            throw new Error(messages_1.MESSAGES.ERROR.INVALID_TOKEN);
        }
    }
}
exports.AuthService = AuthService;
