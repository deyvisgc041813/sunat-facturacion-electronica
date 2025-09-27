import { CreateTributoTasaDto } from 'src/domain/tributo-tasa/dto/CreateTributoTasaDto';
import { TributoTasaResponseDto } from 'src/domain/tributo-tasa/dto/TributoTasaResponseDto';
import { ITributoTasaRepository } from 'src/domain/tributo-tasa/tasa-tributo.repository';
export class CreateTasaUseCase {
  constructor(private readonly tasaRepo: ITributoTasaRepository) {}
  async execute( data: CreateTributoTasaDto): Promise<{ status: boolean; message: string; data?: TributoTasaResponseDto }> {  
    return this.tasaRepo.save(data);
  }

}
