import { ComunicacionBajaRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/baja.repository.impl';
import { Injectable, Logger } from '@nestjs/common';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';
import {
  extraerHashCpe,
  getFechaHoraActualLima,
  getFechaHoyYYYYMMDD,
  mapSunatToEstado,
} from 'src/util/Helpers';
import { ErrorMapper } from 'src/domain/mapper/error-exception.mapper';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import { CreateSunatLogDto } from 'src/domain/tenant/sunat-log/interface/sunat.log.interface';
import {
  codigoRespuestaSunatMap,
  EstadoComunicacionEnvioSunat,
  EstadoEnumComprobante,
  EstadoEnvioSunat,
} from 'src/util/estado.enum';
import { SunatLogRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/auditoria/sunat-log.repository.impl';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { FirmaService } from 'src/infrastructure/sunat/firma/firma.service';
import { ZipUtil } from 'src/util/ZipUtil';
import { SerieComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/serie-comprobante.repository.impl';
import { ComprobanteRepositoryImpl } from 'src/infrastructure/persistence/tenant/implement/comprobante/comprobante.repository.impl';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import {
  BusinessLogicException,
  BusinessLogicObjectException,
} from 'src/adapter/web/exception/exeception-dynamic';
import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { SucursalService } from 'src/domain/parent/sucursal/service/sucursal.service';
import { IComunicacionBajaDetalle } from '../interface/baja.detalle.interface';
import {
  ComunicacionBajaDetalleDto,
  ComunicacionBajaDto,
} from '../dto/comunicacion-baja.dto';
import { ComprobanteResponseDto } from '../../comprobante/dto/conprobante.response.dto';
import { XmlBuilderComunicacionBajaService } from 'src/infrastructure/sunat/xml/xml-builder-comunicacion-baja.service';
import { CreateComunicacionBajaDto } from '../interface/create.comunicacion.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { BajaComprobanteResponseDto } from '../dto/ComunicacionBajaResponseDto';
const estadosFinales = new Set([
  EstadoEnvioSunat.ACEPTADO,
  EstadoEnvioSunat.RECHAZADO,
  EstadoEnvioSunat.ERROR,
  EstadoEnvioSunat.OBSERVADO,
]);
export interface ISunatPayloadData {
  signedXml: string;
  fileName: string;
  zipBuffer: Buffer;
  hash: string;
}
export interface IComunicacionIdentificadorResponse {
  serie: string;
  correlativo: number;
  serieId: number;
}
@Injectable()
export class ComunicacionBajaService {
  private readonly logger = new Logger(ComunicacionBajaService.name);
  constructor(
    private readonly comprobanteRepo: ComprobanteRepositoryImpl,
    protected readonly sunatLogRepo: SunatLogRepositoryImpl,
    protected readonly firmaService: FirmaService,
    private readonly serieRepo: SerieComprobanteRepositoryImpl,
    private readonly bajaRepo: ComunicacionBajaRepositoryImpl,
    private readonly xmlBuilderComunicacionBajaService: XmlBuilderComunicacionBajaService,
    private readonly sunatService: SunatService,
    protected readonly sucursalService: SucursalService,
  ) {}

  async createComunicacionBajaSunat(
    data: ComunicacionBajaDto,
    auth: IUserPayload,
  ): Promise<{
    status: boolean;
    message: string;
    xmlFirmado: string;
    ticket: string;
    comprobantesNoProcesados: string[];
  }> {
    const empresaId = auth?.empresaId ?? 0;
    const sucursalId = auth.sucursalActiva ?? 0;
    const sucursal = await this.sucursalService.getDigitalCertificate(
      sucursalId,
      empresaId,
    );
    const tenantDatabase = auth.subDominio;
    const comprobante = this.obetnerComprobantesDto(data);
    const comprobantesBaja =
      (await this.comprobanteRepo.findByIds(
        sucursalId,
        comprobante?.comprobanteIds,
        tenantDatabase,
      )) ?? [];
    // validar que estos comprobantes ya esten como anulados o enviados
    const bajaProcesable = this.validarComprobantesParaBaja(
      data,
      comprobantesBaja,
    );

    const fechas = this.obtenerFechasBaja();
    // Obtener serie y correlativo
    const comunicacion = await this.obtenerSerie(
      sucursalId,
      fechas.fechaEnvioBaja,
      data?.tipoDocumento,
      tenantDatabase,
    );
    data.signatureId = sucursal?.signatureId ?? '';
    data.signatureNote = sucursal?.signatureNote ?? '';
    // Firmar XML
    const xml = this.xmlBuilderComunicacionBajaService.buildComunicacionBaja(
      data,
      comunicacion.serie,
      fechas.fechaEnvio,
    );
    const passwordDecript = CryptoUtil.decrypt(sucursal.claveCertificado);
    const xmlFirmado = await this.firmaService.firmarXml(
      xml,
      sucursal.certificadoDigital,
      passwordDecript,
    );
    // Comprimir ZIP
    const fileName = this.obtenerNombreFile(
      data.company.ruc,
      fechas.fechaEnvioBaja,
      comunicacion.correlativo,
      data.tipoDocumento,
    );
    const zipBuffer = await ZipUtil.createZip(fileName, xmlFirmado);
    // 8. Guardar preliminarmente la baja en BD (estado enviado)
    // const detalle = bajaProcesable.comprobanteIdsValidos.map(id => {
    //   const valido = comprobante.detalle.find(cp => cp.comprobanteId == id)
    //   return valido as IComunicacionBajaDetalle
    // })
    const detalle = bajaProcesable.comprobanteIdsValidos
      .map((id) => data.detalles.find((cp) => cp.comprobanteId == id))
      .filter((d): d is ComunicacionBajaDetalleDto => !!d);
    const newBaja = await this.saveBaja(
      sucursalId,
      comunicacion,
      xmlFirmado,
      fechas.fechaEnvio,
      data.fecReferencia,
      fileName,
      detalle,
    );
    await this.serieRepo.setNextCorrelativo(
      sucursalId,
      comunicacion?.serieId,
      comunicacion?.correlativo,
      tenantDatabase,
    );

    try {
      // Enviar a SUNAT
      const usuarioSecundario = sucursal?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        sucursal.claveSolSecundario ?? '',
      );
      const ticket = await this.sunatService.sendSummary(
        `${fileName}.zip`,
        zipBuffer,
        usuarioSecundario,
        claveSecundaria,
      );
      // Actualizar baja a ENVIADO
      await this.bajaRepo.update(
        comunicacion.serie,
        sucursalId,
        {
          estado: EstadoEnvioSunat.ENVIADO,
          ticket,
        },
        tenantDatabase,
      );

      await this.comprobanteRepo.updateComprobanteStatusMultiple(
        sucursalId,
        comprobante.comprobanteIds,
        EstadoEnumComprobante.ENVIADO,
        EstadoComunicacionEnvioSunat.ENVIADO,
        tenantDatabase,
      );
      const comprobantesValidos =
        bajaProcesable.comprobanteIdsValidos?.length > 0;
      return {
        status: comprobantesValidos,
        message: comprobantesValidos
          ? `La comunicación de baja fue enviada correctamente a SUNAT. Ticket asignado: ${ticket}`
          : 'No se encontraron comprobantes válidos para enviar la comunicación de baja.',
        xmlFirmado: comprobantesValidos ? (xmlFirmado ?? '') : '',
        ticket: comprobantesValidos ? (ticket ?? '') : '',
        comprobantesNoProcesados: bajaProcesable.errores ?? [],
      };
    } catch (error: any) {
      // 9. Actualizar baja con error
      await this.bajaRepo.update(
        comunicacion.serie,
        sucursalId,
        {
          estado: EstadoEnvioSunat.ERROR,
        },
        tenantDatabase,
      );
      await this.procesarErrorBaja(
        error,
        newBaja.data ?? 0,
        sucursalId,
        comunicacion.serie,
        xmlFirmado,
        data.tipoDocumento,
      );
      throw error;
    }
  }
  async saveBaja(
    sucursalId: number,
    identificadorComunicacion: IComunicacionIdentificadorResponse,
    xmlFirmado: string,
    fechaEnvio: Date,
    fecReferencia: string,
    fileName: string,
    detalle: IComunicacionBajaDetalle[],
    tenantDatabase?: string,
  ): Promise<GenericResponse<number>> {
    const hash = (await extraerHashCpe(xmlFirmado)) ?? '';
    const objectBaja: CreateComunicacionBajaDto = {
      sucursalId,
      correlativo: identificadorComunicacion.correlativo,
      estado: EstadoEnvioSunat.ENVIADO,
      fechaGeneracion: new Date(fechaEnvio),
      fecReferencia: new Date(fecReferencia),
      nombreArchivo: fileName,
      xml: xmlFirmado,
      hashComunicacion: hash,
      ticket: '',
      serie: identificadorComunicacion.serie,
      detalle,
    };
    const newBaja = await this.bajaRepo.save(objectBaja, tenantDatabase);
    return newBaja;
  }
  private async obtenerSerie(
    sucursalId: number,
    fecBaja: string,
    tipoDocumento: string,
    tenantDatabase?: string,
  ): Promise<IComunicacionIdentificadorResponse> {
    const rsp = await this.serieRepo.getNextCorrelativo(
      sucursalId,
      TipoComprobanteEnum.COMUNICACION_BAJA,
      tipoDocumento,
      tenantDatabase,
    );
    return {
      serie: `${tipoDocumento}-${fecBaja}-${rsp?.correlativo}`,
      correlativo: rsp?.correlativo,
      serieId: rsp?.serieId,
    };
  }
  private async procesarErrorBaja(
    error: any,
    bajaId: number,
    sucursalId: number,
    serie: string,
    xmlFirmado: string,
    tipoDocumento: string,
    tenantDatabase?: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      sucursalId,
      tipo: tipoDocumento,
      serie,
    });

    if (rspError?.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.bajaId = bajaId;
      obj.request = xmlFirmado;
      obj.serie = serie;
      obj.sucursalId = sucursalId;
      ((obj.intentos = 0), // esto cambiar cuando este ok
        (obj.usuarioEnvio = 'DEYVISGC')); // esto cambiar cuando este ok
      obj.fechaRespuesta = new Date();
      obj.fechaEnvio = new Date();
      await this.sunatLogRepo.save(obj, tenantDatabase);
    }
  }
  obtenerFechasBaja(): { fechaEnvio: Date; fechaEnvioBaja: string } {
    return {
      fechaEnvio: getFechaHoraActualLima(),
      fechaEnvioBaja: getFechaHoyYYYYMMDD(),
    };
  }

  private obtenerNombreFile(
    ruc: string,
    fecReferencia: string,
    correlativo: number,
    tipoDocumento: string,
  ) {
    return `${ruc}-${tipoDocumento}-${fecReferencia}-${correlativo}`;
  }

  async consultarTicketBajaSunat(auth: IUserPayload, ticket?: string) {
    const empresaId = auth?.empresaId ?? 0;
    const sucursalId = auth.sucursalActiva ?? 0;
    const sucursal = await this.sucursalService.getDigitalCertificate(
      sucursalId,
      empresaId,
    );
    const usuarioSecundario = sucursal?.usuarioSolSecundario ?? '';
    const claveSecundaria = CryptoUtil.decrypt(
      sucursal.claveSolSecundario ?? '',
    );
    if (ticket) {
      return this.consultarTicketResumenSunatIndividual(
        sucursalId,
        ticket,
        usuarioSecundario,
        claveSecundaria,
      );
    } else {
      // Caso masivo
      return this.consultarTicketResumenSunatMasivo(
        sucursalId,
        usuarioSecundario,
        claveSecundaria,
        auth.subDominio,
      );
    }
  }
  private async consultarTicketResumenSunatIndividual(
    sucursalId: number,
    ticket: string,
    usuarioSecundario: string,
    claveSecundaria: string,
  ) {
    const baja = await this.bajaRepo.findBySucursalAndTicket(
      sucursalId,
      ticket,
    );
    if (!baja)
      throw new BusinessLogicException(
        `No existe una solicitud de comunicacion baja registrado con el ticket ${ticket}. Verifique que el número de ticket proporcionado sea correcto.`,
      );
    try {
      await this.validarEstadoFinalBaja(baja);
      const result = await this.procesarConsultaEstadoBajas(
        baja,
        ticket,
        usuarioSecundario,
        claveSecundaria,
        sucursalId,
      );
      return result;
    } catch (error: any) {
      if (baja) {
        if (!estadosFinales.has(baja.estado as EstadoEnvioSunat)) {
          await this.bajaRepo.update(baja?.serie, sucursalId, {
            estado: EstadoEnvioSunat.ERROR,
          });
        }
        await this.procesarErrorBaja(
          error,
          0,
          sucursalId ?? 0,
          baja?.serie,
          baja.xml ?? '',
          'RA',
        );
      }
      throw error;
    }
  }
  private async consultarTicketResumenSunatMasivo(
    sucursalId: number,
    usuarioSecundario: string,
    claveSecundaria: string,
    tenantDatabase: string,
  ): Promise<void> {
    const resultados: any[] = [];
    const errores: string[] = [];
    //"2025-09-11T12:26:13-05:00";
    const bajas = await this.bajaRepo.findByFecha(
      sucursalId,
      getFechaHoraActualLima(),
      EstadoEnumComprobante.ENVIADO,
      tenantDatabase,
    );
    if (bajas.length === 0) {
      this.logger.warn(
        `[SUNAT] No se encontraron registros de bajas pendientes para validar el estado de ticket en la sucursal ${sucursalId}.`,
      );

      return;
    }
    this.logger.log(
      `[SUNAT] Iniciando validación automática de tickets (${bajas.length}) en la sucursal ${sucursalId}.`,
    );

    for (const baja of bajas) {
      const ticket = baja.ticket ?? '';

      if (!ticket) {
        this.logger.warn(
          `[SUNAT] La comunicacion baja ${baja.bajaComprobanteId ?? '—'}-${baja.correlativo ?? ''} no tiene ticket asignado. Se omitió la validación (sucursal: ${sucursalId}).`,
        );
        continue;
      }

      try {
        const result = await this.procesarConsultaEstadoBajas(
          baja,
          ticket,
          usuarioSecundario,
          claveSecundaria,
          sucursalId,
        );
        resultados.push({ ticket, estado: result?.estadoSunat });
        this.logger.log(
          `[SUNAT]Ticket ${ticket} de la baja ${baja.bajaComprobanteId ?? '—'}-${baja.correlativo ?? ''} validado correctamente. Estado: ${result?.estadoSunat}.`,
        );
      } catch (error: any) {
        errores.push(`Ticket ${ticket}: ${error.message}`);
        this.logger.error(
          `[SUNAT] Error al consultar ticket ${ticket} (baja ${baja?.bajaComprobanteId ?? '—'}-${baja?.correlativo ?? ''}): ${error.message}`,
        );
      }
    }
    this.logger.log(
      `[SUNAT] Finalizó validación automática de tickets. Total: ${bajas.length}, procesados: ${resultados.length}, fallidos: ${errores.length}.`,
    );
  }
  private async procesarConsultaEstadoBajas(
    baja: BajaComprobanteResponseDto,
    ticket: string,
    usuarioSecundario: string,
    claveSecundaria: string,
    sucursalId: number,
  ) {
    const result = await this.sunatService.getStatus(
      ticket,
      usuarioSecundario,
      claveSecundaria,
    );
    await this.bajaRepo.updateBySucursalAndTicket(sucursalId, ticket, {
      estado: mapSunatToEstado(result.codigoResponse ?? ''),
      codResPuestaSunat: result.codigoResponse,
      cdr: result.cdr,
      mensajeSunat: result.mensaje,
      fechaRespuestaSunat: new Date(),
      observacionSunat:
        result.observaciones.length > 0
          ? JSON.stringify(result.observaciones)
          : null,
    });
    const comprobantesIds: number[] = (baja?.detalles ?? [])
      .map((d) => d.comprobante?.comprobanteId)
      .filter((id): id is number => id !== undefined);
    await this.comprobanteRepo.updateComprobanteStatusMultiple(
      sucursalId,
      comprobantesIds,
      EstadoEnumComprobante.ANULADO,
      EstadoComunicacionEnvioSunat.ACEPTADO_PROCESADO,
    );
    return result;
  }

  private validarComprobantesParaBaja(
    data: ComunicacionBajaDto,
    comprobantesBaja: ComprobanteResponseDto[],
  ): { comprobanteIdsValidos: number[]; errores: string[] } {
    const errores: string[] = [];
    const comprobanteIdsValidos: number[] = [];
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
        continue;
      }
      comprobanteIdsValidos.push(comprobante.comprobanteId);
    }
    return { comprobanteIdsValidos, errores };
  }

  private obetnerComprobantesDto(data: ComunicacionBajaDto): {
    comprobanteIds: number[];
    detalle: IComunicacionBajaDetalle[];
  } {
    // mapear el detalle de los comprobantes a anular
    const detalle: IComunicacionBajaDetalle[] = data.detalles.map(
      ({ motivo, comprobanteId }: ComunicacionBajaDetalleDto) => ({
        motivo,
        comprobanteId,
      }),
    );
    // mapear id de los comprobantes
    const comprobanteIds = detalle.map((d) => d.comprobanteId) ?? [];
    return {
      comprobanteIds,
      detalle,
    };
  }
  private validarEstadoFinalBaja(baja: BajaComprobanteResponseDto) {
    const estado = codigoRespuestaSunatMap[baja?.codigoRespuestaSunat ?? ''];
    if (estadosFinales.has(estado)) {
      throw new BusinessLogicException(
        `La solicitud de baja ya fue procesada por SUNAT y se encuentra en estado definitivo (${estado}). ` +
          `No es posible volver a enviarla ni consultarla nuevamente.`,
      );
    }
  }
}
