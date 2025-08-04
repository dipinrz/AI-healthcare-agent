import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn,
  JoinColumn
} from 'typeorm';
import { Patient } from './Patient';
import { Doctor } from './Doctor';

export enum LabResultStatus {
  NORMAL = 'normal',
  ABNORMAL = 'abnormal',
  CRITICAL = 'critical',
  LOW = 'low',
  HIGH = 'high',
  PENDING = 'pending'
}

@Entity('labresults')
export class LabResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, patient => patient.labResults)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor, doctor => doctor.labResults, { nullable: true })
  @JoinColumn({ name: 'orderedById' })
  orderedBy?: Doctor;

  @Column({ type: 'varchar', length: 255 })
  testName: string;

  @Column({ type: 'varchar', length: 100 })
  value: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  referenceRange?: string;

  @Column({ 
    type: 'enum', 
    enum: LabResultStatus,
    default: LabResultStatus.PENDING
  })
  status: LabResultStatus;

  @Column({ type: 'timestamp' })
  testDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  resultDate?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  labFacility?: string;

  @Column({ type: 'text', nullable: true })
  interpretation?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}