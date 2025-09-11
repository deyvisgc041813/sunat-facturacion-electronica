
import { ClienteRepository } from "src/domain/cliente/Cliente.repository";
import { ClienteResponseDto } from "src/domain/cliente/dto/ClienteResponseDto";


export class FindByIdClienteUseCase {
  constructor(private readonly clienteRepo: ClienteRepository) {}

  async execute(id: number): Promise<ClienteResponseDto | null> {
    return this.clienteRepo.findById(id);
  }
}
