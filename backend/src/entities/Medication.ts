import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class Medication {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  genericName: string;

  @Column()
  brandName: string;

  @Column()
  category: string;

  @Column('text')
  description: string;

  @Column('text', { array: true })
  indications: string[];

  @Column('text', { array: true })
  contraindications: string[];

  @Column('text', { array: true })
  sideEffects: string[];

  @Column('text', { array: true })
  interactions: string[];

  @Column('text', { array: true })
  warnings: string[];

  @Column('json')
  dosageInfo: {
    adult: string;
    pediatric?: string;
    elderly?: string;
  };

  @Column()
  strength: string;

  @Column()
  form: string; // tablet, capsule, liquid, injection, etc.

  @Column()
  manufacturer: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}