import { SummaryDocumentDto } from 'src/domain/tenant/resumen/dto/summary-document.dto';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { ResumenService } from 'src/domain/tenant/resumen/service/resumen.service';

export class CreateResumenUseCase {
  constructor(
    protected readonly resumenService: ResumenService,
  ) {}

  async execute(
    data: SummaryDocumentDto,
    auth: IUserPayload,
  ): Promise<{
    status: boolean;
    message: string;
    xmlFirmado: string;
    ticket: string;
  }> {
   return this.resumenService.createResumenenSunat(data, auth)
  }
}
