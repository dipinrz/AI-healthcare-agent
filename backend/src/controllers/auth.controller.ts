import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/statusCodes';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, role, firstName, lastName, phone, dateOfBirth, gender, specialization, qualification, experience, department } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !phone) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.MISSING_REQUIRED_FIELDS
        });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.INVALID_EMAIL
        });
        return;
      }

      // Validate password strength
      if (password.length < 6) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.PASSWORD_TOO_SHORT
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

      res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: MESSAGES.SUCCESS.REGISTRATION_SUCCESS,
        data: result
      });
    } catch (error) {
      logger.error('Registration error:', error);
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      // Validate required fields
      if (!email || !password) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.EMAIL_PASSWORD_REQUIRED
        });
        return;
      }

      const result = await this.authService.login({ email, password });

      res.json({
        success: true,
        message: MESSAGES.SUCCESS.LOGIN_SUCCESS,
        data: result
      });
    } catch (error) {
      logger.error('Login error:', error);
      next(error);
    }
  };

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.authService.getUserById(((req as any).user).userId);
      
      res.json({
        success: true,
        message: MESSAGES.SUCCESS.PROFILE_RETRIEVED,
        data: { user }
      });
    } catch (error) {
      logger.error('Profile error:', error);
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.CURRENT_NEW_PASSWORD_REQUIRED
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.NEW_PASSWORD_TOO_SHORT
        });
        return;
      }

      const result = await this.authService.changePassword(((req as any).user).userId, currentPassword, newPassword);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Change password error:', error);
      next(error);
    }
  };

  resetPasswordRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;

      if (!email) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.EMAIL_REQUIRED
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
    } catch (error) {
      logger.error('Password reset request error:', error);
      next(error);
    }
  };

  resetPasswordConfirm = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { resetToken, newPassword } = req.body;

      if (!resetToken || !newPassword) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.RESET_TOKEN_PASSWORD_REQUIRED
        });
        return;
      }

      if (newPassword.length < 6) {
        res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: MESSAGES.VALIDATION.NEW_PASSWORD_TOO_SHORT
        });
        return;
      }

      const result = await this.authService.confirmPasswordReset(resetToken, newPassword);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      logger.error('Password reset confirm error:', error);
      next(error);
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: MESSAGES.SUCCESS.LOGOUT_SUCCESS
    });
  };

  verifyToken = async (req: Request, res: Response): Promise<void> => {
    res.json({
      success: true,
      message: MESSAGES.SUCCESS.TOKEN_VALID,
      data: {
        userId: ((req as any).user).userId,
        role: ((req as any).user).role
      }
    });
  };
}