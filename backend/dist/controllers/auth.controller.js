"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const logger_config_1 = require("../config/logger.config");
const messages_1 = require("../constants/messages");
const statusCodes_1 = require("../constants/statusCodes");
class AuthController {
    constructor() {
        this.authService = new auth_service_1.AuthService();
        this.register = async (req, res, next) => {
            try {
                const { email, password, role, firstName, lastName, phone, dateOfBirth, gender, specialization, qualification, experience, department } = req.body;
                // Validate required fields
                if (!email || !password || !firstName || !lastName || !phone) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.MISSING_REQUIRED_FIELDS
                    });
                    return;
                }
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.INVALID_EMAIL
                    });
                    return;
                }
                // Validate password strength
                if (password.length < 6) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.PASSWORD_TOO_SHORT
                    });
                    return;
                }
                const registerData = {
                    email,
                    password,
                    role,
                    firstName,
                    lastName,
                    phone,
                    dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                    gender,
                    specialization,
                    qualification,
                    experience,
                    department
                };
                const result = await this.authService.register(registerData);
                res.status(statusCodes_1.HTTP_STATUS.CREATED).json({
                    success: true,
                    message: messages_1.MESSAGES.SUCCESS.REGISTRATION_SUCCESS,
                    data: result
                });
            }
            catch (error) {
                logger_config_1.logger.error('Registration error:', error);
                next(error);
            }
        };
        this.login = async (req, res, next) => {
            try {
                const { email, password } = req.body;
                // Validate required fields
                if (!email || !password) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.EMAIL_PASSWORD_REQUIRED
                    });
                    return;
                }
                const result = await this.authService.login({ email, password });
                res.json({
                    success: true,
                    message: messages_1.MESSAGES.SUCCESS.LOGIN_SUCCESS,
                    data: result
                });
            }
            catch (error) {
                logger_config_1.logger.error('Login error:', error);
                next(error);
            }
        };
        this.getProfile = async (req, res, next) => {
            try {
                const user = await this.authService.getUserById((req.user).userId);
                res.json({
                    success: true,
                    message: messages_1.MESSAGES.SUCCESS.PROFILE_RETRIEVED,
                    data: { user }
                });
            }
            catch (error) {
                logger_config_1.logger.error('Profile error:', error);
                next(error);
            }
        };
        this.changePassword = async (req, res, next) => {
            try {
                const { currentPassword, newPassword } = req.body;
                if (!currentPassword || !newPassword) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.CURRENT_NEW_PASSWORD_REQUIRED
                    });
                    return;
                }
                if (newPassword.length < 6) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.NEW_PASSWORD_TOO_SHORT
                    });
                    return;
                }
                const result = await this.authService.changePassword((req.user).userId, currentPassword, newPassword);
                res.json({
                    success: true,
                    message: result.message
                });
            }
            catch (error) {
                logger_config_1.logger.error('Change password error:', error);
                next(error);
            }
        };
        this.resetPasswordRequest = async (req, res, next) => {
            try {
                const { email } = req.body;
                if (!email) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.EMAIL_REQUIRED
                    });
                    return;
                }
                const result = await this.authService.resetPassword(email);
                res.json({
                    success: true,
                    message: result.message,
                    // In production, don't return the token - send it via email instead
                    resetToken: result.resetToken
                });
            }
            catch (error) {
                logger_config_1.logger.error('Password reset request error:', error);
                next(error);
            }
        };
        this.resetPasswordConfirm = async (req, res, next) => {
            try {
                const { resetToken, newPassword } = req.body;
                if (!resetToken || !newPassword) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.RESET_TOKEN_PASSWORD_REQUIRED
                    });
                    return;
                }
                if (newPassword.length < 6) {
                    res.status(statusCodes_1.HTTP_STATUS.BAD_REQUEST).json({
                        success: false,
                        message: messages_1.MESSAGES.VALIDATION.NEW_PASSWORD_TOO_SHORT
                    });
                    return;
                }
                const result = await this.authService.confirmPasswordReset(resetToken, newPassword);
                res.json({
                    success: true,
                    message: result.message
                });
            }
            catch (error) {
                logger_config_1.logger.error('Password reset confirm error:', error);
                next(error);
            }
        };
        this.logout = async (req, res) => {
            res.json({
                success: true,
                message: messages_1.MESSAGES.SUCCESS.LOGOUT_SUCCESS
            });
        };
        this.verifyToken = async (req, res) => {
            res.json({
                success: true,
                message: messages_1.MESSAGES.SUCCESS.TOKEN_VALID,
                data: {
                    userId: (req.user).userId,
                    role: (req.user).role
                }
            });
        };
    }
}
exports.AuthController = AuthController;
