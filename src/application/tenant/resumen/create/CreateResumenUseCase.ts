
import { OperacionResumenEnum } from 'src/util/catalogo.enum';
import { SummaryDocumentDto } from 'src/domain/tenant/resumen/dto/summary-document.dto';
import {
  IDocumento,
  ISummaryDocument,
} from 'src/domain/tenant/resumen/interface/sunat.summary.interface';
import { ResumenBoletaDetalleDto } from 'src/domain/tenant/resumen/interface/create.summary.detalle.interface';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { ComprobanteService } from 'src/domain/tenant/comprobante/services/comprobante.service';
import { ResumenService } from 'src/domain/tenant/resumen/service/resumen.service';

export class CreateResumenUseCase {
  constructor(
    protected readonly comprobanteService: ComprobanteService,
    protected readonly resumenService: ResumenService,
    protected readonly sucuralService: SucursalService,
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
    const empresaId = auth?.empresaId ?? 0;
    const sucursalId = auth.sucursalActiva ?? 0;
    const sucursal = await this.sucuralService.getDigitalCertificate(
      sucursalId,
      empresaId,
    );
    const fechas = this.resumenService.obtenerFechasResumen();
    // 1. Obtener correlativo y boletas
    const resumen = await this.resumenService.obtenerResumenId(
      sucursalId,
      fechas.fechaEnvioResumen,
      data.serieResumen,
    );

    const boletas = await this.resumenService.obtenerBoletasPendientes(
      sucursalId,
      data.serie ?? 'B001',
      data.fecReferencia,
    );
    if (!boletas.length) {
      return {
        status: false,
        message: 'No existen boletas pendientes para enviar en el resumen.',
        xmlFirmado: '',
        ticket: '',
      };
    }

    // 2. Mapear documentos y armar resumen
    const documentos = this.resumenService.mapearDocumentos(boletas);
    const objectSummary: ISummaryDocument = {
      ublVersion: data.ublVersion,
      customizationID: data.customizationID,
      resumenId: resumen.resumenId,
      fechaEnvio: fechas.fechaEnvio,
      fecReferencia: new Date(data.fecReferencia),
      company: data.company,
      documentos,
      signatureId: sucursal?.signatureId ?? '',
      signatureNote: sucursal?.signatureNote ?? '',
    };
    const builResumen = await this.resumenService.buildSunatSubmissionPayload(
      objectSummary,
      sucursal.certificadoDigital,
      sucursal.claveCertificado,
      fechas.fechaEnvioResumen,
      resumen.correlativo,
      data.serieResumen,
    );
    const detalle: ResumenBoletaDetalleDto[] = objectSummary.documentos.map(
      (bol: IDocumento) => ({
        comprobanteId: bol.comprobanteId,
        operacion: OperacionResumenEnum.ADICIONAR,
      }),
    );
    const resumenSave = await this.resumenService.createResumen(
      sucursalId,
      resumen.correlativo,
      fechas.fechaEnvio,
      objectSummary.fecReferencia,
      builResumen?.fileName,
      builResumen?.signedXml,
      builResumen?.hash,
      resumen?.resumenId,
      detalle,
    );
    await this.resumenService.setNextCorrelativo(
      sucursalId,
      resumen?.serieId,
      resumen?.correlativo,
    );
    const rpta = this.resumenService.submitResumenSunat(sucursalId, sucursal, builResumen, resumen, detalle, resumenSave.data ?? 0, data.serie ?? "")
    return rpta
  }
}
