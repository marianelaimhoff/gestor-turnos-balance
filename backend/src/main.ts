// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // ignora campos que no están en el DTO
      forbidNonWhitelisted: true,
      transform: true, // convierte tipos automáticamente
    }),
  );

  app.enableCors();

  await app.listen(3000);
  console.log('Backend corriendo en http://localhost:3000');
}
void bootstrap();
