import { ClienteResponseDto } from "src/domain/parent/cliente/dto/client.response.dto";
import { ClienteService } from "src/domain/parent/cliente/service/cliente.service";

export class GetByNumDocClientUseCase {
  constructor(private readonly service: ClienteService) {}

  async execute(empresaId: number, numDoc: string): Promise<ClienteResponseDto | null> {
    return this.service.getByNumDocumento(empresaId, numDoc)
  }
}
