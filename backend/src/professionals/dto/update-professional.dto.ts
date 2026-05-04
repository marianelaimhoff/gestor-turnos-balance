import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { AttentionType } from '../../entities/professional.entity';

export class UpdateProfessionalDto {
  @IsOptional()
  @IsString()
  specialty?: string;

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
