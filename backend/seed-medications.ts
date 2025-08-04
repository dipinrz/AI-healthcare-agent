import 'reflect-metadata';
import { AppDataSource } from './src/config/database';
import { seedMedications } from './src/seeders/medicationSeeder';

async function runSeeder() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    
    console.log('Running medication seeder...');
    await seedMedications();
    console.log('✅ Medication seeder completed');
    
    await AppDataSource.destroy();
    console.log('✅ Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running seeder:', error);
    process.exit(1);
  }
}

runSeeder();