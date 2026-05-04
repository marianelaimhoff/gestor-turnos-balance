import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../entities/user.entity';

interface RequestWithUser extends Request {
  user: User;
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ADMIN: ver todos los usuarios (filtro opcional por rol)
  // GET /users?role=PATIENT
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  // CUALQUIER ROL: ver su propio perfil
  // GET /users/me
  @Get('me')
  getMe(@Request() req: RequestWithUser) {
    return this.usersService.findOne(req.user.id);
  }

  // CUALQUIER ROL: editar su propio perfil
  // PATCH /users/me
  @Patch('me')
  updateMe(@Body() dto: UpdateUserDto, @Request() req: RequestWithUser) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  // ADMIN: ver cualquier usuario por id
  // GET /users/:id
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  // ADMIN: activar / desactivar usuario
  // PATCH /users/:id/toggle-active
  @Patch(':id/toggle-active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  toggleActive(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: RequestWithUser,
  ) {
    return this.usersService.toggleActive(id, req.user.id);
  }
}
