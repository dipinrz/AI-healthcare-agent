import { AppDataSource } from '../config/database';
import { Medication } from '../entities/Medication';

export const seedMedications = async () => {
  const medicationRepository = AppDataSource.getRepository(Medication);
  
  // Check if medications already exist
  const existingMedications = await medicationRepository.count();
  if (existingMedications > 0) {
    console.log('Medications already exist, skipping seeding');
    return;
  }

  const medications = [
    {
      name: 'Lisinopril',
      genericName: 'Lisinopril',
      brandName: 'Prinivil',
      category: 'ACE Inhibitor',
      description: 'Used to treat high blood pressure and heart failure',
      indications: ['Hypertension', 'Heart failure'],
      contraindications: ['Pregnancy', 'Angioedema'],
      sideEffects: ['Dizziness', 'Dry cough', 'Headache'],
      interactions: ['NSAIDs', 'Potassium supplements'],
      warnings: ['Monitor blood pressure'],
      dosageInfo: { adult: '5-10mg once daily', pediatric: 'Not recommended' },
      strength: '10mg',
      form: 'Tablet',
      manufacturer: 'Generic Pharma',
      isActive: true
    },
    {
      name: 'Amlodipine',
      genericName: 'Amlodipine besylate',
      brandName: 'Norvasc',
      category: 'Calcium Channel Blocker',
      description: 'Used to treat high blood pressure and chest pain',
      indications: ['Hypertension', 'Angina'],
      contraindications: ['Severe aortic stenosis'],
      sideEffects: ['Swelling of ankles', 'Dizziness', 'Flushing'],
      interactions: ['Simvastatin'],
      warnings: ['Monitor for peripheral edema'],
      dosageInfo: { adult: '2.5-5mg once daily', pediatric: 'Consult pediatrician' },
      strength: '5mg',
      form: 'Tablet',
      manufacturer: 'Generic Pharma',
      isActive: true
    },
    {
      name: 'Vitamin D3',
      genericName: 'Cholecalciferol',
      brandName: 'D-Vite',
      category: 'Vitamin Supplement',
      description: 'Used to treat vitamin D deficiency',
      indications: ['Vitamin D deficiency', 'Osteoporosis prevention'],
      contraindications: ['Hypercalcemia'],
      sideEffects: ['Nausea', 'Vomiting (if overdosed)'],
      interactions: ['Thiazide diuretics'],
      warnings: ['Monitor calcium levels'],
      dosageInfo: { adult: '1000-2000 IU daily', pediatric: '400-1000 IU daily', elderly: '800-2000 IU daily' },
      strength: '2000 IU',
      form: 'Capsule',
      manufacturer: 'Wellness Vitamins',
      isActive: true
    }
  ];

  try {
    for (const medicationData of medications) {
      const medication = medicationRepository.create(medicationData);
      await medicationRepository.save(medication);
    }
    console.log('✅ Sample medications seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding medications:', error);
  }
};