import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteOrmEntity } from './infrastructure/persistence/cliente/ClienteOrmEntity';
import { EmpresaOrmEntity } from './infrastructure/persistence/empresa/empesa.orm.entity';
import { EmpresaRepositoryImpl } from './infrastructure/persistence/empresa/empresa.repository.impl';
import { ComprobanteOrmEntity } from './infrastructure/persistence/comprobante/ComprobanteOrmEntity';
import { EmpresaController } from './adapter/web/controller/empresa.controller';
import { ProductoOrmEntity } from './infrastructure/persistence/producto/ProductoOrmEntity';
import { EmpresaService } from './domain/empresa/services/empresa.service';
import { CreateEmpresaUseCase } from './application/empresa/create.empresa.usecase';
import { GetAllEmpresaUseCase } from './application/empresa/get-all.empresa.usecase';
import { GetByIdEmpresaUseCase } from './application/empresa/get-by-id.empresa.usecase';
import { UpdateEmpresaUseCase } from './application/empresa/update.empresa.usecase';
import { DeleteEmpresaUseCase } from './application/empresa/delete.empresa.usecase';
import { UpdateStatusEmpresaUseCase } from './application/empresa/update-status.empresa.usecase';
import { AuditoriaService } from './domain/core/logs/service/auditoria.logs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmpresaOrmEntity,
      ClienteOrmEntity,
      ComprobanteOrmEntity,
      ProductoOrmEntity,
    ]),
  ],
  controllers: [EmpresaController],
  providers: [
    {
      provide: EmpresaService,

      useFactory: (
        empresaRepo: EmpresaRepositoryImpl,
        auditoriaService: AuditoriaService,
      ) => new EmpresaService(empresaRepo, auditoriaService),
      inject: [EmpresaRepositoryImpl, AuditoriaService],
    },

    // Casos de uso
    {
      provide: CreateEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new CreateEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: GetAllEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new GetAllEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: GetByIdEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new GetByIdEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: UpdateEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new UpdateEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: DeleteEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new DeleteEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    {
      provide: UpdateStatusEmpresaUseCase,
      useFactory: (empresaService: EmpresaService) =>
        new UpdateStatusEmpresaUseCase(empresaService),
      inject: [EmpresaService],
    },
    EmpresaRepositoryImpl,
  ],
  exports: [EmpresaRepositoryImpl],
})
export class EmpresaModule {}
