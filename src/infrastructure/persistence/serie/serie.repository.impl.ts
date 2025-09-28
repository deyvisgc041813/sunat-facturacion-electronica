import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SerieRepository } from 'src/domain/series/Serie.repository';
import { CreateSerieDto } from 'src/domain/series/dto/CreateSerieDto';
import { SerieResponseDto } from 'src/domain/series/dto/SerieResponseDto';
import { UpdateSerieDto } from 'src/domain/series/dto/UpdateSerieDto';
import { SerieAuditoriaOrmEntity } from '../serie-log/SerieAuditoriaOrmEntity';
import { CreateSerieAuditoriaDto } from 'src/domain/series-auditoria/dto/CreateSerieAuditoriaDto';
import { SerieMapper } from 'src/domain/mapper/SerieMapper';
import { SerieOrmEntity } from './SerieOrmEntity';

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

  async findAll(sucursalId: number): Promise<SerieResponseDto[]> {
    const result = await this.repo.find({
      where: { sucursal: { sucursalId } },
      relations: ['sucursal'],
    });
    return result.map((s) => SerieMapper.toDomain(s));
  }

  async findById(
    sucursalId: number,
    id: number,
  ): Promise<SerieResponseDto | null> {
    const serie = await this.repo.findOne({
      where: { serieId: id, sucursal: { sucursalId } },
      relations: ['sucursal'],
    });
    if (!serie) {
      throw new NotFoundException(`Serie con id ${id} no encontrado`);
    }
    return SerieMapper.toDomain(serie);
  }
  async update(
    sucursalId: number,
    serie: UpdateSerieDto,
    serieId: number,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {
    serie.serieId = serieId;
    serie.sucursalId = sucursalId;
    await this.repo.save(SerieMapper.dtoToOrmUpdate(serie));
    return {
      status: true,
      message: 'Actualizado correctamente',
    };
  }
  async findBySucursalTipCompSerie(
    sucursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<SerieResponseDto | null> {
    const rsp = await this.repo.findOne({
      where: { sucursal: { sucursalId }, tipoComprobante, serie },
    });
    if (!rsp) {
      throw new NotFoundException(`Serie no encontrado`);
    }
    return SerieMapper.toDomain(rsp);
  }

  async updateCorrelativoAndLog(
    sucursalId: number,
    serieId: number,
    usuarioId: number,
    newCorrelativo: number,
    motivo: string,
  ): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {
    try {
      const serieOrm = await this.repo.findOne({ where: { serieId, sucursal: {sucursalId} }, relations: ['sucursal'] });
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
      console.error('Error en updateCorrelativoAndLog:', error);
      return {
        status: false,
        message: 'Ocurrió un error al actualizar el correlativo',
      };
    }
  }
  async actualizarCorrelativo(
    sucursalId: number,
    serieId: number,
    newCorrelativo: number,
  ): Promise<void> {
    try {
      await this.repo.update(
        { serieId, sucursal: { sucursalId } }, // condición de búsqueda
        { correlativoActual: newCorrelativo, fechaActualizacion: new Date() }, // campos a actualizar
      );
    } catch (error) {
      throw error;
    }
  }

  async getNextCorrelativo(
    sucursalId: number,
    tipoComprobante: string,
    serie: string,
  ): Promise<{ correlativo: number; serieId: number }> {
    try {
      const rsp = await this.repo.findOne({
        where: { sucursal: { sucursalId }, tipoComprobante, serie },
      });
      if (!rsp) {
        throw new BadRequestException(`No se encontró la serie con ID ${rsp}`);
      }
      const newCorrelativo =
        (rsp.correlativoActual ?? rsp.correlativoInicial ?? 0) + 1;
      return { correlativo: newCorrelativo, serieId: rsp.serieId };
    } catch (error) {
      throw error;
    }
  }
}
