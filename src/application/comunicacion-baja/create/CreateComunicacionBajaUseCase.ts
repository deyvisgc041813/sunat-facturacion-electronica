import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { ZipUtil } from 'src/util/ZipUtil';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { EmpresaRepository } from 'src/domain/empresa/Empresa.repository';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { SerieRepository } from 'src/domain/series/Serie.repository';
import {
  extraerHashCpe,
  getFechaHoraActualLima,
  getFechaHoyYYYYMMDD,
} from 'src/util/Helpers';
import {
  EstadoEnvioSunat,
  EstadoEnumComprobante,
  EstadoComunicacionEnvioSunat,
} from 'src/util/estado.enum';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { XmlBuilderComunicacionBajaService } from 'src/infrastructure/sunat/xml/xml-builder-comunicacion-baja.service';
import {
  ComunicacionBajaDetalleDto,
  ComunicacionBajaDto,
} from 'src/domain/comunicacion-baja/ComunicacionBajaDto';
import { IComunicacionBajaRepository } from 'src/domain/comunicacion-baja/interface/baja.repository.interface';
import { CreateComunicacionBajaDto } from 'src/domain/comunicacion-baja/interface/create.comunicacion.interface';
import { IComunicacionBajaDetalle } from 'src/domain/comunicacion-baja/interface/baja.detalle.interface';
import { BadRequestException, Inject } from '@nestjs/common';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';

export class CreateComunicacionBajaUseCase {
  constructor(
    private readonly xmlBuilderComunicacionBajaService: XmlBuilderComunicacionBajaService,
    private readonly firmaService: FirmaService,
    private readonly sunatService: SunatService,
    private readonly empresaRepo: EmpresaRepository,
    protected readonly sunatLogRepo: SunatLogRepository,
    private readonly bajaRepo: IComunicacionBajaRepository,
    private readonly comprobanteRepo: ConprobanteRepository,
    private readonly serieRepo: SerieRepository,
  ) {}

  async execute(data: ComunicacionBajaDto): Promise<{
    status: boolean;
    message: string;
    xmlFirmado: string;
    ticket: string;
  }> {
    // 1. Obtener el certificado digital y clave
    const respCert = await this.empresaRepo.findCertificado(
      data?.company?.ruc.trim(),
    );
    if (!respCert?.certificadoDigital || !respCert?.claveCertificado) {
      throw new Error(
        `No se encontró certificado o clave para la empresa con RUC ${data.company.ruc}`,
      );
    }
    // 2. mapear el detalle de los comprobantes a anular
    const detalles: IComunicacionBajaDetalle[] = data.detalles.map(
      ({ motivo, comprobanteId }: ComunicacionBajaDetalleDto) => ({
        motivo,
        comprobanteId,
      }),
    );
    // 3. mapear los id de los comprobantes
    const comprobanteIds = detalles.map((d) => d.comprobanteId) ?? [];
    const comprobantesBaja =
      (await this.comprobanteRepo.findByEmpresaAndId(
        respCert.empresaId,
        comprobanteIds,
      )) ?? [];
    // 4. validar que estos comprobantes ya esten como anulados o enviados
    const errores = this.validarComprobantesParaBaja(data, comprobantesBaja);
    if (errores.length > 0) {
      throw new BadRequestException({
        success: false,
        statusCode: 400,
        message: errores, //
      });
    }
    const empresaId = respCert.empresaId ?? 0;
    const fechaEnvio: Date = getFechaHoraActualLima();
    const fechaEnvioBaja = getFechaHoyYYYYMMDD();
    // 5. Obtener serie y correlativo
    const comunicacion = await this.obtenerSerie(
      empresaId,
      fechaEnvioBaja,
      data?.tipoDocumento,
    );
    // 6. Firmar XML
    const xml = this.xmlBuilderComunicacionBajaService.buildComunicacionBaja(
      data,
      comunicacion.serie,
      fechaEnvio,
    );
    const passwordDecript = CryptoUtil.decrypt(respCert.claveCertificado);
    const xmlFirmado = await this.firmaService.firmarXml(
      xml,
      respCert.certificadoDigital,
      passwordDecript,
    );

    // 7. Comprimir ZIP
    const fileName = this.obtenerNombreFile(
      data.company.ruc,
      fechaEnvioBaja,
      comunicacion.correlativo,
      data.tipoDocumento,
    );
    const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);

