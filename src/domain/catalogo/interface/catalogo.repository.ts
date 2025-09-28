import { CatalogoDetalleMapper } from "src/domain/mapper/CatalogoDetalleMapper";
import { ResponseCatalogoTipoDTO } from "../dto/catalogo.response";

export interface ICatalogoRepository {
  save(catalogo: any): Promise<{status: boolean, message: string, data?: any}>;
  obtenerDetallePorCatalogo(
    codigoCatalogo: string, 
    codigoDetalle: string
  ): Promise<CatalogoDetalleMapper | null>
  obtenertipoCatalogo (codCatalogos: string[]): Promise<ResponseCatalogoTipoDTO[] | null>
  
}
