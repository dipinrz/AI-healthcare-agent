"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importStar(require("./app"));
const logger_config_1 = require("./config/logger.config");
const config_1 = require("./config");
const automaticReminderScheduler_service_1 = require("./services/automaticReminderScheduler.service");
const PORT = config_1.config.PORT || 3001;
const startServer = async () => {
    try {
        // Initialize database and app
        await (0, app_1.initializeApp)();
        // Initialize and start the automatic reminder scheduler
        const reminderScheduler = new automaticReminderScheduler_service_1.AutomaticReminderSchedulerService();
        reminderScheduler.start();
        // Start server
        app_1.default.listen(PORT, () => {
            logger_config_1.logger.info(`🚀 Server running on port ${PORT}`);
            logger_config_1.logger.info(`📱 Frontend URL: ${config_1.config.FRONTEND_URL}`);
            logger_config_1.logger.info(`🌍 Environment: ${config_1.config.NODE_ENV}`);
        });
    }
    catch (error) {
        logger_config_1.logger.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGTERM', () => {
    logger_config_1.logger.info('👋 SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    logger_config_1.logger.info('👋 SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger_config_1.logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger_config_1.logger.error('🚨 Uncaught Exception:', error);
    process.exit(1);
});
startServer();
