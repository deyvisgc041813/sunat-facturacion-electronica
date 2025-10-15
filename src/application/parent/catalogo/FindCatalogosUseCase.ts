import { Injectable } from '@nestjs/common';
import { ResponseCatalogoTipoDTO } from 'src/domain/parent/catalogo/dto/catalogo.response';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/catalogo.repository.impl';
@Injectable()
export class FindCatalogosUseCase {
  constructor(private readonly catalogoRepo: CatalogoRepositoryImpl) {}

  async execute(codigoCatalogo: string[]): Promise<ResponseCatalogoTipoDTO[]> {
    return (await this.catalogoRepo.obtenertipoCatalogo(codigoCatalogo)) ?? [];
  }
}
