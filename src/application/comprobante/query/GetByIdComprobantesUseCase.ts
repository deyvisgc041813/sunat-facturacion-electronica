import { NotFoundException } from '@nestjs/common';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { ComprobanteResponseDto } from 'src/domain/comprobante/dto/ConprobanteResponseDto';

export class GetByIdComprobantesUseCase {
  constructor(private readonly comprobante: ConprobanteRepository) {}

  async execute(
    comprobanteId: number,
    empresaId: number,
  ): Promise<ComprobanteResponseDto | null> {
    const rpta = await this.comprobante.findByEmpresaAndId(empresaId, [ comprobanteId ]);
    if (!rpta || rpta.length === 0) {
      throw new NotFoundException(
        `Comprobante con id ${comprobanteId} no encontrado para la empresa ${empresaId}`,
      );
    }
    return rpta[0];
  }
}
