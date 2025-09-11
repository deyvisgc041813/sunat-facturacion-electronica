import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductoResponseDto } from "src/domain/productos/dto/ProductoResponseDto";
import { UpdateProductoDto } from "src/domain/productos/dto/UpdateProductoDto";
import { ProductoRepository } from "src/domain/productos/Producto.repository";
import { CatalogoEnum } from "src/domain/util/CatalogoEnum";
import { CatalogoRepositoryImpl } from "src/infrastructure/database/repository/catalogo.repository.impl";

export class UpdateProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository, private readonly catalogoRepo: CatalogoRepositoryImpl) {}
  async execute(data: UpdateProductoDto, productId: number): Promise<{status: boolean, message: string, data?: ProductoResponseDto}> {
    const producto = await this.productoRepo.findById(productId);
    if (!producto) throw new NotFoundException('Producto no encontrado');
    const tipoUnidadMedida = data.unidadMedida ?? ""
    const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(CatalogoEnum.UNIDAD_MEDIDA, tipoUnidadMedida)
    if (!existCatalogo) {
        throw new BadRequestException(
          `El tipo de unidad de medida ${data.unidadMedida} no se encuentra en los catalogos de sunat`,
        );
    }
    return this.productoRepo.update(data, productId);
  }
}
