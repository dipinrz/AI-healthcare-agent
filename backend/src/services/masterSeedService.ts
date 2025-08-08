import { AppDataSource } from '../config/database';
import { User, UserRole } from '../entities/User';
import { Patient } from '../entities/Patient';
import { Doctor } from '../entities/Doctor';
import { Appointment, AppointmentStatus, AppointmentType } from '../entities/Appointment';
import { Medication } from '../entities/Medication';
import { Prescription, PrescriptionStatus } from '../entities/Prescription';
import { LabResult, LabResultStatus } from '../entities/LabResult';
import { VitalSigns } from '../entities/VitalSigns';
import { ChatLog, MessageType, AgentType } from '../entities/ChatLog';
import { MedicalDocument, DocumentType } from '../entities/MedicalDocument';
import { DoctorAvailability } from '../entities/DoctorAvailability';
import bcrypt from 'bcryptjs';

export class MasterSeedService {
  private userRepository = AppDataSource.getRepository(User);
  private patientRepository = AppDataSource.getRepository(Patient);
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private appointmentRepository = AppDataSource.getRepository(Appointment);
  private medicationRepository = AppDataSource.getRepository(Medication);
  private prescriptionRepository = AppDataSource.getRepository(Prescription);
  private labResultRepository = AppDataSource.getRepository(LabResult);
  private vitalSignsRepository = AppDataSource.getRepository(VitalSigns);
  private chatLogRepository = AppDataSource.getRepository(ChatLog);
  private medicalDocumentRepository = AppDataSource.getRepository(MedicalDocument);
  private availabilityRepository = AppDataSource.getRepository(DoctorAvailability);

  async seedAllData() {
    try {
      console.log('🌱 Starting comprehensive database seeding...');

      // Clear existing data (optional)
      await this.clearAllData();

      // Seed in order of dependencies
      const users = await this.seedUsers();
      const patients = await this.seedPatients(users.filter(u => u.role === UserRole.PATIENT));
      const doctors = await this.seedDoctors(users.filter(u => u.role === UserRole.DOCTOR));
      const medications = await this.seedMedications();
      
      // Generate doctor availability slots
      await this.seedDoctorAvailability(doctors);
      
      // Seed appointments
      const appointments = await this.seedAppointments(patients, doctors);
      
      // Seed prescriptions
      await this.seedPrescriptions(patients, doctors, medications);
      
      // Seed lab results
      await this.seedLabResults(patients, doctors);
      
      // Seed vital signs
      await this.seedVitalSigns(patients, doctors);
      
      // Seed medical documents
      await this.seedMedicalDocuments(patients, doctors);
      
      // Seed chat logs
      await this.seedChatLogs(patients, doctors);

      console.log('✅ Database seeding completed successfully!');
      
      return {
        message: 'Database seeded successfully',
        data: {
          users: users.length,
          patients: patients.length,
          doctors: doctors.length,
          medications: medications.length,
          appointments: appointments.length
        }
      };
    } catch (error) {
      console.error('❌ Database seeding failed:', error);
      throw error;
    }
  }

  private async clearAllData() {
    console.log('🧹 Clearing existing data...');
    
    // Clear in reverse dependency order
    await this.chatLogRepository.clear();
    await this.medicalDocumentRepository.clear();
    await this.vitalSignsRepository.clear();
    await this.labResultRepository.clear();
    await this.prescriptionRepository.clear();
    await this.appointmentRepository.clear();
    await this.availabilityRepository.clear();
    await this.medicationRepository.clear();
    await this.doctorRepository.clear();
    await this.patientRepository.clear();
    await this.userRepository.clear();
    
    console.log('✅ Data cleared');
  }

  private async seedUsers() {
    console.log('👥 Seeding users...');
    
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const usersData = [
      // Admin users
      { email: 'admin@hospital.com', password: hashedPassword, role: UserRole.ADMIN },
      
      // Patient users
      { email: 'arjun.mehta@email.com', password: hashedPassword, role: UserRole.PATIENT },
      { email: 'priya.sharma@email.com', password: hashedPassword, role: UserRole.PATIENT },
      { email: 'rohit.verma@email.com', password: hashedPassword, role: UserRole.PATIENT },
      { email: 'anita.singh@email.com', password: hashedPassword, role: UserRole.PATIENT },
      { email: 'vikram.gupta@email.com', password: hashedPassword, role: UserRole.PATIENT },
      
      // Doctor users
      { email: 'dr.ravi.kumar@hospital.com', password: hashedPassword, role: UserRole.DOCTOR },
      { email: 'dr.sarah.johnson@hospital.com', password: hashedPassword, role: UserRole.DOCTOR },
      { email: 'dr.michael.brown@hospital.com', password: hashedPassword, role: UserRole.DOCTOR },
      { email: 'dr.emily.davis@hospital.com', password: hashedPassword, role: UserRole.DOCTOR },
      { email: 'dr.robert.wilson@hospital.com', password: hashedPassword, role: UserRole.DOCTOR },
    ];

    const users = [];
    for (const userData of usersData) {
      const user = this.userRepository.create(userData);
      const savedUser = await this.userRepository.save(user);
      users.push(savedUser);
    }

    console.log(`✅ Created ${users.length} users`);
    return users;
  }

