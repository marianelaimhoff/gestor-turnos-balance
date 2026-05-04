import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Professional } from './professional.entity';

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn()
  id!: number;

  // 0=Domingo, 1=Lunes, ..., 6=Sábado
  @Column({ type: 'int' })
  dayOfWeek!: number;

  @Column({ type: 'time' })
  startTime!: string; // ej: "09:00"

  @Column({ type: 'time' })
  endTime!: string; // ej: "13:00"

  @Column({ default: 30 })
  slotDurationMinutes!: number; // duración de cada turno en minutos

  @ManyToOne(() => Professional, (p) => p.availabilities, {
    onDelete: 'CASCADE',
  })
  professional!: Professional;
}
