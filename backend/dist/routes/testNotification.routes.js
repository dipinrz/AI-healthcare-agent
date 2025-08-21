"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const testNotification_controller_1 = require("../controllers/testNotification.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const router = (0, express_1.Router)();
const testNotificationController = new testNotification_controller_1.TestNotificationController();
// All test notification routes require authentication
router.use(auth_middleware_1.authenticateToken);
// Get available notification types for testing
router.get('/types', (0, error_middleware_1.asyncHandler)(testNotificationController.getNotificationTypes));
// Send a single test notification
router.post('/send', (0, error_middleware_1.asyncHandler)(testNotificationController.sendTestNotification));
// Send bulk test notifications (admin only)
router.post('/send-bulk', (0, error_middleware_1.asyncHandler)(testNotificationController.sendBulkTestNotifications));
// Test all notification settings for a patient
router.get('/test-settings', (0, error_middleware_1.asyncHandler)(testNotificationController.testNotificationSettings));
exports.default = router;
