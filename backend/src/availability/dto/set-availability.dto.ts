import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsString,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';

export class AvailabilitySlotDto {
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek!: number; // 0=Dom, 1=Lun, ..., 6=Sáb

  @IsString()
  startTime!: string; // "09:00"

  @IsString()
  endTime!: string; // "13:00"

  @IsNumber()
  slotDurationMinutes!: number; // 30, 45, 60
}

export class SetAvailabilityDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];
}
