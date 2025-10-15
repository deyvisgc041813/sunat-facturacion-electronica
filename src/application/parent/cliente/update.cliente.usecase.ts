import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ClienteResponseDto } from 'src/domain/parent/cliente/dto/client.response.dto';
import { UpdateClienteDto } from 'src/domain/parent/cliente/dto/update.client.dto';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';

export class UpdateClientUseCase {
  constructor(private readonly service: ClienteService) {}

  async execute(
    data: UpdateClienteDto,
    clienteId: number,
    auth: IUserPayload,
  ): Promise<GenericResponse<ClienteResponseDto>> {
    return this.service.update(clienteId, auth, data);
  }
}
