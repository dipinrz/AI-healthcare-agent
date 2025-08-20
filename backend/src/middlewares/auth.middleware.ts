import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/User.model';
import { MESSAGES } from '../constants/messages';
import { HTTP_STATUS } from '../constants/statusCodes';

const authService = new AuthService();

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        success: false, 
        message: MESSAGES.ERROR.TOKEN_REQUIRED
      });
      return;
    }

    const decoded = authService.verifyToken(token);
    ((req as any).user) = decoded;
    next();
  } catch (error) {
    res.status(HTTP_STATUS.FORBIDDEN).json({ 
      success: false, 
      message: MESSAGES.ERROR.INVALID_TOKEN
    });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!((req as any).user)) {
      res.status(HTTP_STATUS.UNAUTHORIZED).json({ 
        success: false, 
        message: MESSAGES.ERROR.UNAUTHORIZED
      });
      return;
    }

    if (!roles.includes(((req as any).user).role)) {
      res.status(HTTP_STATUS.FORBIDDEN).json({ 
        success: false, 
        message: MESSAGES.ERROR.INSUFFICIENT_PERMISSIONS
      });
      return;
    }

    next();
  };
};

export const requirePatient = requireRole(UserRole.PATIENT);
export const requireDoctor = requireRole(UserRole.DOCTOR);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireDoctorOrAdmin = requireRole(UserRole.DOCTOR, UserRole.ADMIN);