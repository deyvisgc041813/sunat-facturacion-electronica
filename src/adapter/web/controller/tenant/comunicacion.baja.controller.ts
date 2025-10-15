import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { XmlBuilderComunicacionBajaService } from 'src/infrastructure/sunat/xml/xml-builder-comunicacion-baja.service';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { User } from 'src/adapter/decorator/user.decorator';
import { ComunicacionBajaRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/baja.repository.impl';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { SerieComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/serie-comprobante.repository.impl';
import { ComunicacionBajaDto } from 'src/domain/tenant/comunicacion-baja/dto/comunicacion-baja.dto';
import { CreateComunicacionBajaUseCase } from 'src/application/tenant/comunicacion-baja/create/CreateComunicacionBajaUseCase';
import { GetStatusBajaStatusUseCase } from 'src/application/tenant/comunicacion-baja/query/GetStatusBajaStatusUseCase';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
@Controller('companies/branch/voided-documents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ComunicaciomBajaController {
  constructor(
    private readonly xmlBuilderResService: XmlBuilderComunicacionBajaService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly bajaRepo: ComunicacionBajaRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly serieRepo: SerieComprobanteRepositoryImpl,
    private readonly sucuralRepo: SucursalRepositoryImpl,
  ) {}
  @Post()
  async create(@Body() body: ComunicacionBajaDto, @User() auth: IUserPayload) {
    const useCase = new CreateComunicacionBajaUseCase(
      this.xmlBuilderResService,
      this.firmaService,
      this.sunatService,
      this.sunatLogRep,
      this.bajaRepo,
      this.comprobanteRepo,
      this.serieRepo,
      this.sucuralRepo,
    );
    return await useCase.execute(
      body,
      auth.empresaId ?? 0,
      auth.sucursalActiva,
    );
  }
  @Get('status/:ticket')
  async getStatus(@Param('ticket') ticket: string, @User() auth: IUserPayload) {
    if (!ticket || ticket.trim().length === 0) {
      throw new BadRequestException('El ticket es obligatorio');
    }
    if (!auth?.sucursales?.includes(Number(auth?.sucursalActiva))) {
      throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual (ID: ${auth?.sucursalActiva}).`,
      );
    }
    const useCase = new GetStatusBajaStatusUseCase(
      this.sunatService,
      this.bajaRepo,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.sucuralRepo,
    );
    return useCase.execute(auth?.empresaId ?? 0, auth?.sucursalActiva, ticket);
  }
}
