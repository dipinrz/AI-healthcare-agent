import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';
import { ResponseHandler } from '../utils/responseHandler';
import { MESSAGES } from '../constants/messages';
import { logger } from '../config/logger.config';

export class PatientController {
  private patientService = new PatientService();

  getAllPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { search, gender, ageMin, ageMax, page = 1, limit = 10 } = req.query;

      const filters = {
        search: search as string,
        gender: gender as string,
        ageMin: ageMin ? parseInt(ageMin as string) : undefined,
        ageMax: ageMax ? parseInt(ageMax as string) : undefined,
      };

      const result = await this.patientService.getAllPatients(
        filters,
        parseInt(page as string),
        parseInt(limit as string)
      );

      ResponseHandler.paginated(
        res,
        MESSAGES.SUCCESS.PATIENTS_RETRIEVED || 'Patients retrieved successfully',
        result.data,
        result.total,
        result.page,
        result.limit
      );
    } catch (error) {
      logger.error('Get all patients error:', error);
      next(error);
    }
  };

  getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const patient = await this.patientService.getPatientById(id);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PATIENT_RETRIEVED || 'Patient retrieved successfully',
        patient
      );
    } catch (error) {
      logger.error('Get patient by ID error:', error);
      next(error);
    }
  };

  createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const patientData = req.body;
      const patient = await this.patientService.createPatient(patientData);

      ResponseHandler.created(
        res,
        MESSAGES.SUCCESS.PATIENT_CREATED,
        patient
      );
    } catch (error) {
      logger.error('Create patient error:', error);
      next(error);
    }
  };

  updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const patient = await this.patientService.updatePatient(id, updateData);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PATIENT_UPDATED,
        patient
      );
    } catch (error) {
      logger.error('Update patient error:', error);
      next(error);
    }
  };

  deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.patientService.deletePatient(id);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PATIENT_DELETED || 'Patient deleted successfully'
      );
    } catch (error) {
      logger.error('Delete patient error:', error);
      next(error);
    }
  };

  getPatientAppointments = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, startDate, endDate } = req.query;

      const appointments = await this.patientService.getPatientAppointments(id, {
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
      logger.error('Get patient appointments error:', error);
      next(error);
    }
  };

  getPatientPrescriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const prescriptions = await this.patientService.getPatientPrescriptions(id);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.PRESCRIPTIONS_RETRIEVED || 'Prescriptions retrieved successfully',
        prescriptions
      );
    } catch (error) {
      logger.error('Get patient prescriptions error:', error);
      next(error);
    }
  };

  getPatientStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.patientService.getPatientStats();

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.STATS_RETRIEVED || 'Patient statistics retrieved successfully',
        stats
      );
    } catch (error) {
      logger.error('Get patient stats error:', error);
      next(error);
    }
  };

  searchPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q } = req.query;
      
      if (!q) {
        ResponseHandler.badRequest(res, MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
        return;
      }

      const patients = await this.patientService.searchPatients(q as string);

      ResponseHandler.success(
        res,
        MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully',
        patients
      );
    } catch (error) {
      logger.error('Search patients error:', error);
      next(error);
    }
  };
}