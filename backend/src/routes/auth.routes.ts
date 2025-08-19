import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));
router.post('/reset-password-request', asyncHandler(authController.resetPasswordRequest));
router.post('/reset-password-confirm', asyncHandler(authController.resetPasswordConfirm));

// Protected routes
router.get('/profile', authenticateToken, asyncHandler(authController.getProfile));
router.put('/change-password', authenticateToken, asyncHandler(authController.changePassword));
router.post('/logout', authenticateToken, asyncHandler(authController.logout));
router.get('/verify', authenticateToken, asyncHandler(authController.verifyToken));

export default router;