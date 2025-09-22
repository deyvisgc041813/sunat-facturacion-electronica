import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, In, Not, Repository } from 'typeorm';
import { ComprobanteOrmEntity } from './ComprobanteOrmEntity';

import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { ComprobanteMapper } from 'src/domain/mapper/comprobante.maper';
import { IUpdateComprobante } from 'src/domain/comprobante/interface/update.interface';
import {
  ArchivoDescargable,
  ConprobanteRepository,
} from 'src/domain/comprobante/comprobante.repository';
import { EstadoComunicacionEnvioSunat, EstadoEnumComprobante } from 'src/util/estado.enum';
import { DataSource } from 'typeorm';
import { ICreateComprobante } from 'src/domain/comprobante/interface/create.interface';
import { IResponsePs } from 'src/domain/comprobante/interface/response.ps.interface';
import { TipoComprobanteEnum } from 'src/util/catalogo.enum';
import dayjs from 'dayjs';
@Injectable()
export class ComprobanteRepositoryImpl implements ConprobanteRepository {
  constructor(
    @InjectRepository(ComprobanteOrmEntity)
    private readonly repo: Repository<ComprobanteOrmEntity>,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async save(
    dto: ICreateComprobante,
    payloadJson: any,
  ): Promise<{ status: boolean; message: string; response?: IResponsePs }> {
    const [rows] = await this.dataSource.query(
      `CALL sp_guardar_comprobante(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dto.empresaId,
        dto.tipoComprobante,
        dto.serie,
        dto.fechaEmision,
        dto.moneda,
        dto.totalGravado,
        dto.totalExonerado,
        dto.totalInafecto,
        dto.totalIgv,
        dto.mtoImpVenta,
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

  async findAll(empresaId: number): Promise<ComprobanteResponseDto[]> {
    const result = await this.repo.find({
      where: { empresaId },
      relations: ['empresa', 'cliente', 'serie'],
    });
    return result.map((c) => ComprobanteMapper.toDomain(c));
  }

  async findById(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ComprobanteResponseDto | null> {
    const comprobante = await this.repo.findOne({
      where: { comprobanteId, empresaId },
      relations: ['empresa', 'cliente', 'serie'],
    });
    if (!comprobante) {
      throw new NotFoundException(
        `Comprobante con id ${comprobanteId} no encontrado`,
      );
    }
    return ComprobanteMapper.toDomain(comprobante);
  }
  async getXmlFirmado(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null> {
    const cpe = await this.repo.findOne({
      where: { comprobanteId, empresaId },
    });
    if (!cpe?.xmlFirmado) {
      throw new NotFoundException(
        `No se encontró el archivo XML del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
      );
    }

    return {
      fileName: `${cpe.hashCpe || 'comprobante'}-${cpe.comprobanteId}.xml`,
      mimeType: 'application/xml',
      content: Buffer.from(cpe.xmlFirmado, 'utf-8'),
    };
  }
  async getZipEnviado(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null> {
    const cpe = await this.repo.findOne({
      where: { comprobanteId, empresaId },
    });
    if (!cpe?.xmlFirmado) {
      throw new NotFoundException(
        `No se encontró el archivo zip del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
      );
    }
    // genera un ZIP con el XML firmado
    return {
      fileName: `${cpe.hashCpe || 'comprobante'}-${cpe.comprobanteId}.zip`,
      mimeType: 'application/zip',
      content: Buffer.from(cpe.xmlFirmado, 'utf-8'), // TODO: reemplazar con zip real
    };
  }
  async getCdrZip(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ArchivoDescargable | null> {
    const cpe = await this.repo.findOne({
      where: { comprobanteId, empresaId },
    });

    if (!cpe?.cdr) {
      throw new NotFoundException(
        `No se encontró el archivo cdr del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
      );
    }

    return {
      fileName: `R-${cpe.hashCpe || 'comprobante'}-${cpe.comprobanteId}.zip`,
      mimeType: 'application/zip',
      content: Buffer.from(cpe.cdr, 'base64'), // 👈 convertir de string Base64 a Buffer
    };
  }

  async getHashCpe(
    comprobanteId: number,
    empresaId: number,
  ): Promise<string | null> {
    const cpe = await this.repo.findOne({
      where: { comprobanteId, empresaId },
      select: ['hashCpe'],
    });
    if (!cpe?.cdr) {
      throw new NotFoundException(
        `No se encontró el hash cpe del comprobante ${comprobanteId} para la empresa ${empresaId}.`,
      );
    }
    return cpe?.hashCpe;
  }
  async update(
    comprobanteId: number,
    empresaId: number,
    update: IUpdateComprobante,
  ): Promise<{ status: boolean; message: string }> {
    await this.repo.update(
      { comprobanteId, empresaId },
      ComprobanteMapper.dtoToOrmUpdate(update),
    );
    return { status: true, message: 'Comprobante actualizado correctamente' };
  }
  async findByEstado(
    estado: EstadoEnumComprobante,
  ): Promise<ComprobanteResponseDto[]> {
    const cpes = await this.repo.find({ where: { estado } });
    return cpes.map((c) => ComprobanteMapper.toDomain(c));
  }
  async findByEmpAndSerieAndNumCorreAceptado(
    empresaId: number,
    numCorrelativo: number,
    serieId: number,
  ): Promise<ComprobanteResponseDto | null> {
    const comprobante = await this.repo.findOne({
      where: {
        empresaId,
        numeroComprobante: numCorrelativo,
        serieId,
        estado: EstadoEnumComprobante.ACEPTADO,
      },
      relations: ['cliente', 'serie'],
    });
    if (!comprobante) return null;
    return ComprobanteMapper.toDomain(comprobante);
  }
  async findByEmpresaAndFecha(
    empresaId: number,
    fechaInicio: Date,
    fechaFin: Date,
  ): Promise<ComprobanteResponseDto[]> {
    const cpes = await this.repo.find({
      where: {
        empresaId,
        fechaEmision: Between(fechaInicio, fechaFin),
      },
    });
    return cpes.map((c) => ComprobanteMapper.toDomain(c));
  }
  // async anularComprobante(
  //   empresaId: number,
  //   serieId: number,
  //   numCorrelativo: number,
  //   desAnulacion: string,
  // ): Promise<boolean> {

  // }
  async updateComprobanteStatus(
    empresaId: number,
    serieId: number,
    numCorrelativo: number,
    desAnulacion: string,
    estado: EstadoEnumComprobante,
  ): Promise<boolean> {
    const result = await this.repo.update(
      {
        empresaId,
        serieId,
        numeroComprobante: numCorrelativo,
        estado: Not(estado),
      },
      {
        estado: estado,
        descripcionEstado: desAnulacion,
        fechaAnulacion:
          estado === EstadoEnumComprobante.ANULADO ? dayjs().toDate() : null,
      },
    );
    if (result.affected && result.affected > 0) {
      return true;
    }
    return false;
  }

  async findComprobanteByReferencia(
    empresaId: number,
    tipoComprobante: string,
    motivos: string[],
    estado: string,
    serieRef: string,
    correlativoRef: number,
  ): Promise<ComprobanteResponseDto | null> {
    const qb = this.repo.createQueryBuilder('c');
    qb.where('c.empresa_id = :empresaId', { empresaId })
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

  async findBoletasForResumen(
    empresaId: number,
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
        empresaId,
        serieId,
        fechaEmision: Between(inicioDelDia, finDelDia),
        comunicadoSunat: EstadoComunicacionEnvioSunat.NO_ENVIADO,
        estado: In(estados),
      },
      relations: ['cliente', 'serie'],
    });
    return rsp.map(ComprobanteMapper.toDomain);
  }
  async actualizarEstadoBoletas(
    boletaIds: number[],
    nuevoEstado: EstadoEnumComprobante,
    comunicadoSunat: boolean,
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
        comunicadoSunat: () => `${comunicadoSunat ? EstadoComunicacionEnvioSunat.ENVIADO : EstadoComunicacionEnvioSunat.NO_ENVIADO}`,
      })
      .whereInIds(boletaIds)
      .execute();
  }
}
