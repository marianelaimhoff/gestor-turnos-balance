import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../entities/user.entity';
import { AppointmentStatus } from '../entities/appointment.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('appointments')
@UseGuards(JwtAuthGuard) // todos los endpoints requieren estar logueado
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  // PACIENTE: reservar turno
  // POST /appointments
  @Post()
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateAppointmentDto, @Request() req: RequestWithUser) {
    return this.appointmentsService.create(dto, req.user);
  }

  // PACIENTE: ver mis turnos
  // GET /appointments/my
  @Get('my')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  getMyAppointments(@Request() req: RequestWithUser) {
    return this.appointmentsService.findMyAppointments(req.user.id);
  }

  // PACIENTE: cancelar turno
  // PATCH /appointments/:id/cancel
  @Patch(':id/cancel')
  @Roles(UserRole.PATIENT)
  @UseGuards(RolesGuard)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('reason') reason: string,
    @Request() req: RequestWithUser,
  ) {
    return this.appointmentsService.cancelByPatient(id, req.user.id, reason);
  }

  // PROFESIONAL: ver su agenda (con filtro de fecha opcional)
  // GET /appointments/agenda?date=2025-08-15
  @Get('agenda')
  @Roles(UserRole.PROFESSIONAL)
  @UseGuards(RolesGuard)
  getAgenda(@Request() req: RequestWithUser, @Query('date') date?: string) {
    return this.appointmentsService.findByProfessional(
      req.user.professional.id,
      date,
    );
  }

  // PROFESIONAL: marcar asistencia o ausencia
  // PATCH /appointments/:id/attendance
  @Patch(':id/attendance')
  @Roles(UserRole.PROFESSIONAL)
  @UseGuards(RolesGuard)
  markAttendance(
    @Param('id', ParseIntPipe) id: number,
    @Body('status')
    status: AppointmentStatus.COMPLETED | AppointmentStatus.NO_SHOW,
    @Body('notes') notes: string,
    @Request() req: RequestWithUser,
  ) {
    return this.appointmentsService.markAttendance(
      id,
      req.user.id,
      status,
      notes,
    );
  }

  // ADMIN: ver todos los turnos con filtros
  // GET /appointments?professionalId=1&date=2025-08-15&status=CONFIRMED
  @Get()
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  findAll(
    @Query('professionalId') professionalId?: string,
    @Query('date') date?: string,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.findAll({
      professionalId: professionalId ? Number(professionalId) : undefined,
      date,
      status,
    });
  }

  // ADMIN: modificar turno
  // PATCH /appointments/:id
  @Patch(':id')
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, dto);
  }
}
