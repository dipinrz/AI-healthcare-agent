import { AppDataSource } from '../config/database';
import { Prescription, PrescriptionStatus } from '../entities/Prescription';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { Medication } from '../entities/Medication';
import { User, UserRole } from '../entities/User';

export async function seedPrescriptions(): Promise<void> {
  const prescriptionRepository = AppDataSource.getRepository(Prescription);
  const patientRepository = AppDataSource.getRepository(Patient);
  const doctorRepository = AppDataSource.getRepository(Doctor);
  const medicationRepository = AppDataSource.getRepository(Medication);
  const userRepository = AppDataSource.getRepository(User);

  try {
    // Check if prescriptions already exist
    const existingPrescriptions = await prescriptionRepository.count();
    if (existingPrescriptions > 0) {
      console.log('Prescriptions already exist, skipping seeding');
      return;
    }

    // Get sample data from existing entities
    const patients = await patientRepository.find({ take: 2 });
    const doctors = await doctorRepository.find({ take: 2 });
    const medications = await medicationRepository.find({ take: 5 });

    if (patients.length === 0 || doctors.length === 0 || medications.length === 0) {
      console.log('Missing required data for prescription seeding (patients, doctors, or medications)');
      return;
    }

    const samplePrescriptions = [
      {
        patient: patients[0],
        doctor: doctors[0],
        medication: medications[0],  // Should be Lisinopril from medication seeder
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with or without food, preferably at the same time each day',
        quantity: 30,
        refills: 2,
        status: PrescriptionStatus.ACTIVE,
        notes: 'Monitor blood pressure regularly',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        patient: patients[0],
        doctor: doctors[0],
        medication: medications[1],  // Should be Metformin from medication seeder
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '60 days',
        instructions: 'Take with meals to reduce stomach upset',
        quantity: 120,
        refills: 3,
        status: PrescriptionStatus.ACTIVE,
        notes: 'Regular blood glucose monitoring recommended',
        startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        endDate: new Date(Date.now() + 53 * 24 * 60 * 60 * 1000) // 53 days from now
      },
      {
        patient: patients[0],
        doctor: doctors[0],
        medication: medications[2],  // Should be Omeprazole from medication seeder
        dosage: '20mg',
        frequency: 'Once daily',
        duration: '14 days',
        instructions: 'Take before breakfast',
        quantity: 14,
        refills: 0,
        status: PrescriptionStatus.COMPLETED,
        notes: 'Short course for acid reflux',
        startDate: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
        endDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 days ago
      }
    ];

    // If we have a second patient, add prescriptions for them too
    if (patients.length > 1) {
      samplePrescriptions.push(
        {
          patient: patients[1],
          doctor: doctors[0],
          medication: medications[3] || medications[0],
          dosage: '25mg',
          frequency: 'Once daily',
          duration: '30 days',
          instructions: 'Take at bedtime',
          quantity: 30,
          refills: 1,
          status: PrescriptionStatus.ACTIVE,
          notes: 'May cause drowsiness',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      );
    }

    for (const prescriptionData of samplePrescriptions) {
      const prescription = prescriptionRepository.create(prescriptionData);
      await prescriptionRepository.save(prescription);
    }

    console.log(`✅ Successfully seeded ${samplePrescriptions.length} sample prescriptions`);
  } catch (error) {
    console.error('❌ Failed to seed prescriptions:', error);
  }
}