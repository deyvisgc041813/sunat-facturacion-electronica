import { Body, Controller, Get, Post} from '@nestjs/common';
import { CreateComprobanteDto } from 'src/domain/comprobante/dto/CreateComprobanteDto';
import { XmlBuilderService } from '../sunat/xml/xml-builder.service';
import { FirmaService } from '../sunat/firma/firma.service';
import { SunatService } from '../sunat/cliente/sunat.service';
import { EmpresaRepositoryImpl } from '../database/repository/empresa.repository.impl';
import { CreateComprobanteUseCase } from 'src/application/comprobante/CreateComprobanteUseCase';
import { ErrorLogRepositoryImpl } from '../database/repository/error-log.repository.impl';
import { generarCertificadoPrueba } from 'src/certificado/generarCertificadoPrueba';


@Controller('comprobantes')
export class ComprobanteController {
  constructor(private readonly xmlBuilder: XmlBuilderService, private readonly firmaService: FirmaService,
      private readonly sunatService: SunatService, 
      private readonly empresaRepo: EmpresaRepositoryImpl,
      private readonly errorLogRepo: ErrorLogRepositoryImpl,
      
    ) {}

  @Post()
  async create(@Body() body: CreateComprobanteDto) {
    const useCase = new CreateComprobanteUseCase(this.xmlBuilder, this.firmaService, this.sunatService, this.empresaRepo, this.errorLogRepo);
    return useCase.execute(body);
  }
 @Get("generarcertificado")
  async generarCerticado() {
    generarCertificadoPrueba()
    return true;
  }

  
}
