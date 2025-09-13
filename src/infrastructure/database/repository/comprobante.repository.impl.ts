import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { ComprobanteOrmEntity } from '../entity/ComprobanteOrmEntity';
import { CreateComprobanteDto } from 'src/domain/comprobante/dto/CreateComprobanteDto';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';
import { ComprobanteMapper } from 'src/infrastructure/mapper/comprobante.maper';
import { IUpdateComprobante } from 'src/domain/comprobante/interface/update.interface';
import {
  ArchivoDescargable,
  ConprobanteRepository,
} from 'src/domain/comprobante/comprobante.repository';
import { EstadoEnumComprobante } from 'src/util/estado.enum';

@Injectable()
export class ComprobanteRepositoryImpl implements ConprobanteRepository {
  constructor(
    @InjectRepository(ComprobanteOrmEntity)
    private readonly repo: Repository<ComprobanteOrmEntity>,
  ) {}

  async save(
    comprobante: CreateComprobanteDto,
  ): Promise<{ status: boolean; message: string; comprobanteId?: number }> {
    const resp = await this.repo.save(
      ComprobanteMapper.dtoToOrmCreate(comprobante),
    );
    return {
      status: true,
      message: 'Comprobante registrado correctamente',
      comprobanteId: ComprobanteMapper.toDomain(resp).comprobanteId,
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
      content: cpe.cdr,
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
    await this.repo.update({ comprobanteId, empresaId }, ComprobanteMapper.dtoToOrmUpdate(update));
    return { status: true, message: 'Comprobante actualizado correctamente' };
  }
  async findByEstado(estado: EstadoEnumComprobante): Promise<ComprobanteResponseDto[]> {
    const cpes = await this.repo.find({ where: { estado } });
    return cpes.map((c) => ComprobanteMapper.toDomain(c));
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
 async anularComprobante(
    empresaId: number,
    id: number,
    motivo: string,
  ): Promise<{ status: boolean; message: string }> {
        await this.repo.update(
      { comprobanteId: id, empresaId },
      { estado: EstadoEnumComprobante.ANULADO, motivoEstado: motivo }
    );
    return { status: true, message: 'Comprobante anulado correctamente' };
  }
}
