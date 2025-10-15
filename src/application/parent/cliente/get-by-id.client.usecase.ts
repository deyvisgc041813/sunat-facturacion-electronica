import { ClienteResponseDto } from "src/domain/parent/cliente/dto/client.response.dto";
import { ClienteService } from "src/domain/parent/cliente/service/cliente.service";

export class GetByIdClientUseCase {
  constructor(private readonly service: ClienteService) {}

  async execute(empresaId: number, clienteId: number): Promise<ClienteResponseDto | null> {
    return this.service.getById(empresaId, clienteId)
  }
}