    // 8. Guardar preliminarmente la baja en BD (estado enviado)
    const hash = (await extraerHashCpe(xmlFirmado)) ?? '';

    const objectBaja: CreateComunicacionBajaDto = {
      empresaId,
      correlativo: comunicacion.correlativo,
      estado: EstadoEnvioSunat.ENVIADO,
      fechaGeneracion: new Date(fechaEnvio),
      fecReferencia: new Date(data.fecReferencia),
      nombreArchivo: fileName,
      xml: xmlFirmado,
      hashComunicacion: hash,
      ticket: '',
      serie: comunicacion.serie,
      detalle: detalles,
    };
    const newBaja = await this.bajaRepo.save(objectBaja);
    await this.serieRepo.actualizarCorrelativo(
      comunicacion?.serieId,
      comunicacion?.correlativo,
    );

    try {
      // 9. Enviar a SUNAT
      const ticket = await this.sunatService.sendSummary(
        `${fileName}.zip`,
        zipBuffer,
      );

      // 10. Actualizar baja a ENVIADO
      await this.bajaRepo.update(comunicacion.serie, empresaId, {
        estado: EstadoEnvioSunat.ENVIADO,
        ticket,
      });

      // esto se debe cambiar con el tocken
      await this.comprobanteRepo.updateComprobanteStatusMultiple(
        empresaId,
        comprobanteIds,
        EstadoEnumComprobante.ENVIADO,
        EstadoComunicacionEnvioSunat.ENVIADO,
      );

      return {
        status: true,
        message: `La comunicación de baja fue enviada correctamente a SUNAT. Ticket asignado: ${ticket}`,
        xmlFirmado,
        ticket,
      };
    } catch (error: any) {
      // 9. Actualizar baja con error
      await this.bajaRepo.update(comunicacion.serie, empresaId, {
        estado: EstadoEnvioSunat.ERROR,
      });
      await this.procesarErrorResumen(
        error,
        newBaja.data ?? 0,
        empresaId,
        comunicacion.serie,
        xmlFirmado,
        data.tipoDocumento,
      );
      throw error;
    }
  }

  private obtenerNombreFile(
    ruc: string,
    fecReferencia: string,
    correlativo: number,
    tipoDocumento: string,
  ) {
    return `${ruc}-${tipoDocumento}-${fecReferencia}-${correlativo}`;
  }

  private async obtenerSerie(
    empresaId: number,
    fecBaja: string,
    tipoDocumento: string,
  ): Promise<{ serie: string; correlativo: number; serieId: number }> {
    const rsp = await this.serieRepo.getNextCorrelativo(
      empresaId,
      TipoComprobanteEnum.COMUNICACION_BAJA,
      tipoDocumento,
    );
    return {
      serie: `${tipoDocumento}-${fecBaja}-${rsp?.correlativo}`,
      correlativo: rsp?.correlativo,
      serieId: rsp?.serieId,
    };
  }

  private async procesarErrorResumen(
    error: any,
    resumendIdBd: number,
    empresaId: number,
    serie: string,
    xmlFirmado: string,
    tipoDocumento: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      empresaId,
      tipo: tipoDocumento,
      serie,
    });

    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      //obj.codigoResSunat = serie;
      obj.resumenId = resumendIdBd;
      obj.request = xmlFirmado;
      obj.empresaId = empresaId;
      obj.serie = serie;
      await this.sunatLogRepo.save(obj);
    }
  }
  private validarComprobantesParaBaja(
    data: ComunicacionBajaDto,
    comprobantesBaja: ComprobanteResponseDto[],
  ): string[] {
    const errores: string[] = [];

    for (const item of data.detalles) {
      const comprobante = comprobantesBaja.find(
        (c) => c.comprobanteId === item.comprobanteId,
      );

      if (!comprobante) {
        errores.push(`El comprobante con ID ${item.comprobanteId} no existe.`);
        continue;
      }

      if (
        [EstadoEnumComprobante.ENVIADO, EstadoEnumComprobante.ANULADO].includes(
          comprobante.estado as EstadoEnumComprobante,
        )
      ) {
        errores.push(
          `El comprobante ${comprobante.serie?.serie}-${comprobante.numeroComprobante} ya fue dado de baja o está en proceso de baja.`,
        );
      }
    }

    return errores;
  }
}
