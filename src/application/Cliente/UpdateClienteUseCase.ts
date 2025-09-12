import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ClienteRepository } from "src/domain/cliente/Cliente.repository";
import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";
import { UpdateClienteDto } from "src/domain/cliente/dto/UpdateClienteDto";
import { CatalogoEnum } from "src/util/CatalogoEnum";
import { validarDatosSegunTipoDocumento } from "src/util/Helpers";
import { CatalogoRepositoryImpl } from "src/infrastructure/database/repository/catalogo.repository.impl";

export class UpdateClienteUseCase {
  constructor(private readonly clienteRepo: ClienteRepository, private readonly catalogoRepo: CatalogoRepositoryImpl) {}

  async execute(data: UpdateClienteDto, clienteId: number): Promise<{status: boolean, message: string, data?: ClienteResponseDto}> {
    const cliente = await this.clienteRepo.findById(clienteId);
    if (!cliente) throw new NotFoundException('Cliente no encontrado');
   // 1. Validar tipo de documento contra catálogo SUNAT
    const existCatalogo = await this.catalogoRepo.obtenerDetallePorCatalogo(CatalogoEnum.DOCUMENTO_IDENTIDAD, cliente.tipoDocumento);
    if (!existCatalogo) {
      throw new BadRequestException(
        `El tipo documento ${cliente.tipoDocumento} no se encuentra en los catálogos de SUNAT`,
      );
    }
    // 2. Validar que no haya otro cliente con el mismo documento en la misma empresa
    const empresaId = cliente.empresa?.empresaId ?? 0
    const existe = await this.clienteRepo.findByDocumento(empresaId, cliente.numeroDocumento);
    if (existe && existe.clienteId !== clienteId) {
      throw new BadRequestException(`El cliente con documento ${cliente.numeroDocumento} ya está registrado para esta empresa`);
    }
    validarDatosSegunTipoDocumento(data)
    return this.clienteRepo.update(data, clienteId);
  }
}
