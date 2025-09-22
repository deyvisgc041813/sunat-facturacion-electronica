import { BadRequestException } from '@nestjs/common';
import { CreateSerieDto } from 'src/domain/series/dto/CreateSerieDto';
import { SerieResponseDto } from 'src/domain/series/dto/SerieResponseDto';
import { SerieRepository } from 'src/domain/series/Serie.repository';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';
import { TipoCatalogoEnum } from 'src/util/catalogo.enum';
export class CreateSerieUseCase {
  constructor(private readonly serieRepo: SerieRepository, private readonly catalogoRepo: CatalogoRepositoryImpl) {}
  async execute( data: CreateSerieDto): Promise<{ status: boolean; message: string; data?: SerieResponseDto }> {  
   data.correlativoInicial = data.correlativoInicial ?? 1;
    const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(TipoCatalogoEnum.TIPO_COMPROBANTE, data.tipoComprobante)
     if (!existCatalogo) {
       throw new BadRequestException(
         `El tipo de comprobante ${data.tipoComprobante} no se encuentra en los catalogos de sunat`,
       );
     }
    return this.serieRepo.save(data);
  }

}
