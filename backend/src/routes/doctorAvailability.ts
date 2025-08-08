import { Router, Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DoctorAvailability } from '../entities/DoctorAvailability';
import { Doctor } from '../entities/Doctor';
import { authenticateToken } from '../middleware/auth';
import { AvailabilitySeedService } from '../services/availabilitySeedService';

const router = Router();
const availabilityRepository = AppDataSource.getRepository(DoctorAvailability);
const doctorRepository = AppDataSource.getRepository(Doctor);

// Get available slots for a doctor
router.get('/doctor/:doctorId/slots', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const { date, month } = req.query;

    const doctor = await doctorRepository.findOne({
      where: { id: doctorId }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    let startDate: Date;
    let endDate: Date;

    if (month) {
      // If month is provided, get all slots for the month
      const [year, monthNum] = (month as string).split('-');
      startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59, 999);
    } else if (date) {
      // If specific date is provided, get slots for that day
      startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to next 30 days
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      endDate.setHours(23, 59, 59, 999);
    }

    const slots = await availabilityRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .where('slot.doctor.id = :doctorId', { doctorId })
      .andWhere('slot.startTime >= :startDate', { startDate })
      .andWhere('slot.startTime <= :endDate', { endDate })
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    const formattedSlots = slots.map(slot => ({
      slot_id: slot.slotId,
      doctor_id: slot.doctor.id,
      start_time: slot.startTime.toISOString().replace('T', ' ').substring(0, 16),
      end_time: slot.endTime.toISOString().replace('T', ' ').substring(0, 16),
      is_booked: slot.isBooked
    }));

    res.json({
      success: true,
      data: formattedSlots
    });
  } catch (error) {
    console.error('Get doctor availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch doctor availability'
    });
  }
});

// Get all available doctors for a specific time slot
router.get('/available-doctors', async (req: Request, res: Response) => {
  try {
    const { startTime, endTime } = req.query;

    if (!startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'startTime and endTime are required'
      });
    }

    const availableSlots = await availabilityRepository
      .createQueryBuilder('slot')
      .leftJoinAndSelect('slot.doctor', 'doctor')
      .where('slot.startTime = :startTime', { startTime })
      .andWhere('slot.endTime = :endTime', { endTime })
      .andWhere('slot.isBooked = false')
      .getMany();

    const availableDoctors = availableSlots.map(slot => ({
      slot_id: slot.slotId,
      doctor: {
        id: slot.doctor.id,
        firstName: slot.doctor.firstName,
        lastName: slot.doctor.lastName,
        specialization: slot.doctor.specialization,
        qualification: slot.doctor.qualification,
        department: slot.doctor.department,
        rating: slot.doctor.rating
      },
      start_time: slot.startTime.toISOString().replace('T', ' ').substring(0, 16),
      end_time: slot.endTime.toISOString().replace('T', ' ').substring(0, 16)
    }));

    res.json({
      success: true,
      data: availableDoctors
    });
  } catch (error) {
    console.error('Get available doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available doctors'
    });
  }
});

// Book a specific slot (mark as booked)
router.put('/slot/:slotId/book', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;

    const slot = await availabilityRepository.findOne({
      where: { slotId: parseInt(slotId) },
      relations: ['doctor']
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    if (slot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    // Check if the slot time is in the future
    if (slot.startTime <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book slots in the past'
      });
    }

    slot.isBooked = true;
    await availabilityRepository.save(slot);

    res.json({
      success: true,
      message: 'Time slot booked successfully',
      data: {
        slot_id: slot.slotId,
        doctor_id: slot.doctor.id,
        start_time: slot.startTime.toISOString().replace('T', ' ').substring(0, 16),
        end_time: slot.endTime.toISOString().replace('T', ' ').substring(0, 16),
        is_booked: slot.isBooked
      }
    });
  } catch (error) {
    console.error('Book slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to book time slot'
    });
  }
});

// Release a booked slot (mark as available)
router.put('/slot/:slotId/release', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slotId } = req.params;

    const slot = await availabilityRepository.findOne({
      where: { slotId: parseInt(slotId) },
      relations: ['doctor']
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        message: 'Time slot not found'
      });
    }

    if (!slot.isBooked) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is not booked'
      });
    }

    slot.isBooked = false;
    await availabilityRepository.save(slot);

    res.json({
      success: true,
      message: 'Time slot released successfully',
      data: {
        slot_id: slot.slotId,
        doctor_id: slot.doctor.id,
        start_time: slot.startTime.toISOString().replace('T', ' ').substring(0, 16),
        end_time: slot.endTime.toISOString().replace('T', ' ').substring(0, 16),
        is_booked: slot.isBooked
      }
    });
  } catch (error) {
    console.error('Release slot error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release time slot'
    });
  }
});

// Generate seed data for doctor availability (Admin only)
router.post('/seed-data', async (req: Request, res: Response) => {
  try {
    const seedService = new AvailabilitySeedService();
    const result = await seedService.seedDemoData();
    
    res.json({
      success: true,
      message: 'Demo data generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Seed data generation error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate seed data'
    });
  }
});

// Generate slots for specific doctor
router.post('/doctor/:doctorId/generate-slots', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params;
    const seedService = new AvailabilitySeedService();
    const result = await seedService.generateMonthlySlots(doctorId);
    
    res.json({
      success: true,
      message: 'Availability slots generated successfully',
      data: result
    });
  } catch (error) {
    console.error('Generate slots error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to generate availability slots'
    });
  }
});

export default router;