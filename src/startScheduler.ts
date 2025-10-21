// src/bootstrap/scheduler.bootstrap.ts
import { CronRunnerService } from 'src/domain/parent/scheduler/service/cron-job-runner.service';
import { AppModule } from 'src/app.module';
import { NestFactory } from '@nestjs/core';
import { CronService } from './domain/parent/scheduler/service/cron-job.service';

export async function startScheduler() {
  try {
    // 🚀 crea un contexto de aplicación separado, solo para tareas de cron
    const context = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn'], // opcional: solo errores
    });

    const cronRunner = context.get(CronRunnerService, { strict: false });
    const cronService = context.get(CronService, { strict: false });

    // 👇 inyectamos manualmente la dependencia si Nest no lo hizo
    (cronRunner as any).cronService = cronService;
    console.log('✅ Arrancando scheduler fuera del ciclo de vida Nest...');

  } catch (error) {
    console.error('❌ Error al arrancar scheduler:', error);
  }
}
