"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const database_1 = require("../config/database");
const User_1 = require("../entities/User");
const Patient_1 = require("../entities/Patient");
const Doctor_1 = require("../entities/Doctor");
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';
const JWT_EXPIRES_IN = '24h';
class AuthService {
    constructor() {
        this.userRepository = database_1.AppDataSource.getRepository(User_1.User);
        this.patientRepository = database_1.AppDataSource.getRepository(Patient_1.Patient);
        this.doctorRepository = database_1.AppDataSource.getRepository(Doctor_1.Doctor);
    }
    async register(data) {
        const { email, password, role, firstName, lastName, phone, dateOfBirth, gender, specialization, qualification, experience, department } = data;
        // Check if user already exists
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        // Hash password
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        // Create user
        const user = new User_1.User();
        user.email = email;
        user.password = hashedPassword;
        user.role = role;
        if (role === User_1.UserRole.PATIENT) {
            // Create patient record
            const patient = new Patient_1.Patient();
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
        }
        else if (role === User_1.UserRole.DOCTOR) {
            // Create doctor record
            const doctor = new Doctor_1.Doctor();
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
        let profileId;
        if (savedUser.patient) {
            profileId = savedUser.patient.id;
        }
        else if (savedUser.doctor) {
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
    async login(data) {
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
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Invalid email or password');
        }
        // Update last login
        user.lastLogin = new Date();
        await this.userRepository.save(user);
        // Generate JWT token with profile ID
        let profileId;
        if (user.patient) {
            profileId = user.patient.id;
        }
        else if (user.doctor) {
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
    async getUserById(id) {
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
    generateToken(userId, role, profileId) {
        const payload = { userId, role };
        // Add profile-specific ID for easier database queries
        if (profileId) {
            if (role === User_1.UserRole.PATIENT) {
                payload.patientId = profileId;
            }
            else if (role === User_1.UserRole.DOCTOR) {
                payload.doctorId = profileId;
            }
        }
        return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    }
    verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            return decoded;
        }
        catch (error) {
            throw new Error('Invalid or expired token');
        }
    }
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (!user) {
            throw new Error('User not found');
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new Error('Current password is incorrect');
        }
        const hashedNewPassword = await bcryptjs_1.default.hash(newPassword, 12);
        user.password = hashedNewPassword;
        await this.userRepository.save(user);
        return { message: 'Password changed successfully' };
    }
    async resetPassword(email) {
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new Error('User not found');
        }
        // Generate reset token (in production, send this via email)
        const resetToken = jsonwebtoken_1.default.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
        user.resetToken = resetToken;
        user.resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
        await this.userRepository.save(user);
        return { resetToken, message: 'Reset token generated' };
    }
    async confirmPasswordReset(resetToken, newPassword) {
        const user = await this.userRepository.findOne({
            where: { resetToken }
        });
        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
            throw new Error('Invalid or expired reset token');
        }
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, 12);
        user.password = hashedPassword;
        user.resetToken = null;
        user.resetTokenExpiry = null;
        await this.userRepository.save(user);
        return { message: 'Password reset successfully' };
    }
}
exports.AuthService = AuthService;
