import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClienteMapper } from 'src/infrastructure/mapper/ClienteMapper';
import { SerieRepository } from 'src/domain/series/Serie.repository';
import { CreateSerieDto } from 'src/domain/series/dto/CreateSerieDto';
import { SerieResponseDto } from 'src/domain/series/dto/SerieResponseDto';
import { SerieOrmEntity } from '../entity/SerieOrmEntity';
import { SerieMapper } from 'src/infrastructure/mapper/SerieMapper';
import { UpdateSerieDto } from 'src/domain/series/dto/UpdateSerieDto';
import { SerieAuditoriaOrmEntity } from '../entity/SerieAuditoriaOrmEntity';
import { CreateSerieAuditoriaDto } from 'src/domain/series-auditoria/dto/CreateSerieAuditoriaDto';

@Injectable()
export class SerieRepositoryImpl implements SerieRepository {
  constructor(
    @InjectRepository(SerieOrmEntity)
    private readonly repo: Repository<SerieOrmEntity>,
    @InjectRepository(SerieAuditoriaOrmEntity)
    private readonly auditoriaRepo: Repository<SerieAuditoriaOrmEntity>,
  ) {}

  async save(
    serie: CreateSerieDto,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {
    await this.repo.save(serie);
    return {
      status: true,
      message: 'Serie registrado correctamente',
    };
  }

  async findAll(): Promise<SerieResponseDto[]> {
    const result = await this.repo.find({
      relations: ['empresa'],
    });
    return result.map((s) => SerieMapper.toDomain(s));
  }

  async findById(id: number): Promise<SerieResponseDto | null> {
    const serie = await this.repo.findOne({
      where: { serieId: id },
      relations: ['empresa'],
    });
    if (!serie) {
      throw new NotFoundException(`Serie con id ${id} no encontrado`);
    }
    return SerieMapper.toDomain(serie);
  }
  async update(
    serie: UpdateSerieDto,
    serieId: number,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {
    serie.serieId = serieId;
    await this.repo.save(SerieMapper.dtoToOrmUpdate(serie));

    return {
      status: true,
      message: 'Actualizado correctamente',
    };
  }
  async findByEmpresaAndTipCompAndSerie(
    empresaId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<SerieResponseDto | null> {
    console.log('empresaId ', empresaId);
    console.log('tipoComprobante ', tipoComprobante);
    console.log('serie ', serie);
    const rsp = await this.repo.findOne({
      where: { empresaId, tipoComprobante, serie },
    });
    if (!rsp) {
      throw new NotFoundException(`Serie no encontrado`);
    }
    return SerieMapper.toDomain(rsp);
  }

  async actualizarCorrelativo(
    serieId: number,
    usuarioId: number,
    newCorrelativo: number,
    motivo: string,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {
    try {
      const serieOrm = await this.repo.findOne({ where: { serieId } });
      if (!serieOrm) {
        return {
          status: false,
          message: `No se encontró la serie con ID ${serieId}`,
        };
      }
      const auditoria = new CreateSerieAuditoriaDto();
      auditoria.serieId = serieId;
      auditoria.usuarioId = usuarioId;
      auditoria.correlativoAnterior = serieOrm.correlativoInicial ?? 0;
      auditoria.correlativoNuevo = newCorrelativo;
      auditoria.motivo = motivo;
      serieOrm.correlativoInicial = newCorrelativo;

      const updatedSerie = await this.repo.save(serieOrm);
      await this.auditoriaRepo.save(auditoria);
      const serieDto = SerieMapper.toDomain(updatedSerie);
      return {
        status: true,
        message: 'Correlativo actualizado correctamente',
        data: serieDto,
      };
    } catch (error) {
      console.error('Error en actualizarCorrelativo:', error);
      return {
        status: false,
        message: 'Ocurrió un error al actualizar el correlativo',
      };
    }
  }
}
