import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './domain/exceptions/http-error.filter';
import { ValidationPipe } from '@nestjs/common';
import { registerHandlebarsHelpers } from './common/handlebars-helpers';
import { EliminaArraysVaciosInterceptor } from './adapter/web/interceptor/elimina-arrays-vacios.interceptor';
import { v2 as cloudinary } from 'cloudinary';
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


  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  // Registrar helpers antes de renderizar vistas
    // Aplica el interceptor globalmente
  app.useGlobalInterceptors(new EliminaArraysVaciosInterceptor());
  registerHandlebarsHelpers();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
