import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Professional } from './professional.entity';

@Entity('blocked_days')
export class BlockedDay {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'date' })
  date!: string;

  @Column({ nullable: true })
  reason!: string; // "Vacaciones", "Enfermedad", etc.

  @ManyToOne(() => Professional, (p) => p.blockedDays, { onDelete: 'CASCADE' })
  professional!: Professional;
}
