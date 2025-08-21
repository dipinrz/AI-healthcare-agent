import { Router } from 'express';
import { NotificationSettingController } from '../controllers/notificationSetting.controller';
import { authenticateToken } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';

const router = Router();
const notificationSettingController = new NotificationSettingController();

// All notification setting routes require authentication
router.use(authenticateToken);

// Get notification settings
router.get('/', asyncHandler(notificationSettingController.getNotificationSettings));

// Update notification settings (full update)
router.put('/', asyncHandler(notificationSettingController.updateNotificationSettings));

// Enable notifications (quick toggle)
router.post('/enable', asyncHandler(notificationSettingController.enableNotifications));

// Disable notifications (quick toggle)
router.post('/disable', asyncHandler(notificationSettingController.disableNotifications));

// Check notification status
router.get('/status', asyncHandler(notificationSettingController.checkNotificationStatus));

export default router;