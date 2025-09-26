import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './domain/exceptions/http-error.filter';
import { ValidationPipe } from '@nestjs/common';
import { registerHandlebarsHelpers } from './common/handlebars-helpers';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpErrorFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // quita propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // lanza error si llegan propiedades que no estan en tu dto
      transform: true, // convierte tipos (ej. string → number)
    })
  )
  // Registrar helpers antes de renderizar vistas
  registerHandlebarsHelpers();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
