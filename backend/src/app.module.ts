import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { AvailabilityModule } from './availability/availability.module';
import { PaymentsModule } from './payments/payments.module';

// Entidades
import { User } from './entities/user.entity';
import { Professional } from './entities/professional.entity';
import { Appointment } from './entities/appointment.entity';
import { Availability } from './entities/availability.entity';
import { BlockedDay } from './entities/blocked-day.entity';
import { Payment } from './entities/payment.entity';

@Module({
  imports: [
    // Variables de entorno disponibles en toda la app
    ConfigModule.forRoot({ isGlobal: true }),

    // TypeORM con PostgreSQL
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USER'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [
          User,
          Professional,
          Appointment,
          Availability,
          BlockedDay,
          Payment,
        ],
        synchronize: true, // ← solo en desarrollo, en producción usar migrations
        logging: false,
      }),
    }),

    AuthModule,
    UsersModule,
    ProfessionalsModule,
    AppointmentsModule,
    AvailabilityModule,
    PaymentsModule,
  ],
})
export class AppModule {}
