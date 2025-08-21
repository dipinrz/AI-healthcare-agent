"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notificationSetting_controller_1 = require("../controllers/notificationSetting.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const notificationSettingController = new notificationSetting_controller_1.NotificationSettingController();
// All notification setting routes require authentication
router.use(auth_middleware_1.authenticateToken);
// Get notification settings
router.get('/', (0, error_middleware_1.asyncHandler)(notificationSettingController.getNotificationSettings));
// Update notification settings (full update)
router.put('/', (0, error_middleware_1.asyncHandler)(notificationSettingController.updateNotificationSettings));
// Enable notifications (quick toggle)
router.post('/enable', (0, error_middleware_1.asyncHandler)(notificationSettingController.enableNotifications));
// Disable notifications (quick toggle)
router.post('/disable', (0, error_middleware_1.asyncHandler)(notificationSettingController.disableNotifications));
// Check notification status
router.get('/status', (0, error_middleware_1.asyncHandler)(notificationSettingController.checkNotificationStatus));
exports.default = router;
