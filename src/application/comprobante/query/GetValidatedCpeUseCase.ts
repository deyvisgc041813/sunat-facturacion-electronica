import { BadRequestException } from '@nestjs/common';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import {
  ConsultarLoteCpeDto,
  CpeDto,
} from 'src/domain/comprobante/dto/cpe/ConsultarLoteCpeDto';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import pLimit from 'p-limit';
export class CpeValidadoDto extends CpeDto {
  existe: boolean;
  mensaje: string;
}

export class GetValidatedCpeUseCase {
  constructor(
    private readonly sunatService: SunatService,
    private readonly comprobanteRepo: ConprobanteRepository,
  ) {  }

  async execute(data: ConsultarLoteCpeDto, sucursalId: number): Promise<any> {
    //IResponseSunat
    try {
      // 1 validacion de comprobantes
      const rspValidateComp = await this.validarYConsultar(data, sucursalId);
      const limit = pLimit(5); // máximo 5 consultas en paralelo

      const tareas = rspValidateComp.data.map((cpe) =>
        limit(async () => {
          if (!cpe.existe) {
            return {
              ...cpe,
              estado: '99',
              descripcion: 'No existe en el sistema, no se consultó SUNAT',
            };
          }
          const resultado = await this.sunatService.consultarCpe(cpe);
          return { ...cpe, ...resultado };
        }),
      );
      const resultados = await Promise.all(tareas);
      return resultados;
    } catch (error: any) {
      throw error;
    }
  }
  private async validarYConsultar(dto: ConsultarLoteCpeDto, sucursalId: number) {
    // 1. Validar que todos sean del mismo tipo
    const tipos = new Set(dto.cpes.map((c) => c.tipo));
    if (tipos.size > 1) {
      throw new BadRequestException(
        'Todos los comprobantes deben ser del mismo tipo (ej. solo facturas o solo boletas).',
      );
    }

    // 2. Armamos el array de serieNumero desde el DTO
    const seriesCorrelativos = dto.cpes.map((dt: CpeDto) => dt.serieNumero);

    // 3. Consultamos en la BD los comprobantes que existen
    const comprobantes =
      await this.comprobanteRepo.findBySerieCorrelativos(
        sucursalId,
        seriesCorrelativos,
      );

    // Pasamos a un Set para búsqueda rápida
    const existentesSet = new Set(comprobantes.map((c) => c.serieCorrelativo));

    // 4. Construimos el array final con estado
    const resultados: CpeValidadoDto[] = dto.cpes.map((cpe) => ({
      ...cpe,
      existe: existentesSet.has(cpe.serieNumero),
      mensaje: existentesSet.has(cpe.serieNumero)
        ? 'Comprobante válido en el sistema'
        : 'Este comprobante no existe en el sistema',
    }));

    // 5. Devolvemos la respuesta consolidada
    return {
      success: true,
      message: 'Validación completada',
      data: resultados,
    };
  }
}
