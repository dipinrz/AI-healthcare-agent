import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Appointment } from './Appointment';
import { Prescription } from './Prescription';
import { VitalSigns } from './VitalSigns';
import { LabResult } from './LabResult';
import { MedicalDocument } from './MedicalDocument';
import { DoctorAvailability } from './DoctorAvailability';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  specialization: string;

  @Column()
  qualification: string;

  @Column()
  experience: number;

  @Column({ unique: true })
  email: string;

  @Column()
  phone: string;

  @Column()
  department: string;

  @Column('text', { nullable: true })
  bio: string;

  @Column('decimal', { precision: 2, scale: 1, default: 0 })
  rating: number;

  @Column({ default: true })
  isAvailable: boolean;

  @Column('json', { nullable: true })
  availability: {
    [key: string]: {
      start: string;
      end: string;
      slots: string[];
    }
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Appointment, appointment => appointment.doctor)
  appointments: Appointment[];

  @OneToMany(() => Prescription, prescription => prescription.doctor)
  prescriptions: Prescription[];

  @OneToMany(() => VitalSigns, vitalSigns => vitalSigns.recordedBy)
  vitalSigns: VitalSigns[];

  @OneToMany(() => LabResult, labResult => labResult.orderedBy)
  labResults: LabResult[];

  @OneToMany(() => MedicalDocument, document => document.createdBy)
  medicalDocuments: MedicalDocument[];

  @OneToMany(() => DoctorAvailability, availability => availability.doctor)
  availabilitySlots: DoctorAvailability[];
}