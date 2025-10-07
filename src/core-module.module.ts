import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaLogOrmEntity } from './infrastructure/persistence/core/logs/auditoria.log-orm.entity';
import { AuditoriaService } from './domain/core/logs/service/auditoria.logs.service';
import { AuditoriaLogsRepositoryImpl } from './infrastructure/persistence/core/logs/auditoria-log.repository';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditoriaLogOrmEntity])],
  providers: [
    {
      provide: AuditoriaService,
      useFactory: (sucuralRepo: AuditoriaLogsRepositoryImpl) =>
        new AuditoriaService(sucuralRepo),
      inject: [AuditoriaLogsRepositoryImpl],
    },
    AuditoriaLogsRepositoryImpl
  ],
  exports: [AuditoriaService, TypeOrmModule],
})
export class CoreModuleModule {}
