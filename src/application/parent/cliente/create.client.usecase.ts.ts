
import { CreateClienteDto } from 'src/domain/parent/cliente/dto/create.client.dto';
import { ClienteResponseDto } from 'src/domain/parent/cliente/dto/client.response.dto';
import { GenericResponse } from "src/adapter/web/response/response.interface";
import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { ClienteService } from 'src/domain/parent/cliente/service/cliente.service';
export class CreateClientUseCase {
  constructor(private readonly service: ClienteService) {}
  async execute(cliente: CreateClienteDto, auth: IUserPayload): Promise<GenericResponse<ClienteResponseDto>> {
    return this.service.create(cliente, auth)
  }


}
