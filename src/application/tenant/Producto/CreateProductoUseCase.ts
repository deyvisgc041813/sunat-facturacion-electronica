import { BusinessLogicException } from "src/adapter/web/exception/exeception-dynamic";
import { CreateProductoDto } from "src/domain/tenant/inventario/producto/dto/create.product.dto";
import { ProductoResponseDto } from "src/domain/tenant/inventario/producto/dto/producto.response.dto";
import { ProductoRepository } from "src/domain/tenant/inventario/producto/port/producto.repository.port";
import { CatalogoRepositoryImpl } from "src/infrastructure/persistence/parent/implement/catalogo.repository.impl";
import { TipoCatalogoEnum } from "src/util/catalogo.enum";

export class CreateProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository,
     private readonly catalogoRepo: CatalogoRepositoryImpl) {}

  async execute(data: CreateProductoDto): Promise<{status: boolean, message: string, data?: ProductoResponseDto}> {
  const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(TipoCatalogoEnum.UNIDAD_MEDIDA, data.unidadMedida)
  if (!existCatalogo) {
    throw new BusinessLogicException(
      `El tipo de unidad de medida ${data.unidadMedida} no se encuentra en los catalogos de sunat`,
    );
  }
  return this.productoRepo.save(data);
  }
}
