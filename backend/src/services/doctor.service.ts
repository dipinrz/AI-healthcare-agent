import { DoctorRepository } from '../repositories/doctor.repository';
import { Doctor } from '../models/Doctor.model';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { DoctorAvailabilityRepository } from '../repositories/doctorAvailability.repository';
import { logger } from '../config/logger.config';
import { MESSAGES } from '../constants/messages';

export interface DoctorFilters {
  search?: string;
  specialization?: string;
  department?: string;
  minRating?: number;
  minExperience?: number;
  isAvailable?: boolean;
}

export interface AppointmentFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AvailabilityFilters {
  date?: Date;
  startDate?: Date;
  endDate?: Date;
}

export class DoctorService {
  private doctorRepository = new DoctorRepository();
  private appointmentRepository = new AppointmentRepository();
  private availabilityRepository = new DoctorAvailabilityRepository();

  async getAllDoctors(
    filters: DoctorFilters,
    page: number = 1,
    limit: number = 10
  ) {
    try {
      logger.info('Getting all doctors with filters:', filters);

      let doctors: Doctor[];

      // Apply search filter first
      if (filters.search) {
        doctors = await this.doctorRepository.searchDoctors(filters.search);
      } else {
        doctors = await this.doctorRepository.findAvailableDoctors();
      }

      // Apply other filters
      if (filters.specialization) {
        doctors = doctors.filter(doc => 
          doc.specialization.toLowerCase().includes(filters.specialization!.toLowerCase())
        );
      }

      if (filters.department) {
        doctors = doctors.filter(doc => 
          doc.department.toLowerCase().includes(filters.department!.toLowerCase())
        );
      }

      if (filters.minRating !== undefined) {
        doctors = doctors.filter(doc => doc.rating >= filters.minRating!);
      }

      if (filters.minExperience !== undefined) {
        doctors = doctors.filter(doc => doc.experience >= filters.minExperience!);
      }

      if (filters.isAvailable !== undefined) {
        doctors = doctors.filter(doc => doc.isAvailable === filters.isAvailable);
      }

      const total = doctors.length;
      const paginatedDoctors = doctors.slice((page - 1) * limit, page * limit);

      return {
        data: paginatedDoctors,
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Get all doctors error:', error);
      throw error;
    }
  }

  async getDoctorById(id: string): Promise<Doctor> {
    try {
      const doctor = await this.doctorRepository.findById(id);
      
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      return doctor;
    } catch (error) {
      logger.error('Get doctor by ID error:', error);
      throw error;
    }
  }

  async createDoctor(doctorData: Partial<Doctor>): Promise<Doctor> {
    try {
      // Check if doctor with email already exists
      if (doctorData.email) {
        const existingDoctor = await this.doctorRepository.findByEmail(doctorData.email);
        if (existingDoctor) {
          throw new Error(MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
        }
      }

      const doctor = await this.doctorRepository.create({
        ...doctorData,
        isAvailable: true,
        rating: doctorData.rating || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('Doctor created successfully:', doctor.id);
      return doctor;
    } catch (error) {
      logger.error('Create doctor error:', error);
      throw error;
    }
  }

  async updateDoctor(id: string, updateData: Partial<Doctor>): Promise<Doctor> {
    try {
      const existingDoctor = await this.doctorRepository.findById(id);
      if (!existingDoctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      // Check email uniqueness if email is being updated
      if (updateData.email && updateData.email !== existingDoctor.email) {
        const doctorWithEmail = await this.doctorRepository.findByEmail(updateData.email);
        if (doctorWithEmail && doctorWithEmail.id !== id) {
          throw new Error(MESSAGES.ERROR.EMAIL_ALREADY_EXISTS);
        }
      }

      const updatedDoctor = await this.doctorRepository.update(id, {
        ...updateData,
        updatedAt: new Date(),
      });

      if (!updatedDoctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      logger.info('Doctor updated successfully:', id);
      return updatedDoctor;
    } catch (error) {
      logger.error('Update doctor error:', error);
      throw error;
    }
  }

  async deleteDoctor(id: string): Promise<void> {
    try {
      const doctor = await this.doctorRepository.findById(id);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      // Check if doctor has pending appointments
      const pendingAppointments = await this.appointmentRepository.findByDoctorId(id, {
        status: 'scheduled',
      });

      if (pendingAppointments.length > 0) {
        throw new Error('Cannot delete doctor with pending appointments');
      }

      // Set as unavailable instead of hard delete
      await this.doctorRepository.updateAvailability(id, false);
      
      logger.info('Doctor deleted successfully:', id);
    } catch (error) {
      logger.error('Delete doctor error:', error);
      throw error;
    }
  }

  async getDoctorAppointments(doctorId: string, filters: AppointmentFilters = {}) {
    try {
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      const appointments = await this.appointmentRepository.findByDoctorId(doctorId, filters);
      return appointments;
    } catch (error) {
      logger.error('Get doctor appointments error:', error);
      throw error;
    }
  }

  async getDoctorAvailability(doctorId: string, filters: AvailabilityFilters = {}) {
    try {
      const doctor = await this.doctorRepository.findById(doctorId);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      const availability = await this.availabilityRepository.findByDoctorId(doctorId, filters);
      return availability;
    } catch (error) {
      logger.error('Get doctor availability error:', error);
      throw error;
    }
  }

  async updateAvailability(id: string, isAvailable: boolean): Promise<Doctor> {
    try {
      const doctor = await this.doctorRepository.updateAvailability(id, isAvailable);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      logger.info(`Doctor availability updated: ${id} - ${isAvailable ? 'available' : 'unavailable'}`);
      return doctor;
    } catch (error) {
      logger.error('Update doctor availability error:', error);
      throw error;
    }
  }

  async searchDoctors(searchTerm: string): Promise<Doctor[]> {
    try {
      return await this.doctorRepository.searchDoctors(searchTerm);
    } catch (error) {
      logger.error('Search doctors error:', error);
      throw error;
    }
  }

  async getDoctorStats() {
    try {
      return await this.doctorRepository.getDoctorStats();
    } catch (error) {
      logger.error('Get doctor stats error:', error);
      throw error;
    }
  }

  async getSpecializations(): Promise<string[]> {
    try {
      return await this.doctorRepository.getSpecializationList();
    } catch (error) {
      logger.error('Get specializations error:', error);
      throw error;
    }
  }

  async getDepartments(): Promise<string[]> {
    try {
      return await this.doctorRepository.getDepartmentList();
    } catch (error) {
      logger.error('Get departments error:', error);
      throw error;
    }
  }

  async getDoctorsBySpecialization(specialization: string): Promise<Doctor[]> {
    try {
      return await this.doctorRepository.findBySpecialization(specialization);
    } catch (error) {
      logger.error('Get doctors by specialization error:', error);
      throw error;
    }
  }

  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    try {
      return await this.doctorRepository.findByDepartment(department);
    } catch (error) {
      logger.error('Get doctors by department error:', error);
      throw error;
    }
  }

  async getTopRatedDoctors(limit: number = 10): Promise<Doctor[]> {
    try {
      return await this.doctorRepository.findTopRatedDoctors(limit);
    } catch (error) {
      logger.error('Get top rated doctors error:', error);
      throw error;
    }
  }

  async updateDoctorRating(id: string, rating: number): Promise<Doctor> {
    try {
      if (rating < 0 || rating > 5) {
        throw new Error('Rating must be between 0 and 5');
      }

      const doctor = await this.doctorRepository.updateRating(id, rating);
      if (!doctor) {
        throw new Error(MESSAGES.ERROR.DOCTOR_NOT_FOUND);
      }

      logger.info(`Doctor rating updated: ${id} - ${rating}`);
      return doctor;
    } catch (error) {
      logger.error('Update doctor rating error:', error);
      throw error;
    }
  }

  async getDoctorsWithMinRating(minRating: number): Promise<Doctor[]> {
    try {
      return await this.doctorRepository.findDoctorsWithMinRating(minRating);
    } catch (error) {
      logger.error('Get doctors with min rating error:', error);
      throw error;
    }
  }

  async getDoctorsByExperience(minExperience: number, maxExperience?: number): Promise<Doctor[]> {
    try {
      return await this.doctorRepository.findByExperienceRange(minExperience, maxExperience);
    } catch (error) {
      logger.error('Get doctors by experience error:', error);
      throw error;
    }
  }
}