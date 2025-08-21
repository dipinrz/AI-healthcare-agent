import app, { initializeApp } from './app';
import { logger } from './config/logger.config';
import { config } from './config';
import { AutomaticReminderSchedulerService } from './services/automaticReminderScheduler.service';

const PORT = config.PORT || 3001;

const startServer = async () => {
  try {
    // Initialize database and app
    await initializeApp();

    // Initialize and start the automatic reminder scheduler
    const reminderScheduler = new AutomaticReminderSchedulerService();
    reminderScheduler.start();

    // Start server
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📱 Frontend URL: ${config.FRONTEND_URL}`);
      logger.info(`🌍 Environment: ${config.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('👋 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

startServer();