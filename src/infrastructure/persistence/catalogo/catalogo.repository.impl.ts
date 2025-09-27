import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CatalogoDetalleOrmEnity } from './CatalogoDetalleOrmEnity';
import { CatalogoDetalleMapper } from 'src/domain/mapper/CatalogoDetalleMapper';
import { ICatalogoRepository } from 'src/domain/catalogo/interface/catalogo.repository';
import { ResponseCatalogoTipoDTO } from 'src/domain/catalogo/dto/catalogo.response';
import { CatalogoTipoOrmEnity } from './CatalogoTipoOrmEnity';
import { CatalogoMapper } from 'src/domain/mapper/CatalogoMapper';
@Injectable()
export class CatalogoRepositoryImpl implements ICatalogoRepository {
  constructor(
    @InjectRepository(CatalogoTipoOrmEnity)
    private readonly catalogoRepo: Repository<CatalogoTipoOrmEnity>,
    @InjectRepository(CatalogoDetalleOrmEnity)
    private readonly detalleRepo: Repository<CatalogoDetalleOrmEnity>,
  ) {}
  save(
    empresa: any,
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
