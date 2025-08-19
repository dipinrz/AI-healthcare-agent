import { Request, Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export class DoctorController {
  private doctorService = new DoctorService();

  getAllDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, specialization, department, minRating, minExperience, isAvailable, page = 1, limit = 10 } = req.query;

      const filters = {
        search: search as string,
        specialization: specialization as string,
        department: department as string,
        minRating: minRating ? parseFloat(minRating as string) : undefined,
        minExperience: minExperience ? parseInt(minExperience as string) : undefined,
        isAvailable: isAvailable ? isAvailable === 'true' : undefined,
      };

      const result = await this.doctorService.getAllDoctors(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      ResponseHandler.paginated(
        res,
        MESSAGES.SUCCESS.DOCTORS_RETRIEVED || 'Doctors retrieved successfully',
        result.data,
        result.total,
        result.page,
        result.limit
      );
    } catch (error) {
      logger.error('Get all doctors error:', error);
      next(error);
    }
  };

  getDoctorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const doctor = await this.doctorService.getDoctorById(id);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.DOCTOR_RETRIEVED || 'Doctor retrieved successfully',
        doctor
      );
    } catch (error) {
      logger.error('Get doctor by ID error:', error);
      next(error);
    }
  };

  createDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const doctorData = req.body;
      const doctor = await this.doctorService.createDoctor(doctorData);

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.DOCTOR_CREATED,
        doctor
      );
    } catch (error) {
      logger.error('Create doctor error:', error);
      next(error);
    }
  };

  updateDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const doctor = await this.doctorService.updateDoctor(id, updateData);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.DOCTOR_UPDATED,
        doctor
      );
    } catch (error) {
      logger.error('Update doctor error:', error);
      next(error);
    }
  };

  deleteDoctor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.doctorService.deleteDoctor(id);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.DOCTOR_DELETED || 'Doctor deleted successfully'
      );
    } catch (error) {
      logger.error('Delete doctor error:', error);
      next(error);
    }
  };

  getDoctorAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, startDate, endDate } = req.query;

      const appointments = await this.doctorService.getDoctorAppointments(id, {
        status: status as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Appointments retrieved successfully',
        appointments
      );
    } catch (error) {
      logger.error('Get doctor appointments error:', error);
      next(error);
    }
  };

  getDoctorAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { date, startDate, endDate } = req.query;

      const availability = await this.doctorService.getDoctorAvailability(id, {
        date: date ? new Date(date as string) : undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      });

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.AVAILABILITY_RETRIEVED || 'Availability retrieved successfully',
        availability
      );
    } catch (error) {
      logger.error('Get doctor availability error:', error);
      next(error);
    }
  };

  updateDoctorAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { isAvailable } = req.body;

      const doctor = await this.doctorService.updateAvailability(id, isAvailable);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.AVAILABILITY_UPDATED || 'Availability updated successfully',
        doctor
      );
    } catch (error) {
      logger.error('Update doctor availability error:', error);
      next(error);
    }
  };

  getDoctorStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.doctorService.getDoctorStats();

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.STATS_RETRIEVED || 'Doctor statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Get doctor stats error:', error);
      next(error);
    }
  };

  getSpecializations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const specializations = await this.doctorService.getSpecializations();

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SPECIALIZATIONS_RETRIEVED || 'Specializations retrieved successfully',
        specializations
      );
    } catch (error) {
      logger.error('Get specializations error:', error);
      next(error);
    }
  };

  getDepartments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const departments = await this.doctorService.getDepartments();

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.DEPARTMENTS_RETRIEVED || 'Departments retrieved successfully',
        departments
      );
    } catch (error) {
      logger.error('Get departments error:', error);
      next(error);
    }
  };

  searchDoctors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q) {
        ResponseHandler.badRequest(res, MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
        return;
      }

      const doctors = await this.doctorService.searchDoctors(q as string);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully',
        doctors
      );
    } catch (error) {
      logger.error('Search doctors error:', error);
      next(error);
    }
  };

  fuzzySearchByDepartment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q) {
        ResponseHandler.badRequest(res, MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
        return;
      }

      const doctors = await this.doctorService.fuzzySearchByDepartment(q as string);

      ResponseHandler.success(
        res,
        `Found ${doctors.length} doctors matching "${q}"`,
        doctors
      );
    } catch (error) {
      logger.error('Fuzzy search by department error:', error);
      next(error);
    }
  };
}