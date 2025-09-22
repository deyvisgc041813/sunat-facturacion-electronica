
import { Injectable } from "@nestjs/common";
import { TributoTasaResponseDto } from "src/domain/tributo-tasa/dto/TributoTasaResponseDto";
import { TributoTasaRepositoryImpl } from "src/infrastructure/persistence/tasa-tributo/tasa-tributo.repository.impl";
@Injectable()
export class FindTasaByCodeUseCase {
  constructor(private readonly tasaRepo: TributoTasaRepositoryImpl) {}

  async execute(codigoSunat: string): Promise<TributoTasaResponseDto | null> {
    return this.tasaRepo.findByCodigoSunat(codigoSunat);
  }
}
