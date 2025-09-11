import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CatalogoDetalleOrmEnity } from '../entity/CatalogoDetalleOrmEnity';
import { CatalogoTipoOrmEnity } from '../entity/CatalogoTipoOrmEnity';
@Injectable()
export class CatalogoRepositoryImpl {
  constructor(
    @InjectRepository(CatalogoDetalleOrmEnity)
    private readonly detalleRepo: Repository<CatalogoDetalleOrmEnity>,
    @InjectRepository(CatalogoTipoOrmEnity)
    private readonly tipoRepo: Repository<CatalogoTipoOrmEnity>,
  ) {}

  // async obtenerCatalogoPorTipo(codigoCatalogo: string): Promise<CatalogoTipoOrmEnity| null> {
  //   const tipo = await this.tipoRepo.findOne({ where: { codigoCatalogo } });
  //   if (!tipo) return null;
  //   return tipo;
  // }
async obtenerDetallePorCatalogo(codigoCatalogo: string, codigoDetalle: string) {
  return this.detalleRepo.findOne({
    where: {
      codigo: codigoDetalle, // campo del detalle
      catalogo: { codigoCatalogo }, // nested relation hacia CatalogoTipo
    },
    relations: ['catalogo'], // para traer el join
  });
}


}
