import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Patient } from '../entities/Patient';
import { User } from '../entities/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const patientRepository = AppDataSource.getRepository(Patient);
const userRepository = AppDataSource.getRepository(User);

// All routes are protected
router.use(authenticateToken);

// Get all patients (admin and doctors only)
router.get('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'admin' && user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const { search, gender, ageMin, ageMax } = req.query;
    
    let queryBuilder = patientRepository.createQueryBuilder('patient');
    
    if (search) {
      queryBuilder = queryBuilder.where(
        '(patient.firstName ILIKE :search OR patient.lastName ILIKE :search OR patient.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    if (gender) {
      queryBuilder = queryBuilder.andWhere('patient.gender = :gender', { gender });
    }
    
    // Age filtering would require date calculations in PostgreSQL
    if (ageMin || ageMax) {
      const currentDate = new Date();
      if (ageMax) {
        const minBirthDate = new Date(currentDate.getFullYear() - parseInt(ageMax as string), 0, 1);
        queryBuilder = queryBuilder.andWhere('patient.dateOfBirth >= :minBirthDate', { minBirthDate });
      }
      if (ageMin) {
        const maxBirthDate = new Date(currentDate.getFullYear() - parseInt(ageMin as string), 11, 31);
        queryBuilder = queryBuilder.andWhere('patient.dateOfBirth <= :maxBirthDate', { maxBirthDate });
      }
    }
    
    const patients = await queryBuilder
      .where('patient.isActive = :isActive', { isActive: true })
      .orderBy('patient.firstName', 'ASC')
      .getMany();

    const formattedPatients = patients.map(patient => ({
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      email: patient.email,
      phone: patient.phone,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      address: patient.address,
      allergies: patient.allergies,
      emergencyContact: patient.emergencyContact,
      createdAt: patient.createdAt
    }));

    res.json({
      success: true,
      data: formattedPatients
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patients'
    });
  }
});

// Get patient by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    
    const patient = await patientRepository.findOne({
      where: { id },
      relations: ['appointments', 'prescriptions', 'chatLogs']
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check permissions - patient can view own profile, doctors and admins can view any
    if (user.role === 'patient') {
      const currentPatient = await patientRepository.findOne({
        where: { email: user.email }
      });
      if (!currentPatient || currentPatient.id !== patient.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (user.role !== 'admin' && user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        address: patient.address,
        allergies: patient.allergies,
        emergencyContact: patient.emergencyContact,
        isActive: patient.isActive,
        createdAt: patient.createdAt,
        appointmentsCount: patient.appointments?.length || 0,
        prescriptionsCount: patient.prescriptions?.length || 0,
        chatLogsCount: patient.chatLogs?.length || 0
      }
    });
  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient'
    });
  }
});

// Create new patient (admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create patient profiles'
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      address,
      allergies,
      emergencyContact
    } = req.body;

    if (!firstName || !lastName || !email || !phone || !password || !dateOfBirth || !gender) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, email, phone, password, date of birth, and gender are required'
      });
    }

    // Check if patient with email already exists
    const existingPatient = await patientRepository.findOne({
      where: { email }
    });

    if (existingPatient) {
      return res.status(409).json({
        success: false,
        message: 'Patient with this email already exists'
      });
    }

    const patient = patientRepository.create({
      firstName,
      lastName,
      email,
      phone,
      password, // Note: In production, this should be hashed
      dateOfBirth: new Date(dateOfBirth),
      gender,
      address: address || '',
      allergies: allergies || [],
      emergencyContact: emergencyContact || '',
      isActive: true
    });

    await patientRepository.save(patient);

    // Remove password from response
    const { password: _, ...patientResponse } = patient;

    res.status(201).json({
      success: true,
      message: 'Patient profile created successfully',
      data: patientResponse
    });
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create patient profile'
    });
  }
});

// Update patient profile
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const patient = await patientRepository.findOne({
      where: { id }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check permissions - patient can update own profile, admin can update any
    if (user.role === 'patient') {
      const currentPatient = await patientRepository.findOne({
        where: { email: user.email }
      });
      if (!currentPatient || currentPatient.id !== patient.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const {
      firstName,
      lastName,
      phone,
      dateOfBirth,
      gender,
      address,
      allergies,
      emergencyContact,
      isActive
    } = req.body;

    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (phone) patient.phone = phone;
    if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
    if (gender) patient.gender = gender;
    if (address !== undefined) patient.address = address;
    if (allergies !== undefined) patient.allergies = allergies;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;
    if (isActive !== undefined && user.role === 'admin') patient.isActive = isActive;

    await patientRepository.save(patient);

    // Remove password from response
    const { password: _, ...patientResponse } = patient;

    res.json({
      success: true,
      message: 'Patient profile updated successfully',
      data: patientResponse
    });
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update patient profile'
    });
  }
});

