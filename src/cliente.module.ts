import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClienteOrmEntity } from './infrastructure/persistence/parent/entity/cliente.orm.entity';
import { EmpresaOrmEntity } from './infrastructure/persistence/parent/entity/empesa.orm.entity';
import { ComprobanteOrmEntity } from './infrastructure/persistence/tenant/entity/comprobante/comprobante.orm.entity';
import { CatalogoModule } from './catalogo.module';
import { ClienteController } from './adapter/web/controller/parent/cliente.controller';
import { ClienteRepositoryImpl } from './infrastructure/persistence/parent/implement/cliente.repository.impl';
import { ClienteService } from './domain/parent/cliente/service/cliente.service';
import { AuditoriaService } from './domain/parent/core/logs/service/auditoria.logs.service';
import { CreateClientUseCase } from './application/parent/cliente/create.client.usecase.ts';
import { DeleteClientUseCase } from './application/parent/cliente/delete.client.usecase';
import { GetAllClientUseCase } from './application/parent/cliente/get-all.client.usecase';
import { GetByIdClientUseCase } from './application/parent/cliente/get-by-id.client.usecase';
import { GetByNumDocClientUseCase } from './application/parent/cliente/get-by-num-doc.usecase';
import { UpdateStatusClientUseCase } from './application/parent/cliente/update-status.client.usecase';
import { UpdateClientUseCase } from './application/parent/cliente/update.cliente.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ClienteOrmEntity,
      EmpresaOrmEntity,
      ComprobanteOrmEntity,
    ]),
    CatalogoModule,
  ],
  controllers: [ClienteController],
  providers: [
    {
      provide: ClienteService,
      useFactory: (
        clienteRepo: ClienteRepositoryImpl,
        auditoria: AuditoriaService,
      ) => new ClienteService(clienteRepo, auditoria),
      inject: [ClienteRepositoryImpl, AuditoriaService],
    },

    // Casos de uso
    {
      provide: CreateClientUseCase,
      useFactory: (clienteService: ClienteService) =>
        new CreateClientUseCase(clienteService),
      inject: [ClienteService],
    },
    {
      provide: DeleteClientUseCase,
      useFactory: (clienteService: ClienteService) =>
        new DeleteClientUseCase(clienteService),
      inject: [ClienteService],
    },
    {
      provide: GetAllClientUseCase,
      useFactory: (clienteService: ClienteService) =>
        new GetAllClientUseCase(clienteService),
      inject: [ClienteService],
    },
    {
      provide: GetByIdClientUseCase,
      useFactory: (clienteService: ClienteService) =>
        new GetByIdClientUseCase(clienteService),
      inject: [ClienteService],
    },
    {
      provide: GetByNumDocClientUseCase,
      useFactory: (clienteService: ClienteService) =>
        new GetByNumDocClientUseCase(clienteService),
      inject: [ClienteService],
    },
    {
      provide: UpdateStatusClientUseCase,
      useFactory: (clienteService: ClienteService) =>
        new UpdateStatusClientUseCase(clienteService),
      inject: [ClienteService],
    },
    {
      provide: UpdateClientUseCase,
      useFactory: (clienteService: ClienteService) =>
        new UpdateClientUseCase(clienteService),
      inject: [ClienteService],
    },
    ClienteRepositoryImpl,
  ],
  exports: [ClienteService],
})
export class ClienteModule {}
