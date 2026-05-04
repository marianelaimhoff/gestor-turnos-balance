import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Appointment } from './appointment.entity';
import { Availability } from './availability.entity';
import { BlockedDay } from './blocked-day.entity';

export enum AttentionType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
}

@Entity('professionals')
export class Professional {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  specialty!: string; // kinesiología, pilates, nutrición, podología

  @Column({
    type: 'enum',
    enum: AttentionType,
    default: AttentionType.INDIVIDUAL,
  })
  attentionType!: AttentionType;

  @Column({ default: 1 })
  maxPatientsPerSlot!: number; // para pilates grupal

  @Column({ nullable: true })
  bio!: string;

  @Column({ nullable: true })
  profileImage!: string;

  // Un profesional ES un usuario
  @OneToOne(() => User, (u) => u.professional)
  @JoinColumn()
  user!: User;

  @OneToMany(() => Appointment, (a) => a.professional)
  appointments!: Appointment[];

  @OneToMany(() => Availability, (av) => av.professional)
  availabilities!: Availability[];

  @OneToMany(() => BlockedDay, (b) => b.professional)
  blockedDays!: BlockedDay[];
}
