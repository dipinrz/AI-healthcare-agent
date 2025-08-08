"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const masterSeedService_1 = require("../services/masterSeedService");
const availabilitySeedService_1 = require("../services/availabilitySeedService");
const router = (0, express_1.Router)();
// Seed all database tables with comprehensive test data
router.post('/all', async (req, res) => {
    try {
        console.log('🌱 Starting comprehensive database seeding...');
        const seedService = new masterSeedService_1.MasterSeedService();
        const result = await seedService.seedAllData();
        res.json({
            success: true,
            message: 'All database tables seeded successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Comprehensive seeding error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to seed database'
        });
    }
});
// Seed only doctor availability (lightweight)
router.post('/availability', async (req, res) => {
    try {
        const seedService = new availabilitySeedService_1.AvailabilitySeedService();
        const result = await seedService.seedDemoData();
        res.json({
            success: true,
            message: 'Doctor availability seeded successfully',
            data: result
        });
    }
    catch (error) {
        console.error('Availability seeding error:', error);
        res.status(500).json({
            success: false,
            message: error instanceof Error ? error.message : 'Failed to seed availability data'
        });
    }
});
// Clear all data (use with caution)
router.post('/clear', async (req, res) => {
    try {
        console.log('🧹 Clearing all database data...');
        // This would require implementing a clear method in MasterSeedService
        res.json({
            success: true,
            message: 'Database cleared successfully (not implemented yet)'
        });
    }
    catch (error) {
        console.error('Clear data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to clear database'
        });
    }
});
// Get seeding status/info
router.get('/status', async (req, res) => {
    try {
        // This could return counts of each table
        res.json({
            success: true,
            message: 'Seeding status endpoint - not implemented yet',
            data: {
                info: 'Use POST /api/seed/all to populate all tables with test data'
            }
        });
    }
    catch (error) {
        console.error('Seeding status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get seeding status'
        });
    }
});
exports.default = router;
