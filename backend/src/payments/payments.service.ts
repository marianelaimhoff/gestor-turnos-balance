import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepo: Repository<Payment>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ─── ADMIN: registrar un pago ────────────────────────────────────────────
  async create(dto: CreatePaymentDto) {
    const user = await this.userRepo.findOneBy({ id: dto.userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const payment = this.paymentRepo.create({ ...dto, user });
    return this.paymentRepo.save(payment);
  }

  // ─── ADMIN: ver todos los pagos con filtros ──────────────────────────────
  async findAll(filters: {
    userId?: number;
    status?: PaymentStatus;
    from?: string;
    to?: string;
  }) {
    const query = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .orderBy('payment.createdAt', 'DESC');

    if (filters.userId) {
      query.andWhere('user.id = :userId', { userId: filters.userId });
    }
    if (filters.status) {
      query.andWhere('payment.status = :status', { status: filters.status });
    }
    if (filters.from) {
      query.andWhere('payment.createdAt >= :from', { from: filters.from });
    }
    if (filters.to) {
      query.andWhere('payment.createdAt <= :to', { to: filters.to });
    }

    return query.getMany();
  }

  // ─── ADMIN: ver pagos de un usuario específico ───────────────────────────
  async findByUser(userId: number) {
    const user = await this.userRepo.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    return this.paymentRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  // ─── ADMIN: actualizar estado de un pago ─────────────────────────────────
  // Útil para marcar como pagado cuando llega una transferencia
  async update(paymentId: number, dto: UpdatePaymentDto) {
    const payment = await this.paymentRepo.findOneBy({ id: paymentId });
    if (!payment) throw new NotFoundException('Pago no encontrado');

    if (dto.status) payment.status = dto.status;
    if (dto.method) payment.method = dto.method;
    if (dto.transferReference)
      payment.transferReference = dto.transferReference;
    if (dto.paidAt) payment.paidAt = dto.paidAt;

    return this.paymentRepo.save(payment);
  }

  // ─── ADMIN: estadísticas de pagos ────────────────────────────────────────
  async getStats() {
    const total = (await this.paymentRepo
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.PAID })
      .getRawOne()) as { total: string };

    const pending = (await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.PENDING })
      .getRawOne()) as { count: string; total: string };

    const overdue = (await this.paymentRepo
      .createQueryBuilder('payment')
      .select('COUNT(*)', 'count')
      .addSelect('SUM(payment.amount)', 'total')
      .where('payment.status = :status', { status: PaymentStatus.OVERDUE })
      .getRawOne()) as { count: string; total: string };

    // Usuarios que adeudan (para el panel de admin que mencionaste)
    const debtors = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.user', 'user')
      .where('payment.status IN (:...statuses)', {
        statuses: [PaymentStatus.PENDING, PaymentStatus.OVERDUE],
      })
      .select([
        'user.id',
        'user.fullName',
        'user.email',
        'SUM(payment.amount) as debt',
      ])
      .groupBy('user.id')
      .getRawMany();

    return {
      totalCollected: Number(total?.total ?? 0),
      pending: {
        count: Number(pending?.count ?? 0),
        amount: Number(pending?.total ?? 0),
      },
      overdue: {
        count: Number(overdue?.count ?? 0),
        amount: Number(overdue?.total ?? 0),
      },
      debtors,
    };
  }

  // ─── PACIENTE / PROFESIONAL: ver sus propios pagos ───────────────────────
  async findMyPayments(userId: number) {
    return this.paymentRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }
}
