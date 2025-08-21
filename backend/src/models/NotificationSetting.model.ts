import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Patient } from './Patient.model';

@Entity('notification_settings')
export class NotificationSetting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'patient_id' })
  patientId: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: 'patient_id' })
  patient: Patient;

  @Column({ name: 'notifications_enabled', default: false })
  notificationsEnabled: boolean;

  @Column({ name: 'reminder_24h', default: true })
  reminder24h: boolean;

  @Column({ name: 'reminder_1h', default: true })
  reminder1h: boolean;

  @Column({ name: 'appointment_confirmed', default: true })
  appointmentConfirmed: boolean;

  @Column({ name: 'appointment_cancelled', default: true })
  appointmentCancelled: boolean;

  @Column({ name: 'appointment_rescheduled', default: true })
  appointmentRescheduled: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}