import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { Availability } from '../entities/availability.entity';
import { BlockedDay } from '../entities/blocked-day.entity';
import { Professional } from '../entities/professional.entity';
import { Appointment } from '../entities/appointment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Availability,
      BlockedDay,
      Professional,
      Appointment,
    ]),
  ],
  controllers: [AvailabilityController],
  providers: [AvailabilityService],
  exports: [AvailabilityService], // ← exportamos para que AppointmentsModule lo use
})
export class AvailabilityModule {}
