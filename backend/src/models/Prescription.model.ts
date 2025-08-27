import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { Patient } from './Patient.model';
import { Doctor } from './Doctor.model';
import { PrescriptionItem } from './PrescriptionItem.model';

export enum PrescriptionStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  DISCONTINUED = 'discontinued',
  ON_HOLD = 'on_hold'
}

@Entity()
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text', { nullable: true })
  prescriptionNotes: string;

  @Column({
    type: 'enum',
    enum: PrescriptionStatus,
    default: PrescriptionStatus.ACTIVE
  })
  status: PrescriptionStatus;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date', nullable: true })
  endDate: Date;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Patient, patient => patient.prescriptions)
  patient: Patient;

  @ManyToOne(() => Doctor, doctor => doctor.prescriptions)
  doctor: Doctor;

  @OneToMany(() => PrescriptionItem, prescriptionItem => prescriptionItem.prescription, { cascade: true })
  prescriptionItems: PrescriptionItem[];
}