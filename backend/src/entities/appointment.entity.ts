import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Professional } from './professional.entity';

export enum AppointmentStatus {
  PENDING = 'PENDING', // solicitado, esperando confirmación
  CONFIRMED = 'CONFIRMED', // confirmado
  CANCELLED = 'CANCELLED', // cancelado
  COMPLETED = 'COMPLETED', // atendido
  NO_SHOW = 'NO_SHOW', // no se presentó
}

@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ type: 'time' })
  startTime!: string;

  @Column({ type: 'time' })
  endTime!: string;

  @Column({
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  @Column({ nullable: true })
  notes!: string; // notas del profesional sobre el paciente

  @Column({ nullable: true })
  cancellationReason!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @ManyToOne(() => User, (u) => u.appointments)
  patient!: User;

  @ManyToOne(() => Professional, (p) => p.appointments)
  professional!: Professional;
}
