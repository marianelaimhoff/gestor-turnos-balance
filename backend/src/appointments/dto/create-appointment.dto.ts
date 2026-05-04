import { IsNotEmpty, IsDateString, IsNumber } from 'class-validator';

export class CreateAppointmentDto {
  @IsNumber()
  professionalId!: number;

  @IsDateString()
  date!: string; // "2025-08-15"

  @IsNotEmpty()
  startTime!: string; // "09:00"

  notes?: string;
}
