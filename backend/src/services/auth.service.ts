import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/user.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { User, UserRole } from '../models/User.model';
import { config } from '../config';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export interface RegisterData {
  email: string;
  password: string;
  role?: UserRole;
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth?: Date;
  gender?: string;
  specialization?: string;
  qualification?: string;
  experience?: number;
  department?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  patientId?: string;
  doctorId?: string;
}

export class AuthService {
  private userRepository = new UserRepository();
  private patientRepository = new PatientRepository();
  private doctorRepository = new DoctorRepository();

  async register(data: RegisterData) {
    try {
      const { email, password, role = UserRole.PATIENT, firstName, lastName, phone, dateOfBirth, gender, specialization, qualification, experience, department } = data;

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      if (existingUser) {
        throw new Error(MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12);

      // Create user
      const userData = {
        email,
        password: hashedPassword,
        role,
        isActive: true,
      };

      const user = await this.userRepository.create(userData);

      // Create profile based on role
      let profileId: string | undefined;
      
      if (role === UserRole.PATIENT) {
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
      } else if (role === UserRole.DOCTOR) {
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
      const tokenPayload: TokenPayload = {
        userId: user.id,
        role: user.role,
        ...(role === UserRole.PATIENT && { patientId: profileId }),
        ...(role === UserRole.DOCTOR && { doctorId: profileId }),
      };

      const token = this.generateToken(tokenPayload);

      // Get complete user with relations
      const completeUser = await this.userRepository.findByIdWithRelations(user.id);

      logger.info(`User registered successfully: ${email} with role: ${role}`);

      return {
        user: completeUser,
        token,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  async login(data: LoginData) {
    try {
      const { email, password } = data;

      // Find user with relations
      const user = await this.userRepository.findByEmailWithRelations(email);
      if (!user) {
        throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);
      }

      if (!user.isActive) {
        throw new Error(MESSAGES.ERROR.UNAUTHORIZED);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error(MESSAGES.ERROR.INVALID_CREDENTIALS);
      }

      // Update last login
      await this.userRepository.update(user.id, { lastLogin: new Date() });

      // Generate JWT token
      const tokenPayload: TokenPayload = {
        userId: user.id,
        role: user.role,
        ...(user.patient && { patientId: user.patient.id }),
        ...(user.doctor && { doctorId: user.doctor.id }),
      };

      const token = this.generateToken(tokenPayload);

      logger.info(`User logged in successfully: ${email}`);

      return {
        user,
        token,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.userRepository.findByIdWithRelations(userId);
      if (!user) {
        throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);
      }
      return user;
    } catch (error) {
      logger.error('Get user by ID error:', error);
      throw error;
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error(MESSAGES.ERROR.INCORRECT_PASSWORD);
      }

      // Hash new password
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await this.userRepository.update(userId, { password: hashedNewPassword });

      logger.info(`Password changed for user: ${userId}`);

      return {
        message: MESSAGES.SUCCESS.PASSWORD_CHANGED,
      };
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  async resetPassword(email: string) {
    try {
      const user = await this.userRepository.findByEmail(email);
      if (!user) {
        throw new Error(MESSAGES.ERROR.USER_NOT_FOUND);
      }

      // Generate reset token
      const resetToken = jwt.sign(
        { userId: user.id, type: 'password_reset' },
        config.JWT_SECRET,
        { expiresIn: '1h' }
      );

      const resetTokenExpiry = new Date();
      resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);

      // Save reset token
      await this.userRepository.update(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      logger.info(`Password reset requested for user: ${email}`);

      return {
        message: MESSAGES.SUCCESS.PASSWORD_RESET_EMAIL_SENT,
        resetToken, // In production, send this via email instead
      };
    } catch (error) {
      logger.error('Password reset error:', error);
      throw error;
    }
  }

  async confirmPasswordReset(resetToken: string, newPassword: string) {
    try {
      // Verify reset token
      let decoded: any;
      try {
        decoded = jwt.verify(resetToken, config.JWT_SECRET);
      } catch {
        throw new Error(MESSAGES.ERROR.INVALID_TOKEN);
      }

      const user = await this.userRepository.findById(decoded.userId);
      if (!user || user.resetToken !== resetToken) {
        throw new Error(MESSAGES.ERROR.INVALID_TOKEN);
      }

      if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
        throw new Error(MESSAGES.ERROR.PASSWORD_RESET_EXPIRED);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password and clear reset token
      await this.userRepository.update(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      logger.info(`Password reset completed for user: ${user.id}`);

      return {
        message: MESSAGES.SUCCESS.PASSWORD_RESET_SUCCESS,
      };
    } catch (error) {
      logger.error('Confirm password reset error:', error);
      throw error;
    }
  }

  generateToken(payload: TokenPayload): string {
    return jwt.sign(payload as any, config.JWT_SECRET as string, {
      expiresIn: config.JWT_EXPIRES_IN,
    } as any);
  }

  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
    } catch (error) {
      logger.error('Token verification error:', error);
      throw new Error(MESSAGES.ERROR.INVALID_TOKEN);
    }
  }
}