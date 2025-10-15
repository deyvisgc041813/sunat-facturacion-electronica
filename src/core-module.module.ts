import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditoriaLogOrmEntity } from './infrastructure/persistence/parent/entity/auditoria.log-orm.entity';
import { AuditoriaLogsRepositoryImpl } from './infrastructure/persistence/parent/implement/auditoria-log.repository';
import { AuditoriaService } from './domain/parent/core/logs/service/auditoria.logs.service';

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
