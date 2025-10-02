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
import { SummaryDocumentDto } from 'src/domain/resumen/dto/SummaryDocumentDto';
import { CreateResumenUseCase } from 'src/application/resumen/create/CreateResumenUseCase';
import { FirmaService } from '../../../infrastructure/sunat/firma/firma.service';
import { SunatService } from '../../../infrastructure/sunat/send/sunat.service';
import { XmlBuilderResumenService } from '../../../infrastructure/sunat/xml/xml-builder-resumen.service';
import { ResumenRepositoryImpl } from '../../../infrastructure/persistence/resumen/resumen.repository';
import { ComprobanteRepositoryImpl } from '../../../infrastructure/persistence/comprobante/comprobante.repository.impl';
import { SerieRepositoryImpl } from '../../../infrastructure/persistence/serie/serie.repository.impl';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/sunat-log/sunat-log.repository.impl';
import { GetStatusResumenUseCase } from 'src/application/resumen/query/GetStatusResumenUseCase';
import { SucursalRepositoryImpl } from 'src/infrastructure/persistence/sucursal/sucursal.repository.impl';
import { JwtAuthGuard } from 'src/adapter/guards/jwt.auth.guard';
import { EmpresaSucursal } from 'src/adapter/decorator/empresa-sucursal.decorator';
import { User } from 'src/adapter/decorator/user.decorator';

@Controller('summaries')
@UseGuards(JwtAuthGuard)
export class ResumenController {
  constructor(
    private readonly xmlBuilderResService: XmlBuilderResumenService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly sunatLogRep: SunatLogRepositoryImpl,
    private readonly reposiResumen: ResumenRepositoryImpl,
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    private readonly serieRepo: SerieRepositoryImpl,
    private readonly sucursalRepo: SucursalRepositoryImpl,
  ) {}
  @Post('/daily')
  async create(
    @Body() body: SummaryDocumentDto,
    @EmpresaSucursal()
    { empresaId, sucursalId }: { empresaId: number; sucursalId: number },
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
    const useCase = new GetStatusResumenUseCase(
      this.sunatService,
      this.reposiResumen,
      this.sunatLogRep,
      this.comprobanteRepo,
      this.sucursalRepo,
    );
    return useCase.execute(user?.empresaId, sucursalId, ticket);
  }
}
