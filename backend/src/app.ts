import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppDataSource } from './config/db.config';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { logger } from './config/logger.config';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true,
// }));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    }
  }
}));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database connection
export const initializeApp = async () => {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Database connected successfully');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

export default app;