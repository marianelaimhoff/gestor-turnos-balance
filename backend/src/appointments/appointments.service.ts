import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { Professional } from '../entities/professional.entity';
import { User } from '../entities/user.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AvailabilityService } from '../availability/availability.service';
import { SlotResult } from '../availability/interfaces/slot-result.interface';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Professional)
    private professionalRepo: Repository<Professional>,
    private availabilityService: AvailabilityService,
  ) {}

  // ─── PACIENTE: reservar turno ────────────────────────────────────────────
  async create(dto: CreateAppointmentDto, patient: User) {
    const professional = await this.professionalRepo.findOne({
      where: { id: dto.professionalId },
    });
    if (!professional) throw new NotFoundException('Profesional no encontrado');

    // Verificar que el slot esté disponible
    const result: SlotResult = await this.availabilityService.getAvailableSlots(
      dto.professionalId,
      dto.date,
    );
    const slot = result.slots.find((s) => s.time === dto.startTime);
    if (!result.available || !slot || !slot.available) {
      throw new BadRequestException(
        'El horario seleccionado no está disponible',
      );
    }

    // Calcular endTime según duración del slot del profesional
    const availability: { slotDurationMinutes: number } =
      await this.availabilityService.getAvailabilityConfig(
        dto.professionalId,
        dto.date,
      );
    const endTime = this.addMinutes(
      dto.startTime,
      availability.slotDurationMinutes,
    );

    const appointment = this.appointmentRepo.create({
      date: dto.date,
      startTime: dto.startTime,
      endTime,
      notes: dto.notes,
      status: AppointmentStatus.CONFIRMED,
      patient,
      professional,
    });

    return this.appointmentRepo.save(appointment);
  }

  // ─── PACIENTE: ver sus propios turnos ───────────────────────────────────
  async findMyAppointments(patientId: number) {
    return this.appointmentRepo.find({
      where: { patient: { id: patientId } },
      relations: ['professional', 'professional.user'],
      order: { date: 'DESC', startTime: 'DESC' },
    });
  }

  // ─── PACIENTE: cancelar su turno ────────────────────────────────────────
  async cancelByPatient(
    appointmentId: number,
    patientId: number,
    reason?: string,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient'],
    });

    if (!appointment) throw new NotFoundException('Turno no encontrado');
    if (appointment.patient.id !== patientId) {
      throw new ForbiddenException('No podés cancelar un turno que no es tuyo');
    }
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('El turno ya está cancelado');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException(
        'No se puede cancelar un turno ya completado',
      );
    }

    appointment.status = AppointmentStatus.CANCELLED;
    appointment.cancellationReason = reason ?? 'Cancelado por el paciente';
    return this.appointmentRepo.save(appointment);
  }

  // ─── PROFESIONAL: ver su agenda ─────────────────────────────────────────
  async findByProfessional(professionalId: number, date?: string) {
    const where: { professional: { id: number }; date?: string } = {
      professional: { id: professionalId },
    };
    if (date) where.date = date;

    return this.appointmentRepo.find({
      where,
      relations: ['patient'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  // ─── PROFESIONAL: marcar asistencia ─────────────────────────────────────
  async markAttendance(
    appointmentId: number,
    professionalUserId: number,
    status: AppointmentStatus.COMPLETED | AppointmentStatus.NO_SHOW,
    notes?: string,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['professional', 'professional.user'],
    });

    if (!appointment) throw new NotFoundException('Turno no encontrado');
    if (appointment.professional.user.id !== professionalUserId) {
      throw new ForbiddenException('No tenés permiso sobre este turno');
    }

    appointment.status = status;
    if (notes) appointment.notes = notes;
    return this.appointmentRepo.save(appointment);
  }

  // ─── ADMIN: ver todos los turnos con filtros ─────────────────────────────
  async findAll(filters: {
    professionalId?: number;
    date?: string;
    status?: AppointmentStatus;
  }) {
    const query = this.appointmentRepo
      .createQueryBuilder('appointment')
      .leftJoinAndSelect('appointment.patient', 'patient')
      .leftJoinAndSelect('appointment.professional', 'professional')
      .leftJoinAndSelect('professional.user', 'professionalUser')
      .orderBy('appointment.date', 'DESC')
      .addOrderBy('appointment.startTime', 'ASC');

    if (filters.professionalId) {
      query.andWhere('professional.id = :professionalId', {
        professionalId: filters.professionalId,
      });
    }
    if (filters.date) {
      query.andWhere('appointment.date = :date', { date: filters.date });
    }
    if (filters.status) {
      query.andWhere('appointment.status = :status', {
        status: filters.status,
      });
    }

    return query.getMany();
  }

  // ─── ADMIN: modificar cualquier turno ───────────────────────────────────
  async update(appointmentId: number, dto: UpdateAppointmentDto) {
    const appointment = await this.appointmentRepo.findOneBy({
      id: appointmentId,
    });
    if (!appointment) throw new NotFoundException('Turno no encontrado');

    if (dto.status !== undefined) appointment.status = dto.status;
    if (dto.notes !== undefined) appointment.notes = dto.notes;
    if (dto.cancellationReason !== undefined)
      appointment.cancellationReason = dto.cancellationReason;

    return this.appointmentRepo.save(appointment);
  }

  // ─── Helper ─────────────────────────────────────────────────────────────
  private addMinutes(time: string, minutes: number): string {
    let [h, m] = time.split(':').map(Number);
    m += minutes;
    h += Math.floor(m / 60);
    m = m % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }
}
