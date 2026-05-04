import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── ADMIN: ver todos los usuarios ──────────────────────────────────────
  async findAll(role?: UserRole) {
    const where = role ? { role } : {};
    return this.userRepo.find({
      where,
      select: [
        'id',
        'fullName',
        'email',
        'phone',
        'role',
        'isActive',
        'createdAt',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  // ─── ADMIN / PROPIO USUARIO: ver un usuario por id ──────────────────────
  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'fullName',
        'email',
        'phone',
        'role',
        'isActive',
        'createdAt',
      ],
      relations: ['professional'],
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  // ─── PROPIO USUARIO: editar su perfil ───────────────────────────────────
  async updateMe(userId: number, dto: UpdateUserDto) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.fullName) user.fullName = dto.fullName;
    if (dto.email) user.email = dto.email;
    if (dto.phone) user.phone = dto.phone;

    await this.userRepo.save(user);

    const result = {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
    return result;
  }

  // ─── ADMIN: activar / desactivar usuario ────────────────────────────────
  async toggleActive(userId: number, requesterId: number) {
    if (userId === requesterId) {
      throw new ForbiddenException('No podés desactivarte a vos mismo');
    }
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    user.isActive = !user.isActive;
    await this.userRepo.save(user);
    return { id: user.id, isActive: user.isActive };
  }
}
