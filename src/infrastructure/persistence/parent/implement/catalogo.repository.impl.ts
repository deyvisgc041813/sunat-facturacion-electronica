import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CatalogoDetalleOrmEnity } from '../entity/catalogo/catalogo-detalle.orm.entity';
import { CatalogoDetalleMapper } from 'src/domain/mapper/catalogo-detalle.mapper';
import { CatalogoTipoOrmEnity } from '../entity/catalogo/catalogo-tipo.orm.entity';
import { CatalogoMapper } from 'src/domain/mapper/catalogo.mapper';
import { ICatalogoRepositoryPort } from 'src/domain/parent/catalogo/port/catalogo.repository.port';
import { ResponseCatalogoTipoDTO } from 'src/domain/parent/catalogo/dto/catalogo.response';
@Injectable()
export class CatalogoRepositoryImpl implements ICatalogoRepositoryPort {
  constructor(
    @InjectRepository(CatalogoTipoOrmEnity)
    private readonly catalogoRepo: Repository<CatalogoTipoOrmEnity>,
    @InjectRepository(CatalogoDetalleOrmEnity)
    private readonly detalleRepo: Repository<CatalogoDetalleOrmEnity>,
  ) {}
  save(
    catalogo: any,
  ): Promise<{ status: boolean; message: string; data?: any }> {
    throw new Error('Method not implemented.');
  }

  async obtenerDetallePorCatalogo(
    codigoCatalogo: string,
    codigoDetalle: string,
  ): Promise<CatalogoDetalleMapper | null> {
    const detalle = await this.detalleRepo.findOne({
      where: {
        codigo: codigoDetalle,
        catalogo: { codigoCatalogo },
      },
      relations: ['catalogo'],
    });

    if (!detalle) return null;

    return CatalogoDetalleMapper.toDomain(detalle);
  }

  async obtenertipoCatalogo(
    codCatalogos: string[],
  ): Promise<ResponseCatalogoTipoDTO[] | null> {
    const catalogo = await this.catalogoRepo.find({
      where: {
        codigoCatalogo: In(codCatalogos),
      },
      relations: ['detalles'], // para traer el join
    });

    if (!catalogo) return null;
    return catalogo.map((catalogo) => CatalogoMapper.toDomain(catalogo));
  }
}
