import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { AppDataSource } from './config/database';
import { seedMedications } from './seeders/medicationSeeder';
import { seedPrescriptions } from './seeders/prescriptionSeeder';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: '*',
  credentials: false
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AI Healthcare Backend'
  });
});

// API Routes
import authRoutes from './routes/auth';
import patientsRoutes from './routes/patients';
import doctorsRoutes from './routes/doctors';
import appointmentsRoutes from './routes/appointments';
import medicationsRoutes from './routes/medications';
import chatRoutes from './routes/chat';
import healthRecordsRoutes from './routes/healthRecords';

app.use('/api/auth', authRoutes);
app.use('/api/patients', patientsRoutes);
app.use('/api/doctors', doctorsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/medications', medicationsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/health-records', healthRecordsRoutes);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database first, then start server
AppDataSource.initialize()
  .then(async () => {
    console.log('✅ Database connected successfully');
    
    // Seed sample data
    await seedMedications();
    await seedPrescriptions();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🏥 AI Healthcare Backend is ready!`);
      console.log(`📍 Health check: http://localhost:${PORT}/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    });
  })
  .catch((error) => {
    console.error('❌ Database connection failed:', error);
    console.log('Please ensure PostgreSQL is running and database "ai-agent" exists');
    process.exit(1);
  });