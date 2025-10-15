
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { ClienteService } from "src/domain/parent/cliente/service/cliente.service";
export class DeleteClientUseCase {
  constructor(private readonly service: ClienteService) {}
  async execute(clienteId:number, auth: IUserPayload): Promise<GenericResponse<void>> {
    return this.service.delete(clienteId, auth);
  }


}
