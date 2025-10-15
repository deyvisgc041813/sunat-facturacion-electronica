import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { User } from 'src/adapter/decorator/user.decorator';
import { ResumenRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/resumen.repository';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { SerieComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/serie-comprobante.repository.impl';
import { SummaryDocumentDto } from 'src/domain/tenant/resumen/dto/summary-document.dto';
import { CreateResumenUseCase } from 'src/application/tenant/resumen/create/CreateResumenUseCase';
import { GetStatusResumenUseCase } from 'src/application/tenant/resumen/query/GetStatusResumenUseCase';
import { XmlBuilderResumenService } from 'src/infrastructure/sunat/xml/xml-builder-resumen.service';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';

@Controller('companies/branch/summaries')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ResumenController {
  constructor(
    private readonly xmlBuilderResService: XmlBuilderResumenService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly reposiResumen: ResumenRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly serieRepo: SerieComprobanteRepositoryImpl,
    private readonly sucursalRepo: SucursalRepositoryImpl,
  ) {}
  @Post('/daily')
  async create(
    @Body() body: SummaryDocumentDto,
    @User() auth:IUserPayload
  ) {
    const useCase = new CreateResumenUseCase(
      this.xmlBuilderResService,
      this.firmaService,
      this.sunatService,
      this.sunatLogRep,
      this.reposiResumen,
      this.comprobanteRepo,
      this.serieRepo,
      this.sucursalRepo,
    );
    return await useCase.execute(body, auth?.empresaId ?? 0, auth.sucursalActiva);
  }
  @Get('status/:ticket')
  async getStatus(
    @Param('ticket') ticket: string,
    @User() auth:IUserPayload
  ) {
    // 1. Consultar en SUNAT
    if (!ticket || ticket.trim().length === 0) {
      throw new BadRequestException('El ticket es obligatorio');
    }
    if (!auth?.sucursales.includes(auth?.sucursalActiva)) {
        throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual (ID: ${auth?.sucursalActiva}).`,
      );
    }
    const useCase = new GetStatusResumenUseCase(
      this.sunatService,
      this.reposiResumen,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.sucursalRepo,
    );
    return useCase.execute(auth?.empresaId ?? 0, auth.sucursalActiva, ticket);
  }
}