  private async seedPatients(userList: User[]) {
    console.log('🏥 Seeding patients...');
    
    const patientsData = [
      {
        firstName: 'Arjun', lastName: 'Mehta', email: 'arjun.mehta@email.com',
        phone: '9876543210', password: await bcrypt.hash('password123', 12),
        dateOfBirth: new Date('1978-03-15'), gender: 'Male',
        address: '123 MG Road, Mumbai, Maharashtra', allergies: ['Penicillin', 'Shellfish'],
        emergencyContact: 'Wife: Sunita Mehta - 9876543211'
      },
      {
        firstName: 'Priya', lastName: 'Sharma', email: 'priya.sharma@email.com',
        phone: '9876543212', password: await bcrypt.hash('password123', 12),
        dateOfBirth: new Date('1985-07-22'), gender: 'Female',
        address: '456 Park Street, Delhi, Delhi', allergies: ['Dust'],
        emergencyContact: 'Husband: Raj Sharma - 9876543213'
      },
      {
        firstName: 'Rohit', lastName: 'Verma', email: 'rohit.verma@email.com',
        phone: '9876543214', password: await bcrypt.hash('password123', 12),
        dateOfBirth: new Date('1990-11-08'), gender: 'Male',
        address: '789 Brigade Road, Bangalore, Karnataka', allergies: [],
        emergencyContact: 'Father: Suresh Verma - 9876543215'
      },
      {
        firstName: 'Anita', lastName: 'Singh', email: 'anita.singh@email.com',
        phone: '9876543216', password: await bcrypt.hash('password123', 12),
        dateOfBirth: new Date('1982-05-12'), gender: 'Female',
        address: '321 Civil Lines, Pune, Maharashtra', allergies: ['Peanuts'],
        emergencyContact: 'Sister: Kavita Singh - 9876543217'
      },
      {
        firstName: 'Vikram', lastName: 'Gupta', email: 'vikram.gupta@email.com',
        phone: '9876543218', password: await bcrypt.hash('password123', 12),
        dateOfBirth: new Date('1975-12-03'), gender: 'Male',
        address: '654 Salt Lake, Kolkata, West Bengal', allergies: ['Sulfa drugs'],
        emergencyContact: 'Wife: Ritu Gupta - 9876543219'
      }
    ];

    const patients = [];
    for (const patientData of patientsData) {
      const patient = this.patientRepository.create(patientData);
      const savedPatient = await this.patientRepository.save(patient);
      patients.push(savedPatient);

      // Link to user
      const user = userList.find(u => u.email === patientData.email);
      if (user) {
        user.patient = savedPatient;
        await this.userRepository.save(user);
      }
    }

    console.log(`✅ Created ${patients.length} patients`);
    return patients;
  }

