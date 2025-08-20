import { UserRole } from '../models/User.model';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
        patientId?: string;
        doctorId?: string;
      };
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: UserRole;
    patientId?: string;
    doctorId?: string;
  };
}