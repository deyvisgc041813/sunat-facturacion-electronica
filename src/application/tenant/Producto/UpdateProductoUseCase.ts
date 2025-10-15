import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductoResponseDto } from "src/domain/tenant/inventario/producto/dto/producto.response.dto";
import { UpdateProductoDto } from "src/domain/tenant/inventario/producto/dto/update.product.dto";
import { ProductoRepository } from "src/domain/tenant/inventario/producto/port/producto.repository.port";
import { CatalogoRepositoryImpl } from "src/infrastructure/persistence/parent/implement/catalogo.repository.impl";
import { TipoCatalogoEnum } from "src/util/catalogo.enum";

export class UpdateProductoUseCase {
  constructor(private readonly productoRepo: ProductoRepository, private readonly catalogoRepo: CatalogoRepositoryImpl) {}
  async execute(sucursalId:number, data: UpdateProductoDto, productId: number): Promise<{status: boolean, message: string, data?: ProductoResponseDto}> {
    const producto = await this.productoRepo.findById(sucursalId, productId);
    if (!producto) throw new NotFoundException('Producto no encontrado');
    const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(TipoCatalogoEnum.UNIDAD_MEDIDA, data.unidadMedida ?? "")
    if (!existCatalogo) {
        throw new BadRequestException(
          `El tipo de unidad de medida ${data.unidadMedida} no se encuentra en los catalogos de sunat`,
        );
    }
    return this.productoRepo.update(data, productId);
  }
}
