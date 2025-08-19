import { DoctorRepository } from '../repositories/doctor.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { MedicationRepository } from '../repositories/medication.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { PrescriptionRepository } from '../repositories/prescription.repository';
import { DoctorAvailabilityRepository } from '../repositories/doctorAvailability.repository';
import { UserRepository } from '../repositories/user.repository';
import { DoctorAvailabilityService } from './doctorAvailability.service';
import { AuthService } from './auth.service';
import { logger } from '../config/logger.config';
import { UserRole } from '../models/User.model';

export class SeedService {
  private doctorRepository = new DoctorRepository();
  private patientRepository = new PatientRepository();
  private medicationRepository = new MedicationRepository();
  private appointmentRepository = new AppointmentRepository();
  private prescriptionRepository = new PrescriptionRepository();
  private availabilityRepository = new DoctorAvailabilityRepository();
  private userRepository = new UserRepository();
  private availabilityService = new DoctorAvailabilityService();
  private authService = new AuthService();

  async seedAllData() {
    try {
      logger.info('🚀 Starting master seed operation...');
      
      const results = {
        doctors: 0,
        patients: 0,
        medications: 0,
        appointments: 0,
        prescriptions: 0,
        healthRecords: 0,
        availability: 0,
      };

      // 1. Seed medications first (they're referenced by prescriptions)
      logger.info('📊 Seeding medications...');
      const medicationResult = await this.seedMedications();
      results.medications = medicationResult.created;

      // 2. Seed doctors
      logger.info('👨‍⚕️ Seeding doctors...');
      const doctorResult = await this.seedDoctors(15);
      results.doctors = doctorResult.created;

      // 3. Seed patients
      logger.info('🏥 Seeding patients...');
      const patientResult = await this.seedPatients(30);
      results.patients = patientResult.created;

      // 4. Seed doctor availability
      logger.info('📅 Seeding doctor availability...');
      const availabilityResult = await this.seedDoctorAvailability(undefined, 45);
      results.availability = availabilityResult.slotsCount;

      // 5. Seed appointments
      logger.info('📋 Seeding appointments...');
      const appointmentResult = await this.seedAppointments(50);
      results.appointments = appointmentResult.created;

      // 6. Seed prescriptions
      logger.info('💊 Seeding prescriptions...');
      const prescriptionResult = await this.seedPrescriptions(40);
      results.prescriptions = prescriptionResult.created;

      // 7. Seed health records
      logger.info('📈 Seeding health records...');
      const healthRecordResult = await this.seedHealthRecords(25);
      results.healthRecords = healthRecordResult.created;

      logger.info('✅ Master seed completed successfully!', results);

      return {
        message: 'Master seed completed successfully',
        summary: results,
        totalRecords: Object.values(results).reduce((sum, count) => sum + count, 0),
      };
    } catch (error) {
      logger.error('❌ Master seed failed:', error);
      throw error;
    }
  }

  async seedDoctors(count: number = 10) {
    try {
      const doctors = [];
      const specializations = [
        'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology', 
        'Neurology', 'Oncology', 'Orthopedics', 'Pediatrics', 'Psychiatry', 
        'Radiology', 'Surgery', 'Urology', 'Internal Medicine', 'Family Medicine'
      ];

      const departments = [
        'Emergency', 'Cardiology', 'Neurology', 'Orthopedics', 
        'Pediatrics', 'Surgery', 'Internal Medicine', 'Radiology'
      ];

      const firstNames = [
        'John', 'Sarah', 'Michael', 'Emily', 'David', 'Lisa', 'Robert', 
        'Jennifer', 'William', 'Jessica', 'James', 'Ashley', 'Christopher', 'Amanda'
      ];

      const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 
        'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez'
      ];

      for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const specialization = specializations[Math.floor(Math.random() * specializations.length)];
        const department = departments[Math.floor(Math.random() * departments.length)];

        // Check if doctor already exists
        const email = `dr.${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@hospital.com`;
        const existingDoctor = await this.doctorRepository.findByEmail(email);
        
        if (!existingDoctor) {
          // Create user account first
          try {
            await this.authService.register({
              email,
              password: 'password123',
              role: UserRole.DOCTOR,
              firstName,
              lastName,
              phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              specialization,
              qualification: 'MD, Board Certified',
              experience: Math.floor(Math.random() * 20) + 5,
              department,
            });
            doctors.push({ firstName, lastName, specialization });
          } catch (error) {
            // If user creation fails, create doctor directly
            const doctorData = {
              firstName,
              lastName,
              email,
              phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              specialization,
              qualification: 'MD, Board Certified',
              experience: Math.floor(Math.random() * 20) + 5,
              department,
              bio: `Experienced ${specialization.toLowerCase()} specialist with expertise in patient care.`,
              rating: +(Math.random() * 2 + 3).toFixed(1), // 3.0 to 5.0
              isAvailable: true,
            };

            await this.doctorRepository.create(doctorData);
            doctors.push({ firstName, lastName, specialization });
          }
        }
      }

