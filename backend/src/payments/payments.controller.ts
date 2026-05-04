import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../entities/user.entity';
import { PaymentStatus } from '../entities/payment.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ADMIN: registrar pago
  // POST /payments
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  // ADMIN: estadísticas (deudores, totales, pendientes)
  // GET /payments/stats
  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  getStats() {
    return this.paymentsService.getStats();
  }

  // ADMIN: ver todos con filtros
  // GET /payments?userId=1&status=PENDING&from=2025-01-01&to=2025-12-31
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.paymentsService.findAll({
      userId: userId ? Number(userId) : undefined,
      status,
      from,
      to,
    });
  }

  // PACIENTE / PROFESIONAL: ver sus propios pagos
  // GET /payments/my
  @Get('my')
  findMyPayments(@Request() req: RequestWithUser) {
    return this.paymentsService.findMyPayments(req.user.id);
  }

  // ADMIN: ver pagos de un usuario específico
  // GET /payments/user/:id
  @Get('user/:id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findByUser(@Param('id', ParseIntPipe) id: number) {
    return this.paymentsService.findByUser(id);
  }

  // ADMIN: actualizar estado de un pago
  // PATCH /payments/:id
  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePaymentDto) {
    return this.paymentsService.update(id, dto);
  }
}
