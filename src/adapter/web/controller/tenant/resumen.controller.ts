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

import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { User } from 'src/adapter/decorator/user.decorator';
import { ResumenRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/resumen.repository';
import { SummaryDocumentDto } from 'src/domain/tenant/resumen/dto/summary-document.dto';
import { CreateResumenUseCase } from 'src/application/tenant/resumen/create/CreateResumenUseCase';
import { GetStatusResumenUseCase } from 'src/application/tenant/resumen/query/GetStatusResumenUseCase';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { ComprobanteService } from 'src/domain/tenant/comprobante/services/comprobante.service';
import { ResumenService } from 'src/domain/tenant/resumen/service/resumen.service';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';

@Controller('companies/branch/summaries')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ResumenController {
  constructor(
    private readonly reposiResumen: ResumenRepositoryImpl,
    private readonly comprobanteService: ComprobanteService,
    private readonly resumenService: ResumenService,
    private readonly sucuralService:SucursalService
  ) {}
  @Post('/daily')
  async create(
    @Body() body: SummaryDocumentDto,
    @User() auth:IUserPayload
  ) {
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
        throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
    const useCase = new CreateResumenUseCase(
      this.comprobanteService,
      this.resumenService,
      this.sucuralService
    );
    return await useCase.execute(body, auth);
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
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
        throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
      );
    }
    const useCase = new GetStatusResumenUseCase(
      this.reposiResumen,
      this.comprobanteService,
      this.sucuralService,
      this.resumenService,
    );
    return useCase.execute(auth?.empresaId ?? 0, auth.sucursalActiva, ticket);
  }
}
