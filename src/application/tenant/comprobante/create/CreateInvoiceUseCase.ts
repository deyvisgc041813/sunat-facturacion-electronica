
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { Injectable } from '@nestjs/common';
import { CreateInvoiceBaseUseCase } from '../base/CreateInvoiceBaseUseCase';
import { CreateInvoiceDto } from 'src/domain/tenant/comprobante/dto/invoice/create.invoice.dto';
import { ComprobanteService } from '../../../../domain/tenant/comprobante/services/comprobante.service';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { IResponseSunat } from 'src/domain/tenant/comprobante/interface/response.sunat.interface';
@Injectable()
export class CreateInvoiceUseCase extends CreateInvoiceBaseUseCase {
  constructor(
    sunatService: SunatService,
    sucursalService: SucursalService,
    comprobanteService :ComprobanteService
  ) {
    super(
      sunatService,
      sucursalService,
      comprobanteService
      
    );
  }
  protected createInvoice(data: CreateInvoiceDto, auth:IUserPayload):  Promise<IResponseSunat> {
    return this.execute(data, auth);
  }
}