// Delete patient (admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete patient profiles'
      });
    }

    const patient = await patientRepository.findOne({
      where: { id }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Soft delete by setting isActive to false
    patient.isActive = false;
    await patientRepository.save(patient);

    res.json({
      success: true,
      message: 'Patient profile deactivated successfully'
    });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete patient profile'
    });
  }
});

// Get patient's appointments
router.get('/:id/appointments', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const patient = await patientRepository.findOne({
      where: { id },
      relations: ['appointments', 'appointments.doctor']
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check permissions
    if (user.role === 'patient') {
      const currentPatient = await patientRepository.findOne({
        where: { email: user.email }
      });
      if (!currentPatient || currentPatient.id !== patient.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (user.role !== 'admin' && user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: patient.appointments || []
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient appointments'
    });
  }
});

// Get patient's prescriptions
router.get('/:id/prescriptions', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const patient = await patientRepository.findOne({
      where: { id },
      relations: ['prescriptions', 'prescriptions.doctor', 'prescriptions.medication']
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check permissions
    if (user.role === 'patient') {
      const currentPatient = await patientRepository.findOne({
        where: { email: user.email }
      });
      if (!currentPatient || currentPatient.id !== patient.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (user.role !== 'admin' && user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: patient.prescriptions || []
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient prescriptions'
    });
  }
});

// Get patient summary with comprehensive medical data
router.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const patient = await patientRepository.findOne({
      where: { id },
      relations: [
        'appointments',
        'appointments.doctor',
        'prescriptions',
        'prescriptions.medication',
        'prescriptions.doctor',
        'labResults',
        'vitalSigns'
      ]
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Check permissions - patient can view own summary, doctors and admins can view any
    if (user.role === 'patient') {
      const currentPatient = await patientRepository.findOne({
        where: { email: user.email }
      });
      if (!currentPatient || currentPatient.id !== patient.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    } else if (user.role !== 'admin' && user.role !== 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Calculate age
    const today = new Date();
    const birthDate = new Date(patient.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // Get latest completed appointment for last visit
    const lastCompletedAppointment = patient.appointments
      ?.filter(apt => apt.status === 'completed')
      ?.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())[0];

    // Get current diagnoses from completed appointments
    const diagnoses = patient.appointments
      ?.filter(apt => apt.diagnosis && apt.status === 'completed')
      ?.map(apt => apt.diagnosis)
      ?.filter((diagnosis, index, self) => self.indexOf(diagnosis) === index) // Remove duplicates
      ?.join(', ') || 'No diagnosis recorded';

    // Get current medications from active prescriptions
    const activeMedications = patient.prescriptions
      ?.filter(prescription => prescription.status === 'active')
      ?.map(prescription => prescription.medication?.name || 'Unknown medication')
      ?.filter((med, index, self) => self.indexOf(med) === index) // Remove duplicates
      ?.join(', ') || 'No medications prescribed';

    // Get treatment plans from recent completed appointments
    const recentTreatments = patient.appointments
      ?.filter(apt => apt.treatment && apt.status === 'completed')
      ?.sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime())
      ?.slice(0, 3)
      ?.map(apt => apt.treatment)
      ?.join(', ') || 'No treatment plan recorded';

    // Get latest lab results
    const latestLabResults = patient.labResults
      ?.sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
      ?.slice(0, 3)
      ?.map(lab => `${lab.testName}: ${lab.value}${lab.unit ? ' ' + lab.unit : ''}`)
      ?.join(', ') || 'No lab results available';

    // Get allergies
    const allergiesText = patient.allergies && patient.allergies.length > 0 
      ? patient.allergies.join(', ') 
      : 'No known allergies';

    const summary = {
      patient_id: patient.id,
      name: `${patient.firstName} ${patient.lastName}`,
      age: age,
      gender: patient.gender,
      contact_no: patient.phone,
      diagnosis: diagnoses,
      medications: activeMedications,
      treatment_plan: recentTreatments,
      lab_results: latestLabResults,
      allergies: allergiesText,
      last_visit: lastCompletedAppointment 
        ? new Date(lastCompletedAppointment.appointmentDate).toISOString().split('T')[0]
        : 'No completed visits'
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Get patient summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch patient summary'
    });
  }
});

export default router;