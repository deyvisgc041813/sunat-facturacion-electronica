import { Injectable } from '@nestjs/common';
import { TributoTasaRepositoryImpl } from 'src/infrastructure/persistence/parent/implement/tasa-tributo.repository.impl';
@Injectable()
export class FindTasaByCodeUseCase {
  constructor(private readonly tasaRepo: TributoTasaRepositoryImpl) {}

  async execute(
    codigos: string[], // ejemplo: ['1000 => igv', 'TIM2025 => mora', 'ICBPER => 7152']
  ): Promise<Map<string, number>> {
    const tasas = (await this.tasaRepo.findByCodigosSunat(codigos)) ?? [];
    // Convertir el resultado a un Map para acceso rápido
    const tasaMap = new Map<string, number>();
    tasas.forEach((t) => {
      tasaMap.set(t.codigoSunat, t.tasa ?? 0);
    });

    return tasaMap;
  }
}
