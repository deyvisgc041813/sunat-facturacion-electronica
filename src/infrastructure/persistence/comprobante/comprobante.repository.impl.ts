import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { ComprobanteOrmEntity } from './ComprobanteOrmEntity';

import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { IUpdateComprobante } from 'src/domain/comprobante/interface/update.interface';
import {
  ArchivoDescargable,
  ConprobanteRepository,
} from 'src/domain/comprobante/comprobante.repository';
import {
  EstadoComunicacionEnvioSunat,
  EstadoEnumComprobante,
} from 'src/util/estado.enum';
import { DataSource } from 'typeorm';
import { ICreateComprobante } from 'src/domain/comprobante/interface/create.interface';
import { IResponsePs } from 'src/domain/comprobante/interface/response.ps.interface';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';
import dayjs from 'dayjs';
import { ComprobanteRespuestaSunatOrmEntity } from './ComprobanteRespuestaSunatOrmEntity';
import { ComprobanteMapper } from 'src/domain/mapper/ComprobanteMapper';
@Injectable()
export class ComprobanteRepositoryImpl implements ConprobanteRepository {
  constructor(
    @InjectRepository(ComprobanteOrmEntity)
    private readonly repo: Repository<ComprobanteOrmEntity>,

    @InjectRepository(ComprobanteRespuestaSunatOrmEntity)
    private readonly repoRespSnat: Repository<ComprobanteRespuestaSunatOrmEntity>,
    
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async save(
    dto: ICreateComprobante,
    payloadJson: any,
  ): Promise<{ status: boolean; message: string; response?: IResponsePs }> {
    const mtoIcbper =  dto.mtoIcbper !== null ? dto.mtoIcbper : null
    const [rows] = await this.dataSource.query(
      `CALL sp_guardar_comprobante(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.sucursalId,
        dto.tipoComprobante,
        dto.serie,
        dto.fechaEmision,
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
      comprobanteId: rows[0].comprobante_id,
      clienteId: rows[0].cliente_id,
    };
    return {
      status: true,
      message: 'Comprobante registrado correctamente',
      response,
    };
  }

  async findAll(sucursalId: number): Promise<ComprobanteResponseDto[]> {
    const result = await this.repo.find({
      where: { sucursal: { sucursalId } },
      relations: ['sucursal', 'cliente', 'serie'],
    });
    return result.map((c) => ComprobanteMapper.toDomain(c));
  }
  async findById(
    sucursalId: number,
    comprobanteIds: number[],
  ): Promise<ComprobanteResponseDto[] | null> {
    const comprobantes = await this.repo.find({
      where: { comprobanteId: In(comprobanteIds), sucursal: { sucursalId } },
      relations: ['sucursal', 'sucursal.empresa', 'cliente', 'serie'],
    });
    return comprobantes.map((rsp) => ComprobanteMapper.toDomain(rsp));
  }
  async findByComprobanteAceptado(
    sucursalId: number,
    numCorrelativo: number,
    serieId: number,
  ): Promise<ComprobanteResponseDto | null> {
    const comprobante = await this.repo.findOne({
      where: {
        sucursal: { sucursalId },
        numeroComprobante: numCorrelativo,
        serie: {serieId},
        estado: EstadoEnumComprobante.ACEPTADO,
      },
      relations: ['cliente', 'serie'],
    });
    if (!comprobante) return null;
    return ComprobanteMapper.toDomain(comprobante);
  }
  async findBySucursalAndFecha(
    sucursalId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ComprobanteResponseDto[]> {
    const cpes = await this.repo.find({
      where: {
        sucursal: { sucursalId },
        fechaEmision: Between(fechaInicio, fechaFin),
      },
    });
    return cpes.map((c) => ComprobanteMapper.toDomain(c));
  }
  async getXmlFirmado(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null> {
    return null
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
    return null
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
    return null
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
    return null
  }
  async update(
    comprobanteId: number,
    sucursalId: number,
    update: IUpdateComprobante,
  ): Promise<{ status: boolean; message: string }> {
    await this.repo.update(
      { comprobanteId, sucursal: {sucursalId} },
      {
        estado: update.estado,
        descripcionEstado: update.descripcionEstado,
        fechaUpdate: update.fechaUpdate,
      },
    );
    await this.repoRespSnat.save(
      {
        comprobante: {comprobanteId},
        cdr: update.cdr ?? undefined ,
        xmlFirmado: update.xmlFirmado,
        hashCpe: update.hashCpe ?? "",
      },
    );
    return { status: true, message: 'Comprobante actualizado correctamente' };
  }

  async findByEstado(
    estado: EstadoEnumComprobante,
  ): Promise<ComprobanteResponseDto[]> {
    const cpes = await this.repo.find({ where: { estado } });
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
    const qb = this.repo.createQueryBuilder('c');
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
    const data = await this.repo.find({
      where: {
        sucursal: { sucursalId },
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
    const fecha = new Date(fechaResumen);
    const inicioDelDia = new Date(fecha);
    inicioDelDia.setHours(0, 0, 0, 0);
    const finDelDia = new Date(fecha);
    finDelDia.setHours(23, 59, 59, 999);

    const rsp = await this.repo.find({
      where: {
        sucursal: { sucursalId },
        serie: {serieId},
        fechaEmision: Between(inicioDelDia, finDelDia),
        comunicadoSunat: EstadoComunicacionEnvioSunat.NO_ENVIADO,
        estado: In(estados),
      },
      relations: ['cliente', 'serie'],
    });
    return rsp.map(ComprobanteMapper.toDomain);
  }

  async updateBoletaStatus(
    sucursalId: number,
    boletasIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: EstadoComunicacionEnvioSunat,
  ) {
    await this.repo
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
    await this.repo
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
    const result = await this.repo.update(
      {
        sucursal: { sucursalId },
        serie: {serieId},
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
}
