import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { BlockDayDto } from './dto/block-day.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  // PÚBLICO: ver slots disponibles para reservar
  // GET /availability/:professionalId/slots?date=2025-08-15
  @Get(':professionalId/slots')
  getSlots(
    @Param('professionalId', ParseIntPipe) professionalId: number,
    @Query('date') date: string,
  ) {
    return this.availabilityService.getAvailableSlots(professionalId, date);
  }

  // PROFESIONAL: configurar su disponibilidad semanal
  // POST /availability/my
  @Post('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  setMyAvailability(
    @Body() dto: SetAvailabilityDto,
    @Request() req: RequestWithUser,
  ) {
    return this.availabilityService.setAvailability(
      req.user.professional.id,
      dto,
    );
  }

  // PROFESIONAL: ver su disponibilidad configurada
  // GET /availability/my
  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  getMyAvailability(@Request() req: RequestWithUser) {
    return this.availabilityService.getMyAvailability(req.user.professional.id);
  }

  // PROFESIONAL: bloquear un día
  // POST /availability/my/block
  @Post('my/block')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  blockDay(@Body() dto: BlockDayDto, @Request() req: RequestWithUser) {
    return this.availabilityService.blockDay(req.user.professional.id, dto);
  }

  // PROFESIONAL: ver sus días bloqueados
  // GET /availability/my/blocked
  @Get('my/blocked')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  getBlockedDays(@Request() req: RequestWithUser) {
    return this.availabilityService.getBlockedDays(req.user.professional.id);
  }

  // PROFESIONAL: desbloquear un día
  // DELETE /availability/my/block/:id
  @Delete('my/block/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  unblockDay(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.availabilityService.unblockDay(id, req.user.professional.id);
  }
}
