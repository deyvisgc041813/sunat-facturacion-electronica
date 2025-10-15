import { CreateTributoTasaDto } from 'src/domain/parent/tributo-tasa/dto/create.tributo-tasa.dto';
import { TributoTasaResponseDto } from 'src/domain/parent/tributo-tasa/dto/response.tributo-tasa.dto';
import { ITributoTasaRepositoryPort } from 'src/domain/parent/tributo-tasa/port/tasa-tributo.repository.port';

export class CreateTasaUseCase {
  constructor(private readonly tasaRepo: ITributoTasaRepositoryPort) {}
  async execute( data: CreateTributoTasaDto): Promise<{ status: boolean; message: string; data?: TributoTasaResponseDto }> {  
    return this.tasaRepo.save(data);
  }

}
