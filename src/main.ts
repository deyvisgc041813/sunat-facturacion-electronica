import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { registerHandlebarsHelpers } from './common/handlebars-helpers';
import { EliminaArraysVaciosInterceptor } from './adapter/web/interceptor/elimina-arrays-vacios.interceptor';
import { v2 as cloudinary } from 'cloudinary';
import { HttpErrorFilter } from './domain/exception/http-error.filter';
import { TenantGuard } from './adapter/guards/tenant.guard';
import { CronRunnerService } from './domain/parent/scheduler/service/cron-job-runner.service';
import { startScheduler } from './startScheduler';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    // Prefijo global para el facturador
  app.setGlobalPrefix('api/v1', {
    exclude: [
      // excluye health si quieres
      { path: 'health', method: RequestMethod.GET },
    ],
  });
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
  app.useGlobalGuards(app.get(TenantGuard));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
