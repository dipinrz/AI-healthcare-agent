import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Patient } from './Patient.model';
import { Doctor } from './Doctor.model';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}

export enum AppointmentType {
  CONSULTATION = 'consultation',
  FOLLOW_UP = 'follow_up',
  EMERGENCY = 'emergency',
  ROUTINE_CHECKUP = 'routine_checkup'
}

@Entity()
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  appointmentDate: Date;

  @Column()
  duration: number; // in minutes

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.SCHEDULED
  })
  status: AppointmentStatus;

  @Column({
    type: 'enum',
    enum: AppointmentType,
    default: AppointmentType.CONSULTATION
  })
  type: AppointmentType;

  @Column('text', { nullable: true })
  reason: string;

  @Column('text', { nullable: true })
  notes: string;

  @Column('text', { nullable: true })
  symptoms: string;

  @Column('text', { nullable: true })
  diagnosis: string;

  @Column('text', { nullable: true })
  treatment: string;

  @Column('text', { nullable: true })
  followUpInstructions: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Patient, patient => patient.appointments)
  patient: Patient;

  @ManyToOne(() => Doctor, doctor => doctor.appointments)
  doctor: Doctor;
}