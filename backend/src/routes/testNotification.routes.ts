import { Router } from 'express';
import { TestNotificationController } from '../controllers/testNotification.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const testNotificationController = new TestNotificationController();

// All test notification routes require authentication
router.use(authenticateToken);

// Get available notification types for testing
router.get('/types', asyncHandler(testNotificationController.getNotificationTypes));

// Send a single test notification
router.post('/send', asyncHandler(testNotificationController.sendTestNotification));

// Send bulk test notifications (admin only)
router.post('/send-bulk', asyncHandler(testNotificationController.sendBulkTestNotifications));

// Test all notification settings for a patient
router.get('/test-settings', asyncHandler(testNotificationController.testNotificationSettings));

export default router;