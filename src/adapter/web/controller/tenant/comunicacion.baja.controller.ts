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
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { User } from 'src/adapter/decorator/user.decorator';
import { ComunicacionBajaRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/baja.repository.impl';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { ComunicacionBajaDto } from 'src/domain/tenant/comunicacion-baja/dto/comunicacion-baja.dto';
import { CreateComunicacionBajaUseCase } from 'src/application/tenant/comunicacion-baja/create/CreateComunicacionBajaUseCase';
import { GetStatusBajaStatusUseCase } from 'src/application/tenant/comunicacion-baja/query/GetStatusBajaStatusUseCase';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import type { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { TenantGuard } from 'src/adapter/guards/tenant.guard';
import { ComunicacionBajaService } from 'src/domain/tenant/comunicacion-baja/service/comunicacion-baja.service';
@Controller('companies/branch/voided-documents')
@UseGuards(JwtAuthGuard, TenantGuard)
export class ComunicaciomBajaController {
  constructor(
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly bajaRepo: ComunicacionBajaRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly sucuralRepo: SucursalRepositoryImpl,
    private readonly comunicacionBajaService :ComunicacionBajaService
  ) {}
  @Post('create')
  async create(@Body() body: ComunicacionBajaDto, @User() auth: IUserPayload) {
    const useCase = new CreateComunicacionBajaUseCase(this.comunicacionBajaService);
    return await useCase.execute(
      body,
      auth
    );
  }
  @Get('status/:ticket')
  async getStatus(@Param('ticket') ticket: string, @User() auth: IUserPayload) {
    if (!ticket || ticket.trim().length === 0) {
      throw new BadRequestException('El ticket es obligatorio');
    }
    if (!auth?.sucursalActiva || auth?.sucursalActiva == 0) {
        throw new ForbiddenException(
        `No tienes autorización para realizar esta acción desde la sucursal actual.`,
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
