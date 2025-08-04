import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = '24h';

export interface RegisterData {
  email: string;
  password: string;
  role: UserRole;
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

export class AuthService {
  private userRepository: Repository<User>;
  private patientRepository: Repository<Patient>;
  private doctorRepository: Repository<Doctor>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
    this.patientRepository = AppDataSource.getRepository(Patient);
    this.doctorRepository = AppDataSource.getRepository(Doctor);
  }

  async register(data: RegisterData) {
    const { email, password, role, firstName, lastName, phone, dateOfBirth, gender, specialization, qualification, experience, department } = data;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User();
    user.email = email;
    user.password = hashedPassword;
    user.role = role;

    if (role === UserRole.PATIENT) {
      // Create patient record
      const patient = new Patient();
      patient.firstName = firstName;
      patient.lastName = lastName;
      patient.email = email;
      patient.phone = phone;
      patient.password = hashedPassword;
      patient.dateOfBirth = dateOfBirth || new Date();
      patient.gender = gender || '';
      patient.allergies = [];
      
      await this.patientRepository.save(patient);
      user.patient = patient;
    } else if (role === UserRole.DOCTOR) {
      // Create doctor record
      const doctor = new Doctor();
      doctor.firstName = firstName;
      doctor.lastName = lastName;
      doctor.email = email;
      doctor.phone = phone;
      doctor.specialization = specialization || '';
      doctor.qualification = qualification || '';
      doctor.experience = experience || 0;
      doctor.department = department || '';
      
      await this.doctorRepository.save(doctor);
      user.doctor = doctor;
    }

    const savedUser = await this.userRepository.save(user);

    // Generate JWT token with profile ID
    let profileId: string | undefined;
    if (savedUser.patient) {
      profileId = savedUser.patient.id;
    } else if (savedUser.doctor) {
      profileId = savedUser.doctor.id;
    }
    const token = this.generateToken(savedUser.id, savedUser.role, profileId);

    return {
      user: {
        id: savedUser.id,
        email: savedUser.email,
        role: savedUser.role,
        patient: savedUser.patient,
        doctor: savedUser.doctor
      },
      token
    };
  }

  async login(data: LoginData) {
    const { email, password } = data;

    // Find user with relations
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
      relations: ['patient', 'doctor']
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // Generate JWT token with profile ID
    let profileId: string | undefined;
    if (user.patient) {
      profileId = user.patient.id;
    } else if (user.doctor) {
      profileId = user.doctor.id;
    }
    const token = this.generateToken(user.id, user.role, profileId);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patient: user.patient,
        doctor: user.doctor
      },
      token
    };
  }

  async getUserById(id: string) {
    const user = await this.userRepository.findOne({
      where: { id, isActive: true },
      relations: ['patient', 'doctor']
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      patient: user.patient,
      doctor: user.doctor
    };
  }

  generateToken(userId: string, role: UserRole, profileId?: string): string {
    const payload: any = { userId, role };
    
    // Add profile-specific ID for easier database queries
    if (profileId) {
      if (role === UserRole.PATIENT) {
        payload.patientId = profileId;
      } else if (role === UserRole.DOCTOR) {
        payload.doctorId = profileId;
      }
    }
    
    return jwt.sign(
      payload,
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  verifyToken(token: string): { userId: string; role: UserRole; patientId?: string; doctorId?: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { 
        userId: string; 
        role: UserRole; 
        patientId?: string; 
        doctorId?: string; 
      };
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedNewPassword;
    await this.userRepository.save(user);

    return { message: 'Password changed successfully' };
  }

  async resetPassword(email: string) {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token (in production, send this via email)
    const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await this.userRepository.save(user);

    return { resetToken, message: 'Reset token generated' };
  }

  async confirmPasswordReset(resetToken: string, newPassword: string) {
    const user = await this.userRepository.findOne({ 
      where: { resetToken } 
    });

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = null;
    user.resetTokenExpiry = null;

    await this.userRepository.save(user);

    return { message: 'Password reset successfully' };
  }
}