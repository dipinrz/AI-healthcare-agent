import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Appointment } from './Appointment.model';
import { Prescription } from './Prescription.model';
import { ChatLog } from './ChatLog.model';
import { VitalSigns } from './VitalSigns.model';
import { LabResult } from './LabResult.model';
import { MedicalDocument } from './MedicalDocument.model';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  password: string;

  @Column({ type: 'date' })
  dateOfBirth: Date;

  @Column()
  gender: string;

  @Column('text', { nullable: true })
  address: string;

  @Column('text', { array: true, default: '{}' })
  allergies: string[];

  @Column('text', { nullable: true })
  emergencyContact: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Appointment, appointment => appointment.patient)
  appointments: Appointment[];

  @OneToMany(() => Prescription, prescription => prescription.patient)
  prescriptions: Prescription[];

  @OneToMany(() => ChatLog, chatLog => chatLog.patient)
  chatLogs: ChatLog[];

  @OneToMany(() => VitalSigns, vitalSigns => vitalSigns.patient)
  vitalSigns: VitalSigns[];

  @OneToMany(() => LabResult, labResult => labResult.patient)
  labResults: LabResult[];

  @OneToMany(() => MedicalDocument, document => document.patient)
  medicalDocuments: MedicalDocument[];
}