import { IResumenRepository } from "src/domain/resumen/interface/resumen.repository.interface";

export class GetNextCorrelativoUseCase {
  constructor(private readonly resumenRepo: IResumenRepository) {}

  async execute(empresaId: number, fechaResumen: Date): Promise<{ correlativo: number; resumenId: string }> {
       // 1. Convertir fecha a YYYYMMDD
    const fechaString = fechaResumen.toISOString().split('T')[0]; // 2025-09-11
    const fechaCompacta = fechaString.replace(/-/g, '');          // 20250911
    const correlativo = await this.resumenRepo.getNextCorrelativo(empresaId);
        // 3. Armar resumenId como lo exige SUNAT
    const resumenId = `RC-${fechaCompacta}-${correlativo}`;
    return { correlativo, resumenId };
  }
}
