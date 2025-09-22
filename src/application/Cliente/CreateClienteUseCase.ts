
import { BadRequestException } from "@nestjs/common";
import { ClienteRepository } from "src/domain/cliente/Cliente.repository";
import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";
import { CreateClienteDto } from "src/domain/cliente/dto/CreateRequestDto";
import { CatalogoRepositoryImpl } from "src/infrastructure/persistence/catalogo/catalogo.repository.impl";
import { TipoCatalogoEnum } from "src/util/catalogo.enum";
import { validarDatosSegunTipoDocumento } from "src/util/Helpers";
export class CreateClienteUseCase {
  constructor(private readonly clienteRepo: ClienteRepository, private readonly catalogoRepo: CatalogoRepositoryImpl) {}
  async execute(cliente: CreateClienteDto): Promise<{status: boolean, message: string, data?: ClienteResponseDto}> {
    const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(TipoCatalogoEnum.DOCUMENTO_IDENTIDAD, cliente.tipoDocumento)
    if (!existCatalogo) {
      throw new BadRequestException(
        `El tipo documento ${cliente.tipoDocumento} no se encuentra en los catalogos de sunat`,
      );
    }
    const existe = await this.clienteRepo.findByDocumento( cliente.empresaId,  cliente.numeroDocumento);
    if (existe) {
      throw new BadRequestException(
        `El cliente con documento ${cliente.numeroDocumento} ya está registrado para esta empresa`,
      );
    }
    validarDatosSegunTipoDocumento(cliente)
    return this.clienteRepo.save(cliente);
  }


}
