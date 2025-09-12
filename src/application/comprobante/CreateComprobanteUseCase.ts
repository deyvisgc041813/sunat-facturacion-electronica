import { SerieResponseDto } from 'src/domain/series/dto/SerieResponseDto';
import { XmlBuilderService } from 'src/infrastructure/sunat/xml/xml-builder.service';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { SunatService } from 'src/infrastructure/sunat/cliente/sunat.service';
import { CreateComprobanteDto } from 'src/domain/comprobante/dto/CreateComprobanteDto';
import { ZipUtil } from 'src/util/ZipUtil';
import { EmpresaRepositoryImpl } from 'src/infrastructure/database/repository/empresa.repository.impl';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { ErrorLogRepositoryImpl } from 'src/infrastructure/database/repository/error-log.repository.impl';
import { CreateErrorLogDto } from 'src/domain/error-log/dto/CreateErrorLogDto';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { ErrorMapper } from 'src/infrastructure/mapper/ErrorMapper';
import * as path from 'path';
export class CreateComprobanteUseCase {
  constructor(
    private readonly xmlBuilder: XmlBuilderService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly empresaRepo: EmpresaRepositoryImpl,
    private readonly errorLogRepo: ErrorLogRepositoryImpl,
  ) {

  }

  async execute(
    data: CreateComprobanteDto,
  ): Promise<{
    status: boolean;
    message: string;
    xml: any;
    xmlFirmado: any;
    cdr: any;
    data?: SerieResponseDto;
  }> {
    const respCert = await this.empresaRepo.findCertificado(
      data?.company?.ruc.trim(),
    );
    try {
      // 1. Construir XML
      const xml = this.xmlBuilder.buildInvoice(data);
      const certificadoDigital = respCert?.certificadoDigital;
      const claveDigital = respCert?.claveCertificado;
      if (!certificadoDigital || !claveDigital) {
        throw new Error(
          `No se encontró certificado o clave para la empresa con RUC ${data.company.ruc}`,
        );
      }
      const passworDecript = CryptoUtil.decrypt(claveDigital);
      // 2. Firmar
      const xmlFirmado = await this.firmaService.firmarXml(
        xml,
        certificadoDigital,
        passworDecript,
        data.company.ruc,
        data.client.rznSocial
      );
      console.log("xml firmado ", xmlFirmado)
      const fileName = this.obtenerNombreFile(
        data.company.ruc,
        data.tipoDoc,
        data.serie,
        data.correlativo,
      );
      // 3. Comprimir ZIP
         
      const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);
      // 4. Enviar a SUNAT
      const cdr = await this.sunatService.sendBill(`${fileName}.zip`,
        zipBuffer,
      );
      return {
        status: true,
        message: 'Comprobante procesado',
        xml,
        xmlFirmado,
        cdr,
      };
    } catch (error: any) {
      const create = ErrorMapper.mapError(error, {
        empresaId: respCert?.empresaId ?? 0,
        tipo: data.tipoDoc,
        serie: data.serie,
        correlativo: data.correlativo,
      });
      await this.errorLogRepo.save(create)
      throw error;
    }
  }
  private obtenerNombreFile(
    ruc: string,
    tipoComprobante: string,
    serie: string,
    correlativo: string,
  ) {
    return `${ruc}-${tipoComprobante}-${serie}-${correlativo}`;
  }
}
