import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Doctor } from '../entities/Doctor';
import { User } from '../entities/User';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const doctorRepository = AppDataSource.getRepository(Doctor);
const userRepository = AppDataSource.getRepository(User);

// Get all doctors (public endpoint for appointment booking)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, specialization, department, available } = req.query;
    
    let queryBuilder = doctorRepository.createQueryBuilder('doctor');
    
    if (search) {
      queryBuilder = queryBuilder.where(
        '(doctor.firstName ILIKE :search OR doctor.lastName ILIKE :search)',
        { search: `%${search}%` }
      );
    }
    
    if (specialization) {
      queryBuilder = queryBuilder.andWhere('doctor.specialization ILIKE :specialization', {
        specialization: `%${specialization}%`
      });
    }
    
    if (department) {
      queryBuilder = queryBuilder.andWhere('doctor.department ILIKE :department', {
        department: `%${department}%`
      });
    }
    
    if (available === 'true') {
      queryBuilder = queryBuilder.andWhere('doctor.isAvailable = :available', {
        available: true
      });
    }
    
    const doctors = await queryBuilder
      .orderBy('doctor.rating', 'DESC')
      .addOrderBy('doctor.firstName', 'ASC')
      .getMany();

    const formattedDoctors = doctors.map(doctor => ({
      id: doctor.id,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      department: doctor.department,
      phone: doctor.phone,
      email: doctor.email,
      bio: doctor.bio,
      rating: doctor.rating,
      isAvailable: doctor.isAvailable,
      availability: doctor.availability
    }));

    res.json({
      success: true,
      data: formattedDoctors
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctors'
    });
  }
});

// Search doctors by name
router.get('/search/by-name', async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name parameter is required'
      });
    }

    // Fuzzy search using ILIKE for case-insensitive partial matching
    const doctors = await doctorRepository
      .createQueryBuilder('doctor')
      .where(
        '(doctor.firstName ILIKE :name OR doctor.lastName ILIKE :name OR CONCAT(doctor.firstName, \' \', doctor.lastName) ILIKE :name)',
        { name: `%${name}%` }
      )
      .orderBy('doctor.rating', 'DESC')
      .addOrderBy('doctor.firstName', 'ASC')
      .getMany();

    const formattedResults = doctors.map(doctor => ({
      doctor_id: doctor.id,
      doctor_name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      department: doctor.department
    }));

    res.json({
      success: true,
      data: formattedResults
    });
  } catch (error) {
    console.error('Search doctors by name error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search doctors'
    });
  }
});

// Get doctor by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const doctor = await doctorRepository.findOne({
      where: { id },
      relations: ['appointments', 'prescriptions']
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: doctor.id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        department: doctor.department,
        phone: doctor.phone,
        email: doctor.email,
        bio: doctor.bio,
        rating: doctor.rating,
        isAvailable: doctor.isAvailable,
        availability: doctor.availability,
        appointmentsCount: doctor.appointments?.length || 0,
        prescriptionsCount: doctor.prescriptions?.length || 0
      }
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor'
    });
  }
});

// Protected routes
router.use(authenticateToken);

// Create new doctor (admin only)
router.post('/', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can create doctor profiles'
      });
    }

    const {
      firstName,
      lastName,
      specialization,
      qualification,
      experience,
      department,
      phone,
      email,
      bio,
      availability
    } = req.body;

    if (!firstName || !lastName || !specialization || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'First name, last name, specialization, email, and phone are required'
      });
    }

    // Check if doctor with email already exists
    const existingDoctor = await doctorRepository.findOne({
      where: { email }
    });

    if (existingDoctor) {
      return res.status(409).json({
        success: false,
        message: 'Doctor with this email already exists'
      });
    }

    const doctor = doctorRepository.create({
      firstName,
      lastName,
      specialization,
      qualification: qualification || '',
      experience: experience || 0,
      department: department || specialization,
      phone,
      email,
      bio: bio || '',
      availability: availability || null,
      rating: 0,
      isAvailable: true
    });

    await doctorRepository.save(doctor);

    res.status(201).json({
      success: true,
      message: 'Doctor profile created successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create doctor profile'
    });
  }
});

// Update doctor profile
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const doctor = await doctorRepository.findOne({
      where: { id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check permissions - doctor can update own profile, admin can update any
    if (user.role === 'doctor') {
      const currentDoctor = await doctorRepository.findOne({
        where: { email: user.email }
      });
      if (!currentDoctor || currentDoctor.id !== doctor.id) {
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
      specialization,
      qualification,
      experience,
      department,
      phone,
      bio,
      availability,
      isAvailable
    } = req.body;

    if (firstName) doctor.firstName = firstName;
    if (lastName) doctor.lastName = lastName;
    if (specialization) doctor.specialization = specialization;
    if (qualification !== undefined) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = experience;
    if (department) doctor.department = department;
    if (phone) doctor.phone = phone;
    if (bio !== undefined) doctor.bio = bio;
    if (availability !== undefined) doctor.availability = availability;
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;

    await doctorRepository.save(doctor);

    res.json({
      success: true,
      message: 'Doctor profile updated successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update doctor profile'
    });
  }
});

// Delete doctor (admin only)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete doctor profiles'
      });
    }

    const doctor = await doctorRepository.findOne({
      where: { id }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    await doctorRepository.remove(doctor);

    res.json({
      success: true,
      message: 'Doctor profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete doctor profile'
    });
  }
});

// Get doctor's appointments
router.get('/:id/appointments', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const doctor = await doctorRepository.findOne({
      where: { id },
      relations: ['appointments', 'appointments.patient']
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check permissions
    if (user.role === 'doctor') {
      const currentDoctor = await doctorRepository.findOne({
        where: { email: user.email }
      });
      if (!currentDoctor || currentDoctor.id !== doctor.id) {
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

    res.json({
      success: true,
      data: doctor.appointments || []
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor appointments'
    });
  }
});

export default router;