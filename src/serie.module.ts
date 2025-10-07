import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieController } from './adapter/web/controller/serie.controller';
import { SerieAuditoriaModule } from './serie-auditoria.module';
import { CatalogoModule } from './catalogo.module';
import { SerieOrmEntity } from './infrastructure/persistence/serie-comprobante/SerieOrmEntity';
import { SerieComprobanteService } from './domain/serie-comprobante/service/serie-comprobante.service';
import { SerieComprobanteRepositoryImpl } from './infrastructure/persistence/serie-comprobante/serie.repository.impl';
import { CatalogoRepositoryImpl } from './infrastructure/persistence/catalogo/catalogo.repository.impl';
import { AuditoriaService } from './domain/core/logs/service/auditoria.logs.service';
import { CreateSerieComprobanteUseCase } from './application/serie-comprobante/create.serie.usecase';
import { GetSerieComprobanteBySucursalUseCase } from './application/serie-comprobante/get.series.usecase';
import { GetBySucursalAndTipComAndSerieUseCase } from './application/serie-comprobante/get-serie-by-sucursal-and-tipo-comprobante.usecase';
import { GetByIdSerieComprobanteBySucursalUseCase } from './application/serie-comprobante/get-by-id-serie-sucursal.usecase';
import { AdjustCorrelativeSerieComprobanteUseCase } from './application/serie-comprobante/update.serie-correlativo.usecase';
import { UpdateSerieComprobanteUseCase } from './application/serie-comprobante/update.serie.usecase';
import { UpdateStatusSerieComprobanteUseCase } from './application/serie-comprobante/update-status.series.usecase';
import { DeleteSeriesComprobanteUseCase } from './application/serie-comprobante/delete.sucursal.usecase';

@Module({
  imports: [
    TypeOrmModule.forFeature([SerieOrmEntity]),
    SerieAuditoriaModule,
    CatalogoModule,
  ],
  controllers: [SerieController],

  providers: [
    {
      provide: SerieComprobanteService,
      useFactory: (
        serieRepo: SerieComprobanteRepositoryImpl,
        catalogo: CatalogoRepositoryImpl,
        auditoriaService: AuditoriaService,
      ) => new SerieComprobanteService(serieRepo, catalogo, auditoriaService),
      inject: [
        SerieComprobanteRepositoryImpl,
        CatalogoRepositoryImpl,
        AuditoriaService,
      ],
    },
    // Casos de uso
    {
      provide: CreateSerieComprobanteUseCase,
      useFactory: (serieService: SerieComprobanteService) =>
        new CreateSerieComprobanteUseCase(serieService),
      inject: [SerieComprobanteService],
    },
    {
      provide: GetSerieComprobanteBySucursalUseCase,
      useFactory: (sucuralService: SerieComprobanteService) =>
        new GetSerieComprobanteBySucursalUseCase(sucuralService),
      inject: [SerieComprobanteService],
    },
    {
      provide: GetBySucursalAndTipComAndSerieUseCase,
      useFactory: (sucuralService: SerieComprobanteService) =>
        new GetBySucursalAndTipComAndSerieUseCase(sucuralService),
      inject: [SerieComprobanteService],
    },
    {
      provide: GetByIdSerieComprobanteBySucursalUseCase,
      useFactory: (sucuralService: SerieComprobanteService) =>
        new GetByIdSerieComprobanteBySucursalUseCase(sucuralService),
      inject: [SerieComprobanteService],
    },
    {
      provide: AdjustCorrelativeSerieComprobanteUseCase,
      useFactory: (sucuralService: SerieComprobanteService) =>
        new AdjustCorrelativeSerieComprobanteUseCase(sucuralService),
      inject: [SerieComprobanteService],
    },
    {
      provide: UpdateSerieComprobanteUseCase,
      useFactory: (sucuralService: SerieComprobanteService) =>
        new UpdateSerieComprobanteUseCase(sucuralService),
      inject: [SerieComprobanteService],
    },
    {
      provide: UpdateStatusSerieComprobanteUseCase,
      useFactory: (sucuralService: SerieComprobanteService) =>
        new UpdateStatusSerieComprobanteUseCase(sucuralService),
      inject: [SerieComprobanteService],
    },
    {
      provide: DeleteSeriesComprobanteUseCase,
      useFactory: (sucuralService: SerieComprobanteService) =>
        new DeleteSeriesComprobanteUseCase(sucuralService),
      inject: [SerieComprobanteService],
    },

    SerieComprobanteRepositoryImpl,
  ],

  exports: [SerieComprobanteRepositoryImpl, SerieComprobanteService],
})
export class SerieModule {}
