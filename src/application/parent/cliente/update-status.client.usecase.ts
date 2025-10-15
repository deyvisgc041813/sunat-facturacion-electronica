import { IUserPayload } from 'src/adapter/decorator/user.decorator.interface';
import { GenericResponse } from 'src/adapter/web/response/response.interface';
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';
export class UpdateStatusClientUseCase {
  constructor(private readonly clienteService: ClienteService) {}
  async execute(
    clienteId: number,
    newEstado: string,
    auth: IUserPayload,
  ): Promise<GenericResponse<void>> {
    return this.clienteService.activateOrDeactivate(clienteId, newEstado, auth);
  }
}
