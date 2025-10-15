import { CatalogoDetalleMapper } from "src/domain/mapper/catalogo-detalle.mapper";
import { ResponseCatalogoTipoDTO } from "../dto/catalogo.response";

export interface ICatalogoRepositoryPort {
  save(catalogo: any): Promise<{status: boolean, message: string, data?: any}>;
  obtenerDetallePorCatalogo(
    codigoCatalogo: string, 
    codigoDetalle: string
  ): Promise<CatalogoDetalleMapper | null>
  obtenertipoCatalogo (codCatalogos: string[]): Promise<ResponseCatalogoTipoDTO[] | null>
  
}
