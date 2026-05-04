import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { Appointment } from './appointment.entity';
import { Professional } from './professional.entity';

export enum UserRole {
  PATIENT = 'PATIENT',
  PROFESSIONAL = 'PROFESSIONAL',
  ADMIN = 'ADMIN',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fullName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ default: '' })
  password!: string; // ← en NestJS password va directo en User, no en Credential separada

  @Column({ nullable: true })
  phone!: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.PATIENT })
  role!: UserRole;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  // Relación: si el user es PROFESSIONAL, tiene un perfil profesional
  @OneToOne(() => Professional, (p) => p.user, { nullable: true })
  professional!: Professional;

  // Relación: turnos del paciente
  @OneToMany(() => Appointment, (a) => a.patient)
  appointments!: Appointment[];
}
