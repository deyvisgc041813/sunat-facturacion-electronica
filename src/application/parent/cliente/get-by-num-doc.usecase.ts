import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
import { ClienteResponseDto } from 'src/domain/parent/cliente/dto/client.response.dto';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';

export class GetByNumDocClientUseCase {
  constructor(private readonly service: ClienteService) {}

  async execute(
    empresaId: number,
    numDoc: string,
  ): Promise<ClienteResponseDto | null> {
    const client = await this.service.getByNumDocumento(numDoc);
    if (!client) throw new BusinessLogicException('Cliente no encontrado.');
    return client;
  }
}
