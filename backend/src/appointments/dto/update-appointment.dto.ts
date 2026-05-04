import { IsEnum, IsOptional } from 'class-validator';
import { AppointmentStatus } from '../../entities/appointment.entity';

export class UpdateAppointmentDto {
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsOptional()
  notes?: string;

  @IsOptional()
  cancellationReason?: string;
}
