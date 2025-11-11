import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronJobOrmEntity } from './infrastructure/persistence/parent/entity/scheduler/cron_job.orm.entity';
import { CronJobRepositoryImpl } from './infrastructure/persistence/parent/implement/cron-job.repository.impl';
import { CronService } from './domain/parent/scheduler/service/cron-job.service';
import { CronRunnerService } from './domain/parent/scheduler/service/cron-job-runner.service';
import { CreateCronJobUseCase } from './application/parent/cron-job/create.cron.job.usecase';
import { DeleteCronJobUseCase } from './application/parent/cron-job/delete.cron-job.usecase';
import { GetAllCronJobUseCase } from './application/parent/cron-job/get-all.usecase';
import { GetCronJobByEmpresaUseCase } from './application/parent/cron-job/get-cron-job-by-empresa.usecase';
import { BranchStatusCronJobUseCase } from './application/parent/cron-job/update-status.cron-job.usecase';
import { GetCronJobByIdUseCase } from './application/parent/cron-job/get-cron-job-by-id-empresa.usecase';
import { CronJobController } from './adapter/web/controller/parent/cron-job.controller';
import { ResumenBoletasModule } from './resumen-boletas.module';
import { EmpresaModule } from './empresa.module';
import { ComunicacionBajaModule } from './comunicacion-baja.module';
import { ComprobanteModule } from './comprobante.module';
import { SucursalModule } from './sucursal.module';
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([CronJobOrmEntity]),
    ResumenBoletasModule,
    ComunicacionBajaModule,
    EmpresaModule,
    SucursalModule, 
    ComprobanteModule
  ],
  controllers: [CronJobController],
  providers: [
    CronService,
    CronRunnerService,
    CreateCronJobUseCase,
    DeleteCronJobUseCase,
    GetAllCronJobUseCase,
    GetCronJobByIdUseCase,
    GetCronJobByEmpresaUseCase,
    BranchStatusCronJobUseCase,
    CronJobRepositoryImpl,
  ],
  exports: [CronService, CronRunnerService, CronJobRepositoryImpl],
})
export class SchedulerModule {}

// @Global()
// @Module({
//   imports: [TypeOrmModule.forFeature([CronJobOrmEntity]), ResumenBoletasModule, ComunicacionBajaModule, ComprobanteModule, EmpresaModule],
//   controllers: [CronJobController],
//   providers: [
//     {
//       provide: CronService,
//       useFactory: (
//         cronRepo: CronJobRepositoryImpl,
//         auditoriaService: AuditoriaService,
//         empresaService:EmpresaService
//       ) => new CronService(cronRepo, auditoriaService, empresaService),
//       inject: [CronJobRepositoryImpl, AuditoriaService, EmpresaService],
//     },
//     {
//       provide: CronRunnerService,
//       useFactory: (cronService: CronService, comprobanteService: ComprobanteService, resumenService:ResumenService, 
//         comunicacionBajaService: ComunicacionBajaService) =>
//         new CronRunnerService(cronService, comprobanteService, resumenService, comunicacionBajaService),
//       inject: [CronService, ComprobanteService, ResumenService, ComunicacionBajaService],
//     },
//   CronService,
//   CronRunnerService,
//     // // Casos de uso
//     {
//       provide: CreateCronJobUseCase,
//       useFactory: (cronService: CronService) =>
//         new CreateCronJobUseCase(cronService),
//       inject: [CronService],
//     },
//     {
//       provide: DeleteCronJobUseCase,
//       useFactory: (cronService: CronService) =>
//         new DeleteCronJobUseCase(cronService),
//       inject: [CronService],
//     },
//     {
//       provide: GetAllCronJobUseCase,
//       useFactory: (cronService: CronService) =>
//         new GetAllCronJobUseCase(cronService),
//       inject: [CronService],
//     },
//     {
//       provide: GetCronJobByIdUseCase,
//       useFactory: (cronService: CronService) =>
//         new GetCronJobByIdUseCase(cronService),
//       inject: [CronService],
//     },

//     {
//       provide: GetCronJobByEmpresaUseCase,
//       useFactory: (cronService: CronService) =>
//         new GetCronJobByEmpresaUseCase(cronService),
//       inject: [CronService],
//     },
//     {
//       provide: BranchStatusCronJobUseCase,
//       useFactory: (cronService: CronService) =>
//         new BranchStatusCronJobUseCase(cronService),
//       inject: [CronService],
//     },
//     CronJobRepositoryImpl,
//   ],
//   exports: [CronJobRepositoryImpl, CronService, ],
// })
// export class SchedulerModule {
// }

