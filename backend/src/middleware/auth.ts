import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { UserRole } from '../entities/User';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
    patientId?: string;
    doctorId?: string;
  };
}

const authService = new AuthService();

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  } catch (error) {
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const requirePatient = requireRole(UserRole.PATIENT);
export const requireDoctor = requireRole(UserRole.DOCTOR);
export const requireAdmin = requireRole(UserRole.ADMIN);
export const requireDoctorOrAdmin = requireRole(UserRole.DOCTOR, UserRole.ADMIN);