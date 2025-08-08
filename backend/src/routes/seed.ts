import { Router, Request, Response } from 'express';
import { MasterSeedService } from '../services/masterSeedService';
import { AvailabilitySeedService } from '../services/availabilitySeedService';

const router = Router();

// Seed all database tables with comprehensive test data
router.post('/all', async (req: Request, res: Response) => {
  try {
    console.log('🌱 Starting comprehensive database seeding...');
    
    const seedService = new MasterSeedService();
    const result = await seedService.seedAllData();
    
    res.json({
      success: true,
      message: 'All database tables seeded successfully',
      data: result
    });
  } catch (error) {
    console.error('Comprehensive seeding error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to seed database'
    });
  }
});

// Seed only doctor availability (lightweight)
router.post('/availability', async (req: Request, res: Response) => {
  try {
    const seedService = new AvailabilitySeedService();
    const result = await seedService.seedDemoData();
    
    res.json({
      success: true,
      message: 'Doctor availability seeded successfully',
      data: result
    });
  } catch (error) {
    console.error('Availability seeding error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to seed availability data'
    });
  }
});

// Clear all data (use with caution)
router.post('/clear', async (req: Request, res: Response) => {
  try {
    console.log('🧹 Clearing all database data...');
    
    // This would require implementing a clear method in MasterSeedService
    res.json({
      success: true,
      message: 'Database cleared successfully (not implemented yet)'
    });
  } catch (error) {
    console.error('Clear data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear database'
    });
  }
});

// Get seeding status/info
router.get('/status', async (req: Request, res: Response) => {
  try {
    // This could return counts of each table
    res.json({
      success: true,
      message: 'Seeding status endpoint - not implemented yet',
      data: {
        info: 'Use POST /api/seed/all to populate all tables with test data'
      }
    });
  } catch (error) {
    console.error('Seeding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get seeding status'
    });
  }
});

export default router;