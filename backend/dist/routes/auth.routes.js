"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
// Public routes
router.post('/register', (0, error_middleware_1.asyncHandler)(authController.register));
router.post('/login', (0, error_middleware_1.asyncHandler)(authController.login));
router.post('/reset-password-request', (0, error_middleware_1.asyncHandler)(authController.resetPasswordRequest));
router.post('/reset-password-confirm', (0, error_middleware_1.asyncHandler)(authController.resetPasswordConfirm));
// Protected routes
router.get('/profile', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(authController.getProfile));
router.put('/change-password', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(authController.changePassword));
router.post('/logout', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(authController.logout));
router.get('/verify', auth_middleware_1.authenticateToken, (0, error_middleware_1.asyncHandler)(authController.verifyToken));
exports.default = router;
