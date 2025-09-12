
import { BadRequestException } from "@nestjs/common";
import { CreateProductoDto } from "src/domain/productos/dto/CreateProductoDto";
import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";
import { ProductoRepository } from "src/domain/productos/Producto.repository";
import { CatalogoEnum } from "src/util/CatalogoEnum";
import { CatalogoRepositoryImpl } from "src/infrastructure/database/repository/catalogo.repository.impl";

export class CreateProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository, private readonly catalogoRepo: CatalogoRepositoryImpl) {}

  async execute(data: CreateProductoDto): Promise<{status: boolean, message: string, data?: ProductoResponseDto}> {
  const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(CatalogoEnum.UNIDAD_MEDIDA, data.unidadMedida)
  if (!existCatalogo) {
    throw new BadRequestException(
      `El tipo de unidad de medida ${data.unidadMedida} no se encuentra en los catalogos de sunat`,
    );
  }
  return this.productoRepo.save(data);
  }
}
