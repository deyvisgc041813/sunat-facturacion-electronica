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
import { FirmaService } from '../../../infrastructure/sunat/firma/firma.service';
import { SunatService } from '../../../infrastructure/sunat/send/sunat.service';
import { ComprobanteRepositoryImpl } from '../../../infrastructure/persistence/comprobante/comprobante.repository.impl';
import { SerieRepositoryImpl } from '../../../infrastructure/persistence/serie/serie.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { CreateComunicacionBajaUseCase } from 'src/application/comunicacion-baja/create/CreateComunicacionBajaUseCase';
import { XmlBuilderComunicacionBajaService } from 'src/infrastructure/sunat/xml/xml-builder-comunicacion-baja.service';
import { ComunicacionBajaRepositoryImpl } from 'src/infrastructure/persistence/comunicacion-baja/baja.repository.impl';
import { ComunicacionBajaDto } from 'src/domain/comunicacion-baja/ComunicacionBajaDto';
import { GetStatusBajaStatusUseCase } from 'src/application/comunicacion-baja/query/GetStatusBajaStatusUseCase';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { EmpresaSucursal } from 'src/adapter/decorator/empresa-sucursal.decorator';
import { User } from 'src/adapter/decorator/user.decorator';

@Controller('voided-documents')
@UseGuards(JwtAuthGuard)
export class ComunicaciomBajaController {
  constructor(
    private readonly xmlBuilderResService: XmlBuilderComunicacionBajaService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly bajaRepo: ComunicacionBajaRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly serieRepo: SerieRepositoryImpl,
    private readonly sucuralRepo: SucursalRepositoryImpl,
  ) {}
  @Post()
  async create(
    @Body() body: ComunicacionBajaDto,
    @EmpresaSucursal()
    { empresaId, sucursalId }: { empresaId: number; sucursalId: number },
  ) {
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
    return await useCase.execute(body, empresaId, sucursalId);
  }
  @Get('status/:ticket')
  async getStatus(
    @Param('ticket') ticket: string,
    @Query('sucursalId') sucursalId: number,
    @User() user: any,
  ) {
    // 1. Consultar en SUNAT
    if (!ticket || ticket.trim().length === 0) {
      throw new BadRequestException('El ticket es obligatorio');
    }
    if (!user?.sucursales.includes(Number(sucursalId))) {
      throw new ForbiddenException(
        `La sucursal con ID ${sucursalId} no está autorizada`,
      );
    }
    const useCase = new GetStatusBajaStatusUseCase(
      this.sunatService,
      this.bajaRepo,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.sucuralRepo,
    );
    return useCase.execute(user?.empresaId, sucursalId, ticket);
  }
}
