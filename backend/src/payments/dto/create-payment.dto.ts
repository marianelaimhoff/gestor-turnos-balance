import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../../entities/payment.entity';

export class CreatePaymentDto {
  @IsNumber()
  userId!: number; // paciente o profesional (alquiler)

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @IsOptional()
  @IsEnum(PaymentMethod)
  method?: PaymentMethod;

  @IsOptional()
  @IsString()
  transferReference?: string; // número de referencia de la transferencia

  @IsOptional()
  @IsString()
  description?: string; // "Cuota Julio 2025", "Alquiler consultorio"

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
