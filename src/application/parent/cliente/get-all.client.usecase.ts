import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { ClienteResponseDto } from 'src/domain/parent/cliente/dto/client.response.dto';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';

export class GetAllClientUseCase {
  constructor(private readonly service: ClienteService) {}

  async execute(auth: IUserPayload): Promise<ClienteResponseDto[]> {
    return this.service.getAll(auth.empresaId ?? 0);
  }
}
