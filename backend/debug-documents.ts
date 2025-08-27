import { config } from 'dotenv';
config();

import { DataSource } from 'typeorm';
import { Patient } from './src/models/Patient.model';
import { MedicalDocument } from './src/models/MedicalDocument.model';
import { Doctor } from './src/models/Doctor.model';
import { User } from './src/models/User.model';

const databaseUrl = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const AppDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  ssl: databaseUrl.includes('neon.tech'),
  entities: [Patient, MedicalDocument, Doctor, User],
  synchronize: false,
});

async function debugDocuments() {
  try {
    await AppDataSource.initialize();
    console.log('Database connected');

    // Get all patients
    const patientRepository = AppDataSource.getRepository(Patient);
    const patients = await patientRepository.find();
    console.log('Patients found:', patients.length);
    patients.forEach(p => console.log(`Patient: ${p.id} - ${p.firstName} ${p.lastName} - ${p.email}`));

    // Get all medical documents
    const documentRepository = AppDataSource.getRepository(MedicalDocument);
    const documents = await documentRepository.find({
      relations: ['patient']
    });
    console.log('\nDocuments found:', documents.length);
    documents.forEach(d => console.log(`Document: ${d.id} - ${d.name} - Patient: ${d.patient?.id} (${d.patient?.firstName} ${d.patient?.lastName})`));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

debugDocuments();