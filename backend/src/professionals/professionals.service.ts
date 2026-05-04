import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Professional } from '../entities/professional.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

@Injectable()
export class ProfessionalsService {
  constructor(
    @InjectRepository(Professional)
    private professionalRepo: Repository<Professional>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── PÚBLICO: listar todos los profesionales activos ────────────────────
  async findAll() {
    return this.professionalRepo.find({
      relations: ['user'],
      where: { user: { isActive: true } },
      select: {
        id: true,
        specialty: true,
        attentionType: true,
        maxPatientsPerSlot: true,
        bio: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    });
  }

  // ─── PÚBLICO: ver detalle de un profesional ──────────────────────────────
  async findOne(id: number) {
    const professional = await this.professionalRepo.findOne({
      where: { id },
      relations: ['user', 'availabilities'],
      select: {
        id: true,
        specialty: true,
        attentionType: true,
        maxPatientsPerSlot: true,
        bio: true,
        user: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
        },
      },
    });
    if (!professional) throw new NotFoundException('Profesional no encontrado');
    return professional;
  }

  // ─── ADMIN: crear perfil profesional para un usuario existente ──────────
  // Flujo: primero registrás el usuario con rol PROFESSIONAL,
  // después el admin crea su perfil profesional con este endpoint
  async create(dto: CreateProfessionalDto) {
    const user = await this.userRepo.findOne({
      where: { id: dto.userId },
      relations: ['professional'],
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role !== UserRole.PROFESSIONAL) {
      throw new BadRequestException('El usuario debe tener rol PROFESSIONAL');
    }
    if (user.professional) {
      throw new BadRequestException('Este usuario ya tiene perfil profesional');
    }

    const professional = this.professionalRepo.create({
      specialty: dto.specialty,
      attentionType: dto.attentionType,
      maxPatientsPerSlot: dto.maxPatientsPerSlot ?? 1,
      bio: dto.bio,
      user,
    });

    return this.professionalRepo.save(professional);
  }

  // ─── ADMIN: editar perfil profesional ───────────────────────────────────
  async update(id: number, dto: UpdateProfessionalDto) {
    const professional = await this.professionalRepo.findOneBy({ id });
    if (!professional) throw new NotFoundException('Profesional no encontrado');

    if (dto.specialty) professional.specialty = dto.specialty;
    if (dto.attentionType) professional.attentionType = dto.attentionType;
    if (dto.maxPatientsPerSlot)
      professional.maxPatientsPerSlot = dto.maxPatientsPerSlot;
    if (dto.bio !== undefined) professional.bio = dto.bio;

    return this.professionalRepo.save(professional);
  }

  // ─── ADMIN: dar de baja un profesional (desactiva el usuario) ───────────
  async deactivate(id: number) {
    const professional = await this.professionalRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!professional) throw new NotFoundException('Profesional no encontrado');

    professional.user.isActive = false;
    await this.userRepo.save(professional.user);
    return { message: 'Profesional desactivado correctamente' };
  }
}
