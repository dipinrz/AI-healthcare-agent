import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { Prescription } from './Prescription.model';
import { Medication } from './Medication.model';

@Entity()
export class PrescriptionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  dosage: string;

  @Column()
  frequency: string;

  @Column()
  duration: string;

  @Column('text', { nullable: true })
  instructions: string;

  @Column()
  quantity: number;

  @Column()
  refills: number;

  @Column('text', { nullable: true })
  notes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Prescription, prescription => prescription.prescriptionItems, { onDelete: 'CASCADE' })
  prescription: Prescription;

  @ManyToOne(() => Medication)
  medication: Medication;
}