  private async seedDoctors(userList: User[]) {
    console.log('👨‍⚕️ Seeding doctors...');
    
    const doctorsData = [
      {
        firstName: 'Ravi', lastName: 'Kumar', email: 'dr.ravi.kumar@hospital.com',
        phone: '+91-9876543220', specialization: 'Cardiology', qualification: 'MD, DM Cardiology',
        experience: 15, department: 'Cardiology',
        bio: 'Senior Cardiologist with expertise in interventional cardiology and heart disease prevention.',
        rating: 4.8, isAvailable: true
      },
      {
        firstName: 'Sarah', lastName: 'Johnson', email: 'dr.sarah.johnson@hospital.com',
        phone: '+91-9876543221', specialization: 'Dermatology', qualification: 'MD Dermatology',
        experience: 10, department: 'Dermatology',
        bio: 'Specialist in medical and cosmetic dermatology with focus on skin cancer treatment.',
        rating: 4.9, isAvailable: true
      },
      {
        firstName: 'Michael', lastName: 'Brown', email: 'dr.michael.brown@hospital.com',
        phone: '+91-9876543222', specialization: 'Orthopedics', qualification: 'MS Orthopedics',
        experience: 18, department: 'Orthopedics',
        bio: 'Orthopedic surgeon specializing in joint replacement and sports injuries.',
        rating: 4.7, isAvailable: true
      },
      {
        firstName: 'Emily', lastName: 'Davis', email: 'dr.emily.davis@hospital.com',
        phone: '+91-9876543223', specialization: 'Pediatrics', qualification: 'MD Pediatrics',
        experience: 12, department: 'Pediatrics',
        bio: 'Pediatrician with expertise in child development and pediatric emergency care.',
        rating: 4.9, isAvailable: true
      },
      {
        firstName: 'Robert', lastName: 'Wilson', email: 'dr.robert.wilson@hospital.com',
        phone: '+91-9876543224', specialization: 'Internal Medicine', qualification: 'MD Internal Medicine',
        experience: 20, department: 'Internal Medicine',
        bio: 'Internal medicine physician with focus on diabetes, hypertension, and preventive care.',
        rating: 4.6, isAvailable: true
      }
    ];

    const doctors = [];
    for (const doctorData of doctorsData) {
      const doctor = this.doctorRepository.create(doctorData);
      const savedDoctor = await this.doctorRepository.save(doctor);
      doctors.push(savedDoctor);

      // Link to user
      const user = userList.find(u => u.email === doctorData.email);
      if (user) {
        user.doctor = savedDoctor;
        await this.userRepository.save(user);
      }
    }

    console.log(`✅ Created ${doctors.length} doctors`);
    return doctors;
  }

  private async seedMedications() {
    console.log('💊 Seeding medications...');
    
    const medicationsData = [
      { name: 'Metformin', description: 'Type 2 diabetes medication', dosageForm: 'Tablet', strength: '500mg' },
      { name: 'Amlodipine', description: 'Blood pressure medication', dosageForm: 'Tablet', strength: '5mg' },
      { name: 'Lisinopril', description: 'ACE inhibitor for hypertension', dosageForm: 'Tablet', strength: '10mg' },
      { name: 'Atorvastatin', description: 'Cholesterol lowering medication', dosageForm: 'Tablet', strength: '20mg' },
      { name: 'Omeprazole', description: 'Proton pump inhibitor for acid reflux', dosageForm: 'Capsule', strength: '20mg' },
      { name: 'Levothyroxine', description: 'Thyroid hormone replacement', dosageForm: 'Tablet', strength: '50mcg' },
      { name: 'Ibuprofen', description: 'Pain reliever and anti-inflammatory', dosageForm: 'Tablet', strength: '400mg' },
      { name: 'Amoxicillin', description: 'Antibiotic for bacterial infections', dosageForm: 'Capsule', strength: '500mg' }
    ];

    const medications = [];
    for (const medicationData of medicationsData) {
      const medication = this.medicationRepository.create(medicationData);
      const savedMedication = await this.medicationRepository.save(medication);
      medications.push(savedMedication);
    }

    console.log(`✅ Created ${medications.length} medications`);
    return medications;
  }

  private async seedDoctorAvailability(doctors: Doctor[]) {
    console.log('📅 Seeding doctor availability...');
    
    const slots = [];
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30); // Next 30 days

