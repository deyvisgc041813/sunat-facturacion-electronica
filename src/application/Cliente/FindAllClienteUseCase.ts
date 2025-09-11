
import { ClienteRepository } from "src/domain/cliente/Cliente.repository";
import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";


export class FindAllClienteUseCase {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(): Promise<ClienteResponseDto[]> {
    return this.clienteRepo.findAll();
  }
}
