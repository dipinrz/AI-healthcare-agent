"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AvailabilitySeedService = void 0;
const database_1 = require("../config/database");
const DoctorAvailability_1 = require("../entities/DoctorAvailability");
const Doctor_1 = require("../entities/Doctor");
class AvailabilitySeedService {
    constructor() {
        this.availabilityRepository = database_1.AppDataSource.getRepository(DoctorAvailability_1.DoctorAvailability);
        this.doctorRepository = database_1.AppDataSource.getRepository(Doctor_1.Doctor);
    }
    async generateMonthlySlots(doctorId) {
        try {
            let doctors = [];
            if (doctorId) {
                const doctor = await this.doctorRepository.findOne({ where: { id: doctorId } });
                if (!doctor) {
                    throw new Error(`Doctor with ID ${doctorId} not found`);
                }
                doctors = [doctor];
            }
            else {
                doctors = await this.doctorRepository.find();
            }
            if (doctors.length === 0) {
                throw new Error('No doctors found in the database');
            }
            const slots = [];
            const today = new Date();
            const endDate = new Date();
            endDate.setDate(today.getDate() + 30); // Next 30 days
            for (const doctor of doctors) {
                console.log(`Generating slots for Dr. ${doctor.firstName} ${doctor.lastName}`);
                const currentDate = new Date(today);
                while (currentDate <= endDate) {
                    // Skip Sundays (0 = Sunday)
                    if (currentDate.getDay() !== 0) {
                        const dailySlots = this.generateDailySlots(doctor, new Date(currentDate));
                        slots.push(...dailySlots);
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
            }
            // Clear existing slots for the date range
            await this.availabilityRepository
                .createQueryBuilder()
                .delete()
                .where('startTime >= :startDate AND startTime <= :endDate', {
                startDate: today,
                endDate: endDate
            })
                .execute();
            // Insert new slots in batches
            const batchSize = 100;
            for (let i = 0; i < slots.length; i += batchSize) {
                const batch = slots.slice(i, i + batchSize);
                await this.availabilityRepository.save(batch);
            }
            console.log(`Generated ${slots.length} availability slots for ${doctors.length} doctors`);
            return {
                message: `Successfully generated ${slots.length} slots for ${doctors.length} doctors`,
                slotsCount: slots.length,
                doctorsCount: doctors.length
            };
        }
        catch (error) {
            console.error('Error generating monthly slots:', error);
            throw error;
        }
    }
    generateDailySlots(doctor, date) {
        const slots = [];
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Define working hours based on day
        let startHour = 9;
        let endHour = 17;
        // Saturday: shorter hours
        if (dayOfWeek === 6) {
            startHour = 9;
            endHour = 14; // Half day on Saturday
        }
        // Skip Sunday
        if (dayOfWeek === 0) {
            return slots;
        }
        // Generate 30-minute slots
        const slotDuration = 30; // minutes
        for (let hour = startHour; hour < endHour; hour++) {
            for (let minute = 0; minute < 60; minute += slotDuration) {
                const startTime = new Date(date);
                startTime.setHours(hour, minute, 0, 0);
                const endTime = new Date(startTime);
                endTime.setMinutes(endTime.getMinutes() + slotDuration);
                // Skip lunch break (12:30 PM - 1:30 PM)
                if (hour === 12 && minute >= 30 || hour === 13 && minute < 30) {
                    continue;
                }
                // Only create future slots
                if (startTime > new Date()) {
                    const slot = new DoctorAvailability_1.DoctorAvailability();
                    slot.doctor = doctor;
                    slot.startTime = startTime;
                    slot.endTime = endTime;
                    slot.isBooked = false;
                    slots.push(slot);
                }
            }
        }
        return slots;
    }
    async seedDemoData() {
        try {
            // Check if we have any doctors in the database
            const doctorCount = await this.doctorRepository.count();
            if (doctorCount === 0) {
                // Create some demo doctors if none exist
                await this.createDemoDoctors();
            }
            // Generate availability slots for all doctors
            const result = await this.generateMonthlySlots();
            return result;
        }
        catch (error) {
            console.error('Error seeding demo data:', error);
            throw error;
        }
    }
    async createDemoDoctors() {
        const demoDoctors = [
            {
                firstName: 'John',
                lastName: 'Smith',
                specialization: 'Cardiology',
                qualification: 'MD, FACC',
                experience: 12,
                email: 'dr.john.smith@hospital.com',
                phone: '+1234567890',
                department: 'Cardiology',
                bio: 'Experienced cardiologist specializing in interventional cardiology.',
                rating: 4.8,
                isAvailable: true
            },
            {
                firstName: 'Sarah',
                lastName: 'Johnson',
                specialization: 'Dermatology',
                qualification: 'MD, Board Certified',
                experience: 8,
                email: 'dr.sarah.johnson@hospital.com',
                phone: '+1234567891',
                department: 'Dermatology',
                bio: 'Specialist in medical and cosmetic dermatology.',
                rating: 4.9,
                isAvailable: true
            },
            {
                firstName: 'Michael',
                lastName: 'Brown',
                specialization: 'Orthopedics',
                qualification: 'MD, MS Orthopedics',
                experience: 15,
                email: 'dr.michael.brown@hospital.com',
                phone: '+1234567892',
                department: 'Orthopedics',
                bio: 'Orthopedic surgeon specializing in joint replacement.',
                rating: 4.7,
                isAvailable: true
            },
            {
                firstName: 'Emily',
                lastName: 'Davis',
                specialization: 'Pediatrics',
                qualification: 'MD, Board Certified Pediatrics',
                experience: 10,
                email: 'dr.emily.davis@hospital.com',
                phone: '+1234567893',
                department: 'Pediatrics',
                bio: 'Pediatrician with expertise in child development.',
                rating: 4.9,
                isAvailable: true
            },
            {
                firstName: 'Robert',
                lastName: 'Wilson',
                specialization: 'Internal Medicine',
                qualification: 'MD, FACP',
                experience: 20,
                email: 'dr.robert.wilson@hospital.com',
                phone: '+1234567894',
                department: 'Internal Medicine',
                bio: 'Internal medicine physician with focus on preventive care.',
                rating: 4.6,
                isAvailable: true
            }
        ];
        for (const doctorData of demoDoctors) {
            const existingDoctor = await this.doctorRepository.findOne({
                where: { email: doctorData.email }
            });
            if (!existingDoctor) {
                const doctor = this.doctorRepository.create(doctorData);
                await this.doctorRepository.save(doctor);
                console.log(`Created demo doctor: Dr. ${doctorData.firstName} ${doctorData.lastName}`);
            }
        }
    }
}
exports.AvailabilitySeedService = AvailabilitySeedService;
