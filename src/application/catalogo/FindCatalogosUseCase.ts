import { ResponseCatalogoTipoDTO } from 'src/domain/catalogo/dto/catalogo.response';
import { CatalogoRepositoryImpl } from 'src/infrastructure/persistence/catalogo/catalogo.repository.impl';

export class FindCatalogosUseCase {
  constructor(private readonly catalogoRepo: CatalogoRepositoryImpl) {}

  async execute(codigoCatalogo: string[]): Promise<ResponseCatalogoTipoDTO[]> {
    return (await this.catalogoRepo.obtenertipoCatalogo(codigoCatalogo)) ?? [];
  }
}
