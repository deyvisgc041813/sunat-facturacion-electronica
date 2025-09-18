
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { ZipUtil } from 'src/util/ZipUtil';
import { EmpresaRepositoryImpl } from 'src/infrastructure/database/repository/empresa.repository.impl';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/database/repository/error-log.repository.impl';
import { ErrorMapper } from 'src/infrastructure/mapper/ErrorMapper';
import { SummaryDocumentDto } from 'src/domain/comprobante/dto/resumen/SummaryDocumentDto';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { SunatLogRepositoryImpl } from 'src/infrastructure/database/repository/sunat-log.repository.impl';

export class CreateResumenUseCase {
  constructor(
   //private readonly xmlBuilder: XmlBuilderService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly empresaRepo: EmpresaRepositoryImpl,
    private readonly errorLogRepo: ErrorLogRepositoryImpl,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
  ) {}

  async execute(data: SummaryDocumentDto): Promise<{
    status: boolean;
    message: string;
    xmlFirmado: any;
    ticket: any;
  }> {
    const respCert = await this.empresaRepo.findCertificado(
      data?.company?.ruc.trim(),
    );
    const summaryInfo = this.parseResumenId(data?.resumenId);
    try {
      // 1. Construir XML
      const certificadoDigital = respCert?.certificadoDigital;
      const claveDigital = respCert?.claveCertificado;
      if (!certificadoDigital || !claveDigital) {
        throw new Error(
          `No se encontró certificado o clave para la empresa con RUC ${data.company.ruc}`,
        );
      }
      const passworDecript = CryptoUtil.decrypt(claveDigital);
      const xml =  "" //this.xmlBuilder.buildResumenBoletas(data);
      // 2. Firmar
      const xmlFirmado = await this.firmaService.firmarXml(
        xml,
        certificadoDigital,
        passworDecript,
      );
      const fileName = this.obtenerNombreFile(
        data.company.ruc,
        summaryInfo.fecha,
        summaryInfo.correlativo,
      );
      // 3. Comprimir ZIP
      const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);
      // 4. Enviar a SUNAT
      const ticket = await this.sunatService.sendSummary(
        `${fileName}.zip`,
        zipBuffer,
      );

      return {
        status: true,
        message: `Resumen diario enviado correctamente. Ticket: ${ticket}`,
        ticket,
        xmlFirmado,
      };
    } catch (error: any) {
      const rspError = ErrorMapper.mapError(error, {
        empresaId: respCert?.empresaId ?? 0,
        tipo: 'RC',
        serie: 'RC',
        correlativo: summaryInfo?.correlativo,
      });
      if(rspError.tipoError === OrigenErrorEnum.SUNAT) {
        // inserta errores de sunat
        await this.sunatLogRepo.save(rspError.create as CreateSunatLogDto)
      } else {
        // inserta errores del sistema
        await this.errorLogRepo.save(rspError.create as CreateErrorLogDto);
      }
      throw error;
    }
  }
  private obtenerNombreFile(
    ruc: string,
    fecReferencia: string,
    correlativo: number,
  ) {
    return `${ruc}-RC-${fecReferencia}-${correlativo}`;
  }

  private parseResumenId = (resumenId: string) => {
    const [, fecha, corr] = resumenId.split('-');
    return { fecha, correlativo: +corr };
  };
}
