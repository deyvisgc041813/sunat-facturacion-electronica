import { TributoTasaResponseDto } from './dto/TributoTasaResponseDto';
import { CreateTributoTasaDto } from './dto/CreateTributoTasaDto';

export interface TributoTasaRepository {
  /**
   * Crea un nuevo comprobante en estado PENDIENTE.
   */
  save(data: CreateTributoTasaDto): Promise<{
    status: boolean;
    message: string;
    data?: TributoTasaResponseDto;
  }>;
  findAll(empresaId: number): Promise<TributoTasaResponseDto[]>;
  findByCodigoSunat(
    codigoSunat: string
  ): Promise<TributoTasaResponseDto | null>;
}