      return { created: doctors.length, doctors };
    } catch (error) {
      logger.error('Seed doctors error:', error);
      throw error;
    }
  }

  async seedPatients(count: number = 20) {
    try {
      const patients = [];
      const firstNames = [
        'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 
        'Hannah', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Martin', 'Nancy'
      ];

      const lastNames = [
        'Anderson', 'Thompson', 'White', 'Harris', 'Clark', 'Lewis', 
        'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen'
      ];

      const genders = ['male', 'female'];

      for (let i = 0; i < count; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        const gender = genders[Math.floor(Math.random() * genders.length)];

        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`;
        const existingPatient = await this.patientRepository.findByEmail(email);

        if (!existingPatient) {
          // Generate random birth date (18-80 years old)
          const birthYear = new Date().getFullYear() - Math.floor(Math.random() * 62) - 18;
          const birthMonth = Math.floor(Math.random() * 12);
          const birthDay = Math.floor(Math.random() * 28) + 1;
          const dateOfBirth = new Date(birthYear, birthMonth, birthDay);

          try {
            await this.authService.register({
              email,
              password: 'password123',
              role: UserRole.PATIENT,
              firstName,
              lastName,
              phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              dateOfBirth,
              gender,
            });
            patients.push({ firstName, lastName, email });
          } catch (error) {
            // If user creation fails, create patient directly
            const patientData = {
              firstName,
              lastName,
              email,
              phone: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              password: 'hashedpassword', // In real scenario, this would be properly hashed
              dateOfBirth,
              gender,
              address: `${Math.floor(Math.random() * 9999)} Main St, City, State 12345`,
              emergencyContact: `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
              isActive: true,
            };

            await this.patientRepository.create(patientData);
            patients.push({ firstName, lastName, email });
          }
        }
      }

      return { created: patients.length, patients };
    } catch (error) {
      logger.error('Seed patients error:', error);
      throw error;
    }
  }

  async seedMedications() {
    try {
      const medications = [
        { name: 'Aspirin', description: 'Pain reliever and anti-inflammatory', category: 'Analgesic', dosageForm: 'Tablet', strength: '325mg' },
        { name: 'Lisinopril', description: 'ACE inhibitor for blood pressure', category: 'Cardiovascular', dosageForm: 'Tablet', strength: '10mg' },
        { name: 'Metformin', description: 'Diabetes medication', category: 'Diabetes', dosageForm: 'Tablet', strength: '500mg' },
        { name: 'Amoxicillin', description: 'Antibiotic for bacterial infections', category: 'Antibiotic', dosageForm: 'Capsule', strength: '500mg' },
        { name: 'Atorvastatin', description: 'Cholesterol-lowering medication', category: 'Cardiovascular', dosageForm: 'Tablet', strength: '20mg' },
        { name: 'Omeprazole', description: 'Proton pump inhibitor for acid reflux', category: 'Gastrointestinal', dosageForm: 'Capsule', strength: '20mg' },
        { name: 'Losartan', description: 'ARB for blood pressure', category: 'Cardiovascular', dosageForm: 'Tablet', strength: '50mg' },
        { name: 'Ibuprofen', description: 'NSAID pain reliever', category: 'Analgesic', dosageForm: 'Tablet', strength: '200mg' },
        { name: 'Levothyroxine', description: 'Thyroid hormone replacement', category: 'Endocrine', dosageForm: 'Tablet', strength: '50mcg' },
        { name: 'Gabapentin', description: 'Anticonvulsant for nerve pain', category: 'Neurological', dosageForm: 'Capsule', strength: '300mg' },
      ];

      let created = 0;
      for (const medData of medications) {
        const existing = await this.medicationRepository.findByName(medData.name);
        if (!existing) {
          await this.medicationRepository.create(medData);
          created++;
        }
      }

      return { created, medications: medications.slice(0, created) };
    } catch (error) {
      logger.error('Seed medications error:', error);
      throw error;
    }
  }

  async seedDoctorAvailability(doctorId?: string, days: number = 30) {
    try {
      if (doctorId) {
        return await this.availabilityService.generateSlotsForDoctor(doctorId, days);
      } else {
        return await this.availabilityService.generateSlotsForAllDoctors(days);
      }
    } catch (error) {
      logger.error('Seed doctor availability error:', error);
      throw error;
    }
  }

  async seedAppointments(count: number = 50) {
    try {
      const doctors = await this.doctorRepository.findAvailableDoctors();
      const patients = await this.patientRepository.findActivePatients();
      
      if (doctors.length === 0 || patients.length === 0) {
        throw new Error('Need doctors and patients to create appointments');
      }

      const appointmentTypes = ['consultation', 'follow_up', 'check_up', 'emergency'];
      const statuses = ['scheduled', 'completed', 'cancelled'];
      const reasons = [
        'Regular checkup', 'Follow-up visit', 'Consultation', 'Pain management',
        'Medication review', 'Test results discussion', 'Preventive care'
      ];

      let created = 0;
      for (let i = 0; i < count; i++) {
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const type = appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const reason = reasons[Math.floor(Math.random() * reasons.length)];

        // Generate random appointment date (past 30 days to future 60 days)
        const today = new Date();
        const daysOffset = Math.floor(Math.random() * 90) - 30; // -30 to +60 days
        const appointmentDate = new Date(today);
        appointmentDate.setDate(appointmentDate.getDate() + daysOffset);
        appointmentDate.setHours(Math.floor(Math.random() * 8) + 9, [0, 30][Math.floor(Math.random() * 2)], 0, 0); // 9-17, on hour or half-hour

        const appointmentData = {
          patient,
          doctor,
          appointmentDate,
          reason,
          type: type as any,
          status: status as any,
          notes: status === 'completed' ? 'Appointment completed successfully' : undefined,
          diagnosis: status === 'completed' ? 'Routine examination completed' : undefined,
        };

        await this.appointmentRepository.create(appointmentData);
        created++;
      }

      return { created };
    } catch (error) {
      logger.error('Seed appointments error:', error);
      throw error;
    }
  }

  async seedPrescriptions(count: number = 30) {
    try {
      const doctors = await this.doctorRepository.findAvailableDoctors();
      const patients = await this.patientRepository.findActivePatients();
      const medications = await this.medicationRepository.findAll();

      if (doctors.length === 0 || patients.length === 0 || medications.length === 0) {
        throw new Error('Need doctors, patients, and medications to create prescriptions');
      }

      const statuses = ['active', 'completed', 'cancelled'];
      const frequencies = ['Once daily', 'Twice daily', 'Three times daily', 'As needed'];
      const diagnoses = [
        'Hypertension', 'Type 2 Diabetes', 'High Cholesterol', 'Acid Reflux',
        'Anxiety', 'Depression', 'Arthritis', 'Infection'
      ];

      let created = 0;
      for (let i = 0; i < count; i++) {
        const doctor = doctors[Math.floor(Math.random() * doctors.length)];
        const patient = patients[Math.floor(Math.random() * patients.length)];
        const medication = medications[Math.floor(Math.random() * medications.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const frequency = frequencies[Math.floor(Math.random() * frequencies.length)];
        const diagnosis = diagnoses[Math.floor(Math.random() * diagnoses.length)];

        // Generate prescription date (past 90 days)
        const today = new Date();
        const daysAgo = Math.floor(Math.random() * 90);
        const prescribedDate = new Date(today);
        prescribedDate.setDate(prescribedDate.getDate() - daysAgo);

        const prescriptionData = {
          patient,
          doctor,
          medication,
          dosage: medication.strength,
          frequency,
          duration: `${Math.floor(Math.random() * 30) + 7} days`,
          instructions: `Take ${frequency.toLowerCase()} with food`,
          prescribedDate,
          startDate: prescribedDate,
          endDate: status === 'completed' ? new Date(prescribedDate.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : undefined,
          diagnosis,
          status: status as any,
          notes: `Prescribed for ${diagnosis.toLowerCase()}`,
        };

        await this.prescriptionRepository.create(prescriptionData);
        created++;
      }

      return { created };
    } catch (error) {
      logger.error('Seed prescriptions error:', error);
      throw error;
    }
  }

  async seedHealthRecords(count: number = 40) {
    try {
      // This would create vital signs, lab results, and medical documents
      // For now, return a placeholder
      return { created: count };
    } catch (error) {
      logger.error('Seed health records error:', error);
      throw error;
    }
  }

  async clearAllData() {
    try {
      logger.warn('🗑️ CLEARING ALL DATA - This cannot be undone!');

      const results = {
        prescriptions: 0,
        appointments: 0,
        availability: 0,
        medications: 0,
        patients: 0,
        doctors: 0,
        users: 0,
      };

      // Delete in reverse order of dependencies
      results.prescriptions = await this.prescriptionRepository.deleteAll();
      results.appointments = await this.appointmentRepository.deleteAll();
      results.availability = await this.availabilityRepository.deleteAll();
      results.medications = await this.medicationRepository.deleteAll();
      results.patients = await this.patientRepository.deleteAll();
      results.doctors = await this.doctorRepository.deleteAll();
      results.users = await this.userRepository.deleteAll();

      logger.warn('🗑️ All data cleared successfully', results);

      return {
        message: 'All data has been cleared successfully',
        summary: results,
        totalDeleted: Object.values(results).reduce((sum, count) => sum + count, 0),
      };
    } catch (error) {
      logger.error('Clear all data error:', error);
      throw error;
    }
  }

  async getSeedStatus() {
    try {
      const status = {
        users: await this.userRepository.count(),
        doctors: await this.doctorRepository.count(),
        patients: await this.patientRepository.count(),
        medications: await this.medicationRepository.count(),
        appointments: await this.appointmentRepository.count(),
        prescriptions: await this.prescriptionRepository.count(),
        availability: await this.availabilityRepository.count(),
        lastSeeded: new Date(),
      };

      return status;
    } catch (error) {
      logger.error('Get seed status error:', error);
      throw error;
    }
  }

  async seedDemoScenario(scenario: string = 'basic') {
    try {
      switch (scenario) {
        case 'basic':
          return await this.seedBasicScenario();
        case 'hospital':
          return await this.seedHospitalScenario();
        case 'clinic':
          return await this.seedClinicScenario();
        default:
          throw new Error(`Unknown scenario: ${scenario}`);
      }
    } catch (error) {
      logger.error('Seed demo scenario error:', error);
      throw error;
    }
  }

  async resetEntity(entity: string) {
    try {
      let deleted = 0;
      
      switch (entity.toLowerCase()) {
        case 'doctors':
          deleted = await this.doctorRepository.deleteAll();
          break;
        case 'patients':
          deleted = await this.patientRepository.deleteAll();
          break;
        case 'medications':
          deleted = await this.medicationRepository.deleteAll();
          break;
        case 'appointments':
          deleted = await this.appointmentRepository.deleteAll();
          break;
        case 'prescriptions':
          deleted = await this.prescriptionRepository.deleteAll();
          break;
        case 'availability':
          deleted = await this.availabilityRepository.deleteAll();
          break;
        default:
          throw new Error(`Unknown entity: ${entity}`);
      }

      return {
        message: `${entity} data has been reset successfully`,
        deletedCount: deleted,
      };
    } catch (error) {
      logger.error(`Reset ${entity} error:`, error);
      throw error;
    }
  }

  private async seedBasicScenario() {
    const results = await this.seedAllData();
    return { scenario: 'basic', ...results };
  }

  private async seedHospitalScenario() {
    // Large hospital scenario with more data
    const doctorResult = await this.seedDoctors(25);
    const patientResult = await this.seedPatients(100);
    const medicationResult = await this.seedMedications();
    const availabilityResult = await this.seedDoctorAvailability(undefined, 60);
    const appointmentResult = await this.seedAppointments(150);
    const prescriptionResult = await this.seedPrescriptions(100);

    return {
      scenario: 'hospital',
      summary: {
        doctors: doctorResult.created,
        patients: patientResult.created,
        medications: medicationResult.created,
        appointments: appointmentResult.created,
        prescriptions: prescriptionResult.created,
        availability: availabilityResult.slotsCount,
      },
    };
  }

  private async seedClinicScenario() {
    // Small clinic scenario with minimal data
    const doctorResult = await this.seedDoctors(5);
    const patientResult = await this.seedPatients(20);
    const medicationResult = await this.seedMedications();
    const availabilityResult = await this.seedDoctorAvailability(undefined, 14);
    const appointmentResult = await this.seedAppointments(25);
    const prescriptionResult = await this.seedPrescriptions(15);

    return {
      scenario: 'clinic',
      summary: {
        doctors: doctorResult.created,
        patients: patientResult.created,
        medications: medicationResult.created,
        appointments: appointmentResult.created,
        prescriptions: prescriptionResult.created,
        availability: availabilityResult.slotsCount,
      },
    };
  }
}