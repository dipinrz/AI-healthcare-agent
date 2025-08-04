import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Patient } from './Patient';

export enum MessageType {
  USER = 'user',
  AGENT = 'agent',
  SYSTEM = 'system'
}

export enum AgentType {
  ORCHESTRATOR = 'orchestrator',
  FAQ = 'faq',
  APPOINTMENT = 'appointment',
  MEDICATION = 'medication',
  EMOTIONAL_SUPPORT = 'emotional_support',
  ESCALATION = 'escalation'
}

@Entity()
export class ChatLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  sessionId: string;

  @Column({
    type: 'enum',
    enum: MessageType
  })
  messageType: MessageType;

  @Column({
    type: 'enum',
    enum: AgentType,
    nullable: true
  })
  agentType: AgentType;

  @Column('text')
  message: string;

  @Column('json', { nullable: true })
  metadata: {
    intent?: string;
    confidence?: number;
    entities?: any;
    context?: any;
  };

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Patient, patient => patient.chatLogs, { nullable: true })
  patient: Patient;
}