    for (const doctor of doctors) {
      const currentDate = new Date(today);
      
      while (currentDate <= endDate) {
        // Skip Sundays
        if (currentDate.getDay() !== 0) {
          const dailySlots = this.generateDailySlots(doctor, new Date(currentDate));
          slots.push(...dailySlots);
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Save slots in batches
    const batchSize = 100;
    for (let i = 0; i < slots.length; i += batchSize) {
      const batch = slots.slice(i, i + batchSize);
      await this.availabilityRepository.save(batch);
    }

    console.log(`✅ Created ${slots.length} availability slots`);
    return slots;
  }

  private generateDailySlots(doctor: Doctor, date: Date) {
    const slots = [];
    const dayOfWeek = date.getDay();
    
    let startHour = 9;
    let endHour = 17;
    
    if (dayOfWeek === 6) { // Saturday
      endHour = 14;
    }
    
    if (dayOfWeek === 0) { // Sunday
      return slots;
    }

    const slotDuration = 30;
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const startTime = new Date(date);
        startTime.setHours(hour, minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setMinutes(endTime.getMinutes() + slotDuration);
        
        // Skip lunch break
        if (hour === 12 && minute >= 30 || hour === 13 && minute < 30) {
          continue;
        }
        
        if (startTime > new Date()) {
          const slot = new DoctorAvailability();
          slot.doctor = doctor;
          slot.startTime = startTime;
          slot.endTime = endTime;
          slot.isBooked = Math.random() > 0.7; // 30% chance of being booked
          
          slots.push(slot);
        }
      }
    }
    
    return slots;
  }

  private async seedAppointments(patients: Patient[], doctors: Doctor[]) {
    console.log('📋 Seeding appointments...');
    
    const appointments = [];
    const statuses = [AppointmentStatus.COMPLETED, AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED];
    const types = [AppointmentType.CONSULTATION, AppointmentType.FOLLOW_UP, AppointmentType.ROUTINE_CHECKUP];
    
    for (let i = 0; i < 20; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const appointmentDate = new Date();
      appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 30) - 15); // ±15 days
      
      const appointment = this.appointmentRepository.create({
        patient,
        doctor,
        appointmentDate,
        duration: 30,
        status: statuses[Math.floor(Math.random() * statuses.length)],
        type: types[Math.floor(Math.random() * types.length)],
        reason: ['Regular checkup', 'Follow-up visit', 'Chest pain', 'Routine examination', 'Blood pressure check'][Math.floor(Math.random() * 5)],
        symptoms: ['Fatigue', 'Headache', 'Chest discomfort', 'None', 'Joint pain'][Math.floor(Math.random() * 5)],
        diagnosis: appointmentDate < new Date() ? ['Type 2 Diabetes', 'Hypertension', 'Normal examination', 'Arthritis', 'Migraine'][Math.floor(Math.random() * 5)] : null,
        treatment: appointmentDate < new Date() ? ['Medication prescribed', 'Lifestyle changes', 'Continue current treatment', 'Physical therapy recommended'][Math.floor(Math.random() * 4)] : null
      });
      
      appointments.push(appointment);
    }

