import { TributoTasaResponseDto } from '../dto/response.tributo-tasa.dto';
import { CreateTributoTasaDto } from '../dto/create.tributo-tasa.dto';

export interface ITributoTasaRepositoryPort {
  save(data: CreateTributoTasaDto): Promise<{
    status: boolean;
    message: string;
    data?: TributoTasaResponseDto;
  }>;
  findAll(tasaId: number): Promise<TributoTasaResponseDto[]>;
  findByCodigoSunat(
    codigoSunat: string
  ): Promise<TributoTasaResponseDto | null>;
  findByCodigosSunat(
    codigosSunat: string[]
  ): Promise<TributoTasaResponseDto[] | null>
}
