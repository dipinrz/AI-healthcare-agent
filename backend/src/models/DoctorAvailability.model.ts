import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, Index } from 'typeorm';
import { Doctor } from './Doctor.model';

@Entity()
@Index(['doctor', 'startTime'], { unique: true })
export class DoctorAvailability {
  @PrimaryGeneratedColumn()
  slotId: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: false })
  isBooked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Doctor, doctor => doctor.availabilitySlots, { onDelete: 'CASCADE' })
  doctor: Doctor;
}