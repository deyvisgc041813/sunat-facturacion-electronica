import { Injectable } from '@nestjs/common';
import { Between, In, Not } from 'typeorm';

import {
  EstadoComunicacionEnvioSunat,
  EstadoEnumComprobante,
} from 'src/util/estado.enum';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';
import dayjs from 'dayjs';
import { ComprobanteMapper } from 'src/domain/mapper/comprobante.mapper';
import { ComprobanteOrmEntity } from '../../entity/comprobante/comprobante.orm.entity';
import {
  ArchivoDescargable,
  ConprobanteRepository,
} from 'src/domain/tenant/comprobante/comprobante.repository';
import { ICreateComprobante } from 'src/domain/tenant/comprobante/interface/create.interface';
import { IResponsePs } from 'src/domain/tenant/comprobante/interface/response.ps.interface';
import { ComprobanteResponseDto } from 'src/domain/tenant/comprobante/dto/conprobante.response.dto';
import { IUpdateComprobante } from 'src/domain/tenant/comprobante/interface/update.interface';
import { TenantRepositoryHelper } from 'src/domain/parent/conecciones-database/service/tenant-repository.helper';
import { TenantContextService } from 'src/domain/parent/conecciones-database/service/tenant-context.service';
import { BaseTenantRepository } from '../../../base/base-tenant.repository';
import { ComprobanteRespuestaSunatRepositoryImpl } from './comprobante-respuesta.sunat.repository.impl';
import { LogRespuestaSunatRepositoryImpl } from './log-respuesta-sunat-fallida.repository.impl';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
@Injectable()
export class ComprobanteRepositoryImpl
  extends BaseTenantRepository<ComprobanteOrmEntity>
  implements ConprobanteRepository
{
  constructor(
    tenantRepositoryHelper: TenantRepositoryHelper,
    tenantContext: TenantContextService,
    private readonly comprobanteRespRepo: ComprobanteRespuestaSunatRepositoryImpl,
    private readonly logErrorRepo: LogRespuestaSunatRepositoryImpl,
  ) {
    super(tenantContext, tenantRepositoryHelper, ComprobanteOrmEntity);
  }
  async save(
    dto: ICreateComprobante,
    payloadJson: any,
  ): Promise<GenericResponse<IResponsePs>> {
    const repo = await this.getRepository();
    const mtoIcbper = dto.mtoIcbper !== null ? dto.mtoIcbper : null;
    const [rows] = await repo.query(
      `CALL sp_guardar_comprobante(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.sucursalId,
        dto.clientId,
        dto.tipoComprobante,
        dto.serie,
        dto.fechaEmision,
        dto.fechaVencimiento,
        dto.moneda,
        dto.totalGravado,
        dto.totalExonerado,
        dto.totalInafecto,
        dto.totalIgv,
        dto.mtoImpVenta,
        mtoIcbper,
        dto.tipoDocumento,
        dto.numeroDocumento,
        JSON.stringify(payloadJson),
      ],
    );
    const response: IResponsePs = {
      correlativo: rows[0].numero_correlativo,
      comprobanteId: rows[0].comprobante_id
    };
    return {
      status: true,
      message: 'Comprobante registrado correctamente',
      data: response,
    };
  }

  async findAll(sucursalId: number): Promise<ComprobanteResponseDto[]> {
    const repo = await this.getRepository();
    const result = await repo.find({
      where: { sucursalId },
      relations: ['serie'],
    });
    return result.map((c) => ComprobanteMapper.toDomain(c));
  }
  async findById(
    sucursalId: number,
    comprobanteIds: number[],
  ): Promise<ComprobanteResponseDto[] | null> {
    const repo = await this.getRepository();
    const comprobantes = await repo.find({
      where: { comprobanteId: In(comprobanteIds), sucursalId },
      relations: ['respuestaSunat', 'serie'],
    });
    return comprobantes.map((rsp) => ComprobanteMapper.toDomain(rsp));
  }
  async findByComprobanteAceptado(
    sucursalId: number,
    numCorrelativo: number,
    serieId: number,
  ): Promise<ComprobanteResponseDto | null> {
    const repo = await this.getRepository();
    const comprobante = await repo.findOne({
      where: {
        sucursalId,
        numeroComprobante: numCorrelativo,
        serie: { serieId },
        estado: EstadoEnumComprobante.ACEPTADO,
      },
      relations: ['serie'],
    });
    if (!comprobante) return null;
    return ComprobanteMapper.toDomain(comprobante);
  }
  async findBySucursalAndFecha(
    sucursalId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ComprobanteResponseDto[]> {
    const repo = await this.getRepository();
    const cpes = await repo.find({
      where: {
        sucursalId,
        fechaEmision: Between(fechaInicio, fechaFin),
      },
    });
    return cpes.map((c) => ComprobanteMapper.toDomain(c));
  }
  async getXmlFirmado(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null> {
    return null;
    // const cpe = await this.repo.findOne({
    //   where: { comprobanteId, empresaId },
    // });
    // if (!cpe?.xmlFirmado) {
    //   throw new NotFoundException(
    //     `No se encontró el archivo XML del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
    //   );
    // }

    // return {
    //   fileName: `${cpe.hashCpe || 'comprobante'}-${cpe.comprobanteId}.xml`,
    //   mimeType: 'application/xml',
    //   content: Buffer.from(cpe.xmlFirmado, 'utf-8'),
    // };
  }
  async getZipEnviado(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null> {
    // const cpe = await this.repo.findOne({
    //   where: { comprobanteId, empresaId },
    // });
    // if (!cpe?.xmlFirmado) {
    //   throw new NotFoundException(
    //     `No se encontró el archivo zip del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
    //   );
    // }
    // // genera un ZIP con el XML firmado
    // return {
    //   fileName: `${cpe.hashCpe || 'comprobante'}-${cpe.comprobanteId}.zip`,
    //   mimeType: 'application/zip',
    //   content: Buffer.from(cpe.xmlFirmado, 'utf-8'), // TODO: reemplazar con zip real
    // };
    return null;
  }
  async getCdrZip(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null> {
    // const cpe = await this.repo.findOne({
    //   where: { comprobanteId, empresaId },
    // });

    // if (!cpe?.cdr) {
    //   throw new NotFoundException(
    //     `No se encontró el archivo cdr del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
    //   );
    // }

    // return {
    //   fileName: `R-${cpe.hashCpe || 'comprobante'}-${cpe.comprobanteId}.zip`,
    //   mimeType: 'application/zip',
    //   content: Buffer.from(cpe.cdr, 'base64'), // 👈 convertir de string Base64 a Buffer
    // };
    return null;
  }

  async getHashCpe(
    comprobanteId: number,
    empresaId: number,
  ): Promise<string | null> {
    // const cpe = await this.repo.findOne({
    //   where: { comprobanteId, empresaId },
    //   select: ['hashCpe'],
    // });
    // if (!cpe?.cdr) {
    //   throw new NotFoundException(
    //     `No se encontró el hash cpe del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
    //   );
    // }
    // return cpe?.hashCpe;
    return null;
  }
  // async update(
  //   comprobanteId: number,
  //   sucursalId: number,
  //   update: IUpdateComprobante,
  // ): Promise<{ status: boolean; message: string }> {
  //   const repo = await this.getRepository();
  //   await repo.update(
  //     { comprobanteId, sucursalId },
  //     {
  //       estado: update.estado,
  //       descripcionEstado: update.descripcionEstado,
  //       fechaUpdate: update.fechaUpdate,
  //     },
  //   );
  //    await this.comprobanteRespRepo.saveRespuestaSunat(
  //     comprobanteId,
  //     update.cdr ?? null,
  //     update.xmlFirmado ?? null,
  //     update.hashCpe ?? null,
  //   );
  //   return { status: true, message: 'Comprobante actualizado correctamente' };
  // }
  async update(
    comprobanteId: number,
    sucursalId: number,
    update: IUpdateComprobante,
  ): Promise<{ status: boolean; message: string }> {
    const repo = await this.getRepository();
    try {
      await repo.update(
        { comprobanteId, sucursalId },
        {
          estado: update.estado,
          descripcionEstado: update.descripcionEstado,
          //fechaUpdate: update.fechaUpdate,
        },
      );
      // Guardar respuesta SUNAT o registrar error
      await this.saveRespuestaSunat(comprobanteId, sucursalId, update);

      return { status: true, message: 'Comprobante actualizado correctamente' };
    } catch (error) {
      console.error(
        `Error general al actualizar comprobante ${comprobanteId} en sucursal ${sucursalId}:`,
        error,
      );
      throw error;
    }
  }
  async findByEstado(
    estado: EstadoEnumComprobante,
  ): Promise<ComprobanteResponseDto[]> {
    const repo = await this.getRepository();
    const cpes = await repo.find({ where: { estado } });
    return cpes.map((c) => ComprobanteMapper.toDomain(c));
  }

  async findComprobanteByReferencia(
    sucursalId: number,
    tipoComprobante: string,
    motivos: string[],
    estado: string,
    serieRef: string,
    correlativoRef: number,
  ): Promise<ComprobanteResponseDto | null> {
    const repo = await this.getRepository();
    const qb = repo.createQueryBuilder('c');
    qb.where('c.sucursal_id = :sucursalId', { sucursalId })
      .andWhere(
        "JSON_UNQUOTE(JSON_EXTRACT(c.payload_json, '$.tipoComprobante')) = :tipoComprobante",
        { tipoComprobante },
      )
      .andWhere('c.estado = :estado', { estado });

    // Solo aplicar filtros de comprobanteReferencia cuando es NC (07) o ND (08)
    if (
      tipoComprobante === TipoComprobanteEnum.NOTA_CREDITO ||
      tipoComprobante === TipoComprobanteEnum.NOTA_DEBITO
    ) {
      qb.andWhere(
        "JSON_CONTAINS_PATH(c.payload_json, 'one', '$.documentoRelacionado.serie') = 1",
      )
        .andWhere(
          "JSON_CONTAINS_PATH(c.payload_json, 'one', '$.documentoRelacionado.correlativo') = 1",
        )
        .andWhere(
          "JSON_UNQUOTE(JSON_EXTRACT(c.payload_json, '$.documentoRelacionado.serie')) = :serieRef",
          { serieRef },
        )
        .andWhere(
          "JSON_UNQUOTE(JSON_EXTRACT(c.payload_json, '$.documentoRelacionado.correlativo')) = :correlativoRef",
          { correlativoRef: String(correlativoRef) },
        )
        .andWhere(
          "JSON_CONTAINS_PATH(c.payload_json, 'one', '$.motivo.codigo') = 1",
        )
        .andWhere(
          "JSON_UNQUOTE(JSON_EXTRACT(c.payload_json, '$.motivo.codigo')) IN (:...motivos)",
          { motivos },
        );
    }
    const comprobante = await qb.getOne();
    if (!comprobante) return null;
    return ComprobanteMapper.toDomain(comprobante);
  }
  async findBySerieCorrelativos(
    sucursalId: number,
    serieCorrelativo: string[],
  ): Promise<ComprobanteResponseDto[]> {
    const repo = await this.getRepository();
    const data = await repo.find({
      where: {
        sucursalId,
        serieCorrelativo: In(serieCorrelativo),
      },
    });
    return data.map((dt) => ComprobanteMapper.toDomain(dt));
  }
  async findBoletasForResumen(
    sucursalId: number,
    serieId: number,
    fechaResumen: string,
    estados: EstadoEnumComprobante[],
  ): Promise<ComprobanteResponseDto[]> {
    const repo = await this.getRepository();
    const fecha = new Date(fechaResumen);
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    const rsp = await repo.find({
      where: {
        sucursalId,
        serie: { serieId },
        fechaEmision: Between(inicioDelDia, finDelDia),
        comunicadoSunat: EstadoComunicacionEnvioSunat.NO_ENVIADO,
        estado: In(estados),
      },
      relations: ['serie'],
    });
    return rsp.map(ComprobanteMapper.toDomain);
  }

  async updateBoletaStatus(
    sucursalId: number,
    boletasIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: EstadoComunicacionEnvioSunat,
  ) {
    const repo = await this.getRepository();
    await repo
      .createQueryBuilder()
      .update()
      .set({
        estado: () =>
          `CASE 
           WHEN estado = '${EstadoEnumComprobante.PENDIENTE}' 
            OR estado = '${EstadoEnumComprobante.ENVIADO}' 

           THEN '${nuevoEstado}' 
           ELSE estado 
         END`,
        comunicadoSunat: () => comunicadoSunat,
      })
      .whereInIds(boletasIds)
      .andWhere('sucursal_id = :sucursalId', { sucursalId })
      .execute();
  }
  async updateComprobanteStatusMultiple(
    sucursalId: number,
    comprobanteIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: EstadoComunicacionEnvioSunat,
  ) {
    const repo = await this.getRepository();
    await repo
      .createQueryBuilder()
      .update()
      .set({
        estado: () =>
          `CASE 
         WHEN estado = '${EstadoEnumComprobante.PENDIENTE}' 
            OR estado = '${EstadoEnumComprobante.ENVIADO}' 
            OR estado = '${EstadoEnumComprobante.ACEPTADO}' 
           THEN '${nuevoEstado}' 
           ELSE estado 
         END`,
        comunicadoSunat: () => comunicadoSunat,
        fechaAnulacion:
          nuevoEstado === EstadoEnumComprobante.ANULADO
            ? dayjs().toDate()
            : null,
      })
      .whereInIds(comprobanteIds)
      .andWhere('sucursal_id = :sucursalId', { sucursalId })
      .execute();
  }

  async updateComprobanteStatus(
    sucursalId: number,
    serieId: number,
    numCorrelativo: number,
    desEstado: string,
    estado: EstadoEnumComprobante,
  ): Promise<boolean> {
    const repo = await this.getRepository();
    const result = await repo.update(
      {
        sucursalId,
        serie: { serieId },
        numeroComprobante: numCorrelativo,
        estado: Not(estado),
      },
      {
        estado: estado,
        descripcionEstado: desEstado,
        fechaAnulacion:
          estado === EstadoEnumComprobante.ANULADO ? dayjs().toDate() : null,
      },
    );
    if (result.affected && result.affected > 0) {
      return true;
    }
    return false;
  }

  private async saveRespuestaSunat(
    comprobanteId: number,
    sucursalId: number,
    update: IUpdateComprobante,
  ): Promise<void> {
    try {
      await this.comprobanteRespRepo.saveRespuestaSunat(
        comprobanteId,
        update?.cdr ?? null,
        update?.xmlFirmado ?? null,
        update?.hashCpe ?? null,
      );
    } catch (error) {
      console.warn(
        `Error guardando respuesta SUNAT para comprobante ${comprobanteId}:`,
        error.message,
      );

      await this.logErrorRepo.registrarError({
        comprobanteId,
        sucursalId,
        estado: update.estado ?? null,
        descripcionEstado: update.descripcionEstado ?? null,
        cdr: update.cdr ?? null,
        xmlFirmado: update.xmlFirmado ?? null,
        hashCpe: update.hashCpe ?? null,
        errorMensaje: String(error.message || 'Error desconocido'),
      });
      throw error
    }
  }
}
