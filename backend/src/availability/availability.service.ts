import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from '../entities/availability.entity';
import { BlockedDay } from '../entities/blocked-day.entity';
import { Professional } from '../entities/professional.entity';
import { Appointment, AppointmentStatus } from '../entities/appointment.entity';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { BlockDayDto } from './dto/block-day.dto';
import { SlotResult } from './interfaces/slot-result.interface';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availRepo: Repository<Availability>,
    @InjectRepository(BlockedDay)
    private blockedRepo: Repository<BlockedDay>,
    @InjectRepository(Professional)
    private profRepo: Repository<Professional>,
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  // ─── PROFESIONAL: configurar su disponibilidad semanal ──────────────────
  async setAvailability(professionalId: number, dto: SetAvailabilityDto) {
    const professional = await this.profRepo.findOneBy({ id: professionalId });
    if (!professional) throw new NotFoundException('Profesional no encontrado');

    // Reemplaza toda la disponibilidad anterior
    await this.availRepo.delete({ professional: { id: professionalId } });

    const newSlots = dto.slots.map((slot) =>
      this.availRepo.create({ ...slot, professional }),
    );

    return this.availRepo.save(newSlots);
  }

  // ─── PROFESIONAL: ver su disponibilidad configurada ─────────────────────
  async getMyAvailability(professionalId: number) {
    return this.availRepo.find({
      where: { professional: { id: professionalId } },
      order: { dayOfWeek: 'ASC' },
    });
  }

  // ─── PROFESIONAL: bloquear un día ───────────────────────────────────────
  async blockDay(professionalId: number, dto: BlockDayDto) {
    const professional = await this.profRepo.findOneBy({ id: professionalId });
    if (!professional) throw new NotFoundException('Profesional no encontrado');

    const blocked = this.blockedRepo.create({ ...dto, professional });
    return this.blockedRepo.save(blocked);
  }

  // ─── PROFESIONAL: ver sus días bloqueados ───────────────────────────────
  async getBlockedDays(professionalId: number) {
    return this.blockedRepo.find({
      where: { professional: { id: professionalId } },
      order: { date: 'ASC' },
    });
  }

  // ─── PROFESIONAL: desbloquear un día ────────────────────────────────────
  async unblockDay(blockedDayId: number, professionalId: number) {
    const blocked = await this.blockedRepo.findOne({
      where: { id: blockedDayId },
      relations: ['professional'],
    });
    if (!blocked) throw new NotFoundException('Día bloqueado no encontrado');
    if (blocked.professional.id !== professionalId) {
      throw new NotFoundException('No tenés permiso sobre este registro');
    }
    await this.blockedRepo.remove(blocked);
    return { message: 'Día desbloqueado correctamente' };
  }

  // ─── PÚBLICO: obtener slots disponibles para reservar ───────────────────
  // Lo usa AppointmentsService y también el frontend para mostrar el calendario
  async getAvailableSlots(
    professionalId: number,
    date: string,
  ): Promise<SlotResult> {
    // 1. Verificar si el día está bloqueado
    const blocked = await this.blockedRepo.findOne({
      where: { date, professional: { id: professionalId } },
    });
    // Cuando esta bloqueado
    if (blocked) {
      return { available: false, reason: blocked.reason, slots: [] };
    }

    // 2. Buscar disponibilidad para ese día de la semana
    // new Date(date) en UTC puede dar un día distinto, sumamos offset
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const availability = await this.availRepo.findOne({
      where: { dayOfWeek, professional: { id: professionalId } },
    });
    if (!availability) {
      return { available: false, slots: [] };
    }

    // 3. Generar todos los slots posibles del día
    const allSlots = this.generateSlots(
      availability.startTime,
      availability.endTime,
      availability.slotDurationMinutes,
    );

    // 4. Consultar turnos ya confirmados ese día
    const professional = await this.profRepo.findOneBy({ id: professionalId });
    if (!professional) return { available: false, slots: [] };

    const takenAppointments = await this.appointmentRepo.find({
      where: {
        professional: { id: professionalId },
        date,
        status: AppointmentStatus.CONFIRMED,
      },
    });

    // 5. Contar cuántos turnos hay por slot (importante para pilates grupal)
    const takenCount: Record<string, number> = {};
    takenAppointments.forEach((a) => {
      takenCount[a.startTime] = (takenCount[a.startTime] ?? 0) + 1;
    });

    return {
      available: true,
      slotDuration: availability.slotDurationMinutes,
      slots: allSlots.map((time) => ({
        time,
        available: (takenCount[time] ?? 0) < professional.maxPatientsPerSlot,
        spotsLeft: professional.maxPatientsPerSlot - (takenCount[time] ?? 0),
      })),
    };
  }

  // ─── Usado internamente por AppointmentsService ──────────────────────────
  async getAvailabilityConfig(professionalId: number, date: string) {
    const [year, month, day] = date.split('-').map(Number);
    const dayOfWeek = new Date(year, month - 1, day).getDay();

    const availability = await this.availRepo.findOne({
      where: { dayOfWeek, professional: { id: professionalId } },
    });
    if (!availability)
      throw new NotFoundException('No hay configuración de disponibilidad');
    return availability;
  }

  // ─── Helper: genera array de horarios ───────────────────────────────────
  private generateSlots(
    start: string,
    end: string,
    duration: number,
  ): string[] {
    const slots: string[] = [];
    let [h, m] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    while (h < endH || (h === endH && m < endM)) {
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      m += duration;
      if (m >= 60) {
        h += Math.floor(m / 60);
        m = m % 60;
      }
    }
    return slots;
  }
}
