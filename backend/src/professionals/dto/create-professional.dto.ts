import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { AttentionType } from '../../entities/professional.entity';

export class CreateProfessionalDto {
  // id del User que ya existe con rol PROFESSIONAL
  @IsNumber()
  userId!: number;

  @IsNotEmpty()
  @IsString()
  specialty!: string;

  @IsOptional()
  @IsEnum(AttentionType)
  attentionType?: AttentionType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPatientsPerSlot?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}
