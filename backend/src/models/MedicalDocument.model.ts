import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { Patient } from './Patient.model';
import { Doctor } from './Doctor.model';

export enum DocumentType {
  LAB_RESULT = 'lab_result',
  IMAGING = 'imaging',
  PHYSICAL_EXAM = 'physical_exam',
  PRESCRIPTION = 'prescription',
  CONSULTATION_NOTE = 'consultation_note',
  DISCHARGE_SUMMARY = 'discharge_summary',
  REFERRAL = 'referral',
  OTHER = 'other'
}

@Entity('medicaldocuments')
export class MedicalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, patient => patient.medicalDocuments)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor, doctor => doctor.medicalDocuments, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy?: Doctor;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ 
    type: 'enum', 
    enum: DocumentType,
    default: DocumentType.OTHER
  })
  type: DocumentType;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description?: string;

  @Column({ type: 'timestamp' })
  documentDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  filePath?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  fileName?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fileType?: string;

  @Column({ type: 'integer', nullable: true })
  fileSize?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}