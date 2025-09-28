import { BadRequestException } from '@nestjs/common';
import { ConprobanteRepository } from 'src/domain/comprobante/comprobante.repository';
import { CpeDto } from 'src/domain/comprobante/dto/cpe/ConsultarLoteCpeDto';
import { ErrorMapper } from 'src/domain/mapper/ErrorMapper';
import { CreateSunatLogDto } from 'src/domain/sunat-log/interface/sunat.log.interface';
import { SunatLogRepository } from 'src/domain/sunat-log/SunatLog.repository';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import pLimit from 'p-limit';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { EmpresaInternaResponseDto } from 'src/domain/empresa/dto/EmpresaInternaResponseDto';
import { ISucursalRepository } from 'src/domain/sucursal/sucursal.repository';
export class CpeValidadoDto extends CpeDto {
  existe: boolean;
  mensaje: string;
}

export class GetStatusValidateCpeUseCase {
  private readonly username: string;
  private readonly password: string;
  constructor(
    private readonly sunatService: SunatService,
    private readonly sunatLogRepo: SunatLogRepository,
    private readonly comprobanteRepo: ConprobanteRepository,
    private readonly sucursalRepo: ISucursalRepository,
  ) {
    this.username = process.env.SUNAT_USER || '20000000001MODDATOS'; // pruebas
    this.password = process.env.SUNAT_PASSWORD || 'moddatos'; // pruebas
  }

  async execute(data: CpeDto, empresaId: number, sucursalId: number): Promise<any> {
    //IResponseSunat
    try {
      // 1 validacion de comprobantes
      // const usuario = '20600887735SOROVECA'
      // const passwrod = 'ambitinbe'
      const sucursal = (await this.sucursalRepo.findSucursalInterna( empresaId, sucursalId));

      if (!sucursal) {
        throw new BadRequestException(
          'No se ha encontrado una sucursal asociada al identificador obtenido del token de autenticación.',
        );
      }
      const empresa = sucursal.empresa as EmpresaInternaResponseDto
      const usuarioSecundario = empresa?.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(
        empresa.claveSolSecundario ?? '',
      );
      const resultado = await this.sunatService.getStatusCpe(
        data,
        usuarioSecundario,
        claveSecundaria,
      );
      return resultado;
      //const rspValidateComp = await this.validarYConsultar(data, empresaId);
      ///const limit = pLimit(5); // máximo 5 consultas en paralelo

      // const tareas = rspValidateComp.data.map((cpe) =>
      //   limit(async () => {
      //     if (!cpe.existe) {
      //       return {
      //         ...cpe,
      //         estado: '99',
      //         descripcion: 'No existe en el sistema, no se consultó SUNAT',
      //       };
      //     }
      //     const resultado = await this.sunatService.consultarCpe(cpe);
      //     return { ...cpe, ...resultado };
      //   }),
      // );
      //const resultados = await Promise.all(tareas);
      //return resultados;
      return '';
    } catch (error: any) {
      throw error;
    }
  }
  private async procesarErrorResumen(
    error: any,
    resumendIdBd: number,
    sucursalId: number,
    serie: string,
    xmlFirmado: string,
  ) {
    const rspError = ErrorMapper.mapError(error, {
      sucursalId,
      tipo: 'RC', // Resumen
      serie,
    });

    if (rspError.tipoError === OrigenErrorEnum.SUNAT) {
      const obj = rspError.create as CreateSunatLogDto;
      obj.codigoResSunat = JSON.parse(obj.response ?? '')?.code;
      obj.resumenId = resumendIdBd;
      obj.serie = serie;
      obj.request = xmlFirmado;
      obj.sucursalId = sucursalId;
      ((obj.intentos = 0), // esto cambiar cuando este ok
        (obj.usuarioEnvio = 'DEYVISGC')); // esto cambiar cuando este ok
      obj.fechaRespuesta = new Date();
      await this.sunatLogRepo.save(obj);
    }
  }
  private async validarYConsultar(dto: CpeDto, empresaId: number) {
    // 1. Validar que todos sean del mismo tipo
    // const tipos = new Set(dto.cpes.map((c) => c.tipo));
    // if (tipos.size > 1) {
    //   throw new BadRequestException(
    //     'Todos los comprobantes deben ser del mismo tipo (ej. solo facturas o solo boletas).',
    //   );
    // }
    // // 2. Armamos el array de serieNumero desde el DTO
    // const seriesCorrelativos = dto.cpes.map((dt: CpeDto) => dt.serieNumero);
    // // 3. Consultamos en la BD los comprobantes que existen
    // const comprobantes =
    //   await this.comprobanteRepo.findByEmpresaAndSerieCorrelativos(
    //     empresaId,
    //     seriesCorrelativos,
    //   );
    // // Pasamos a un Set para búsqueda rápida
    // const existentesSet = new Set(comprobantes.map((c) => c.serieCorrelativo));
    // // 4. Construimos el array final con estado
    // const resultados: CpeValidadoDto[] = dto.cpes.map((cpe) => ({
    //   ...cpe,
    //   existe: existentesSet.has(cpe.serieNumero),
    //   mensaje: existentesSet.has(cpe.serieNumero)
    //     ? 'Comprobante válido en el sistema'
    //     : 'Este comprobante no existe en el sistema',
    // }));
    // // 5. Devolvemos la respuesta consolidada
    // return {
    //   success: true,
    //   message: 'Validación completada',
    //   data: resultados,
    // };
  }
}
