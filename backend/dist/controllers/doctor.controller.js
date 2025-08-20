"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DoctorController = void 0;
const doctor_service_1 = require("../services/doctor.service");
const responseHandler_1 = require("../utils/responseHandler");
const messages_1 = require("../constants/messages");
const logger_config_1 = require("../config/logger.config");
class DoctorController {
    constructor() {
        this.doctorService = new doctor_service_1.DoctorService();
        this.getAllDoctors = async (req, res, next) => {
            try {
                const { search, specialization, department, minRating, minExperience, isAvailable, page = 1, limit = 10 } = req.query;
                const filters = {
                    search: search,
                    specialization: specialization,
                    department: department,
                    minRating: minRating ? parseFloat(minRating) : undefined,
                    minExperience: minExperience ? parseInt(minExperience) : undefined,
                    isAvailable: isAvailable ? isAvailable === 'true' : undefined,
                };
                const result = await this.doctorService.getAllDoctors(filters, parseInt(page), parseInt(limit));
                responseHandler_1.ResponseHandler.paginated(res, messages_1.MESSAGES.SUCCESS.DOCTORS_RETRIEVED || 'Doctors retrieved successfully', result.data, result.total, result.page, result.limit);
            }
            catch (error) {
                logger_config_1.logger.error('Get all doctors error:', error);
                next(error);
            }
        };
        this.getDoctorById = async (req, res, next) => {
            try {
                const { id } = req.params;
                const doctor = await this.doctorService.getDoctorById(id);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.DOCTOR_RETRIEVED || 'Doctor retrieved successfully', doctor);
            }
            catch (error) {
                logger_config_1.logger.error('Get doctor by ID error:', error);
                next(error);
            }
        };
        this.createDoctor = async (req, res, next) => {
            try {
                const doctorData = req.body;
                const doctor = await this.doctorService.createDoctor(doctorData);
                responseHandler_1.ResponseHandler.created(res, messages_1.MESSAGES.SUCCESS.DOCTOR_CREATED, doctor);
            }
            catch (error) {
                logger_config_1.logger.error('Create doctor error:', error);
                next(error);
            }
        };
        this.updateDoctor = async (req, res, next) => {
            try {
                const { id } = req.params;
                const updateData = req.body;
                const doctor = await this.doctorService.updateDoctor(id, updateData);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.DOCTOR_UPDATED, doctor);
            }
            catch (error) {
                logger_config_1.logger.error('Update doctor error:', error);
                next(error);
            }
        };
        this.deleteDoctor = async (req, res, next) => {
            try {
                const { id } = req.params;
                await this.doctorService.deleteDoctor(id);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.DOCTOR_DELETED || 'Doctor deleted successfully');
            }
            catch (error) {
                logger_config_1.logger.error('Delete doctor error:', error);
                next(error);
            }
        };
        this.getDoctorAppointments = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { status, startDate, endDate } = req.query;
                const appointments = await this.doctorService.getDoctorAppointments(id, {
                    status: status,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.APPOINTMENTS_RETRIEVED || 'Appointments retrieved successfully', appointments);
            }
            catch (error) {
                logger_config_1.logger.error('Get doctor appointments error:', error);
                next(error);
            }
        };
        this.getDoctorAvailability = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { date, startDate, endDate } = req.query;
                const availability = await this.doctorService.getDoctorAvailability(id, {
                    date: date ? new Date(date) : undefined,
                    startDate: startDate ? new Date(startDate) : undefined,
                    endDate: endDate ? new Date(endDate) : undefined,
                });
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.AVAILABILITY_RETRIEVED || 'Availability retrieved successfully', availability);
            }
            catch (error) {
                logger_config_1.logger.error('Get doctor availability error:', error);
                next(error);
            }
        };
        this.updateDoctorAvailability = async (req, res, next) => {
            try {
                const { id } = req.params;
                const { isAvailable } = req.body;
                const doctor = await this.doctorService.updateAvailability(id, isAvailable);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.AVAILABILITY_UPDATED || 'Availability updated successfully', doctor);
            }
            catch (error) {
                logger_config_1.logger.error('Update doctor availability error:', error);
                next(error);
            }
        };
        this.getDoctorStats = async (req, res, next) => {
            try {
                const stats = await this.doctorService.getDoctorStats();
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.STATS_RETRIEVED || 'Doctor statistics retrieved successfully', stats);
            }
            catch (error) {
                logger_config_1.logger.error('Get doctor stats error:', error);
                next(error);
            }
        };
        this.getSpecializations = async (req, res, next) => {
            try {
                const specializations = await this.doctorService.getSpecializations();
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SPECIALIZATIONS_RETRIEVED || 'Specializations retrieved successfully', specializations);
            }
            catch (error) {
                logger_config_1.logger.error('Get specializations error:', error);
                next(error);
            }
        };
        this.getDepartments = async (req, res, next) => {
            try {
                const departments = await this.doctorService.getDepartments();
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.DEPARTMENTS_RETRIEVED || 'Departments retrieved successfully', departments);
            }
            catch (error) {
                logger_config_1.logger.error('Get departments error:', error);
                next(error);
            }
        };
        this.searchDoctors = async (req, res, next) => {
            try {
                const { q } = req.query;
                if (!q) {
                    responseHandler_1.ResponseHandler.badRequest(res, messages_1.MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
                    return;
                }
                const doctors = await this.doctorService.searchDoctors(q);
                responseHandler_1.ResponseHandler.success(res, messages_1.MESSAGES.SUCCESS.SEARCH_COMPLETED || 'Search completed successfully', doctors);
            }
            catch (error) {
                logger_config_1.logger.error('Search doctors error:', error);
                next(error);
            }
        };
        this.fuzzySearchByDepartment = async (req, res, next) => {
            try {
                const { q } = req.query;
                if (!q) {
                    responseHandler_1.ResponseHandler.badRequest(res, messages_1.MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Search term is required');
                    return;
                }
                const doctors = await this.doctorService.fuzzySearchByDepartment(q);
                responseHandler_1.ResponseHandler.success(res, `Found ${doctors.length} doctors matching "${q}"`, doctors);
            }
            catch (error) {
                logger_config_1.logger.error('Fuzzy search by department error:', error);
                next(error);
            }
        };
        this.searchDoctorsByName = async (req, res, next) => {
            try {
                const { name } = req.query;
                if (!name) {
                    responseHandler_1.ResponseHandler.badRequest(res, messages_1.MESSAGES.VALIDATION.SEARCH_TERM_REQUIRED || 'Name is required');
                    return;
                }
                const doctors = await this.doctorService.searchDoctorsByName(name);
                responseHandler_1.ResponseHandler.success(res, `Found ${doctors.length} doctors matching "${name}"`, doctors);
            }
            catch (error) {
                logger_config_1.logger.error('Search doctors by name error:', error);
                next(error);
            }
        };
    }
}
exports.DoctorController = DoctorController;