    await this.appointmentRepository.save(appointments);
    console.log(`✅ Created ${appointments.length} appointments`);
    return appointments;
  }

  private async seedPrescriptions(patients: Patient[], doctors: Doctor[], medications: Medication[]) {
    console.log('📝 Seeding prescriptions...');
    
    const prescriptions = [];
    
    for (let i = 0; i < 15; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const medication = medications[Math.floor(Math.random() * medications.length)];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - Math.floor(Math.random() * 30));
      
      const prescription = this.prescriptionRepository.create({
        patient,
        doctor,
        medication,
        dosage: ['1 tablet daily', '2 tablets twice daily', '1 tablet twice daily', '1 tablet before meals'][Math.floor(Math.random() * 4)],
        frequency: ['Once daily', 'Twice daily', 'Three times daily', 'As needed'][Math.floor(Math.random() * 4)],
        duration: ['7 days', '14 days', '30 days', '90 days'][Math.floor(Math.random() * 4)],
        instructions: 'Take with food. Complete the full course.',
        quantity: 30 + Math.floor(Math.random() * 60),
        refills: Math.floor(Math.random() * 3),
        startDate: startDate,
        endDate: Math.random() > 0.5 ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000) : undefined,
        status: Math.random() > 0.3 ? PrescriptionStatus.ACTIVE : PrescriptionStatus.COMPLETED
      });
      
      prescriptions.push(prescription);
    }

    await this.prescriptionRepository.save(prescriptions);
    console.log(`✅ Created ${prescriptions.length} prescriptions`);
    return prescriptions;
  }

  private async seedLabResults(patients: Patient[], doctors: Doctor[]) {
    console.log('🧪 Seeding lab results...');
    
    const labResults = [];
    const testNames = ['HbA1c', 'Blood Pressure', 'Cholesterol', 'Blood Sugar', 'Hemoglobin', 'Creatinine', 'Thyroid TSH'];
    const values = ['7.8', '150/95', '220', '140', '12.5', '1.1', '4.2'];
    const units = ['%', 'mmHg', 'mg/dL', 'mg/dL', 'g/dL', 'mg/dL', 'mIU/L'];
    const statuses = [LabResultStatus.NORMAL, LabResultStatus.HIGH, LabResultStatus.LOW, LabResultStatus.ABNORMAL];
    
    for (let i = 0; i < 25; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const testIndex = Math.floor(Math.random() * testNames.length);
      
      const testDate = new Date();
      testDate.setDate(testDate.getDate() - Math.floor(Math.random() * 90)); // Last 90 days
      
      const labResult = this.labResultRepository.create({
        patient,
        orderedBy: doctor,
        testName: testNames[testIndex],
        value: values[testIndex],
        unit: units[testIndex],
        referenceRange: '< 7.0 %',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        testDate,
        resultDate: new Date(testDate.getTime() + 24 * 60 * 60 * 1000), // Next day
        labFacility: 'Central Lab',
        interpretation: 'Results reviewed by physician'
      });
      
      labResults.push(labResult);
    }

    await this.labResultRepository.save(labResults);
    console.log(`✅ Created ${labResults.length} lab results`);
    return labResults;
  }

  private async seedVitalSigns(patients: Patient[], doctors: Doctor[]) {
    console.log('💓 Seeding vital signs...');
    
    const vitalSigns = [];
    
    for (let i = 0; i < 30; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      
      const recordedAt = new Date();
      recordedAt.setDate(recordedAt.getDate() - Math.floor(Math.random() * 30));
      
      const vital = this.vitalSignsRepository.create({
        patient,
        recordedBy: doctor,
        height: 160 + Math.floor(Math.random() * 30), // 160-190 cm
        weight: 50 + Math.floor(Math.random() * 50), // 50-100 kg
        systolicBP: 110 + Math.floor(Math.random() * 40), // 110-150
        diastolicBP: 70 + Math.floor(Math.random() * 20), // 70-90
        heartRate: 60 + Math.floor(Math.random() * 40), // 60-100 bpm
        temperature: 36.0 + Math.random() * 2, // 36-38°C
        oxygenSaturation: 95 + Math.floor(Math.random() * 5), // 95-100%
        recordedDate: recordedAt
      });
      
      vitalSigns.push(vital);
    }

    await this.vitalSignsRepository.save(vitalSigns);
    console.log(`✅ Created ${vitalSigns.length} vital signs records`);
    return vitalSigns;
  }

  private async seedMedicalDocuments(patients: Patient[], doctors: Doctor[]) {
    console.log('📄 Seeding medical documents...');
    
    const documents = [];
    const documentTypes = [DocumentType.LAB_RESULT, DocumentType.IMAGING, DocumentType.PRESCRIPTION, DocumentType.CONSULTATION_NOTE, DocumentType.DISCHARGE_SUMMARY];
    
    for (let i = 0; i < 10; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const doctor = doctors[Math.floor(Math.random() * doctors.length)];
      const docType = documentTypes[Math.floor(Math.random() * documentTypes.length)];
      
      const document = this.medicalDocumentRepository.create({
        patient,
        createdBy: doctor,
        name: `${docType.replace('_', ' ')} - ${patient.firstName} ${patient.lastName}`,
        type: docType,
        filePath: `/documents/patient_${patient.id}/doc_${i + 1}.pdf`,
        fileName: `doc_${i + 1}.pdf`,
        fileType: 'application/pdf',
        fileSize: 1024 + Math.floor(Math.random() * 5120), // 1-5KB
        description: 'Medical document for patient records',
        documentDate: new Date()
      });
      
      documents.push(document);
    }

    await this.medicalDocumentRepository.save(documents);
    console.log(`✅ Created ${documents.length} medical documents`);
    return documents;
  }

  private async seedChatLogs(patients: Patient[], doctors: Doctor[]) {
    console.log('💬 Seeding chat logs...');
    
    const chatLogs = [];
    const sampleMessages = [
      'Hello, I have been experiencing some chest discomfort.',
      'Can you please explain my lab results?',
      'When should I take my medication?',
      'I am feeling better after the treatment.',
      'Do I need to follow up next week?'
    ];
    
    const agentReplies = [
      'I understand your concern. Let me help you with that.',
      'Based on your lab results, I can provide some information.',
      'Let me check your medication schedule.',
      'That\'s great to hear! I\'ll make a note of your improvement.',
      'Let me help you schedule a follow-up appointment.'
    ];
    
    for (let i = 0; i < 20; i++) {
      const patient = patients[Math.floor(Math.random() * patients.length)];
      const sessionId = `session_${i}_${Date.now()}`;
      
      // Patient message
      const patientMessage = this.chatLogRepository.create({
        patient,
        sessionId,
        message: sampleMessages[Math.floor(Math.random() * sampleMessages.length)],
        messageType: MessageType.USER,
        timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      });
      
      // Agent reply
      const agentMessage = this.chatLogRepository.create({
        patient,
        sessionId,
        message: agentReplies[Math.floor(Math.random() * agentReplies.length)],
        messageType: MessageType.AGENT,
        agentType: [AgentType.FAQ, AgentType.APPOINTMENT, AgentType.MEDICATION][Math.floor(Math.random() * 3)],
        timestamp: new Date(patientMessage.timestamp.getTime() + Math.floor(Math.random() * 2 * 60 * 60 * 1000)) // 0-2 hours later
      });
      
      chatLogs.push(patientMessage, agentMessage);
    }

    await this.chatLogRepository.save(chatLogs);
    console.log(`✅ Created ${chatLogs.length} chat log entries`);
    return chatLogs;
  }
}