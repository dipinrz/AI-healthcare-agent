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

@Entity('vitalsigns')
export class VitalSigns {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Patient, patient => patient.vitalSigns)
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @ManyToOne(() => Doctor, doctor => doctor.vitalSigns, { nullable: true })
  @JoinColumn({ name: 'recordedById' })
  recordedBy?: Doctor;

  @Column({ type: 'timestamp' })
  recordedDate: Date;

  @Column({ type: 'integer', nullable: true })
  systolicBP?: number;

  @Column({ type: 'integer', nullable: true })
  diastolicBP?: number;

  @Column({ type: 'integer', nullable: true })
  heartRate?: number;

  @Column({ type: 'decimal', precision: 4, scale: 1, nullable: true })
  temperature?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  height?: number;

  @Column({ type: 'integer', nullable: true })
  oxygenSaturation?: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}