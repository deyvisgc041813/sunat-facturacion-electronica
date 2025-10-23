import { ErrorMapper } from 'src/domain/mapper/error-exception.mapper';
import { SunatService } from 'src/infrastructure/sunat/send/sunat.service';
import { OrigenErrorEnum } from 'src/util/OrigenErrorEnum';
import pLimit from 'p-limit';
import { CryptoUtil } from 'src/util/CryptoUtil';
import { CpeDto } from 'src/domain/tenant/comprobante/dto/cpe/consultar-lote.cpe.dto';
import { SunatLogRepository } from 'src/domain/tenant/sunat-log/port/sunat-log.repository.port';
import { ConprobanteRepository } from 'src/domain/tenant/comprobante/comprobante.repository';
import { ISucursalRepository } from 'src/domain/parent/sucursal/ports/sucursal.repository';
import { CreateSunatLogDto } from 'src/domain/tenant/sunat-log/interface/sunat.log.interface';
import { BusinessLogicException } from 'src/adapter/web/exception/exeception-dynamic';
import { EmpresaResponseDto } from 'src/domain/parent/empresa/dto/external.response.dto';
import { EmpresaCredencialesInternaResponseDto } from 'src/domain/parent/empresa/dto/credenciales-sunat.response.dto';
import { EstadoCredencialEmpresaSunat } from 'src/util/estado.enum';
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

  async execute(
    data: CpeDto,
    empresaId: number,
    sucursalId: number,
  ): Promise<any> {
    //IResponseSunat
    try {
      // 1 validacion de comprobantes
      // const usuario = '20600887735SOROVECA'
      // const passwrod = 'ambitinbe'
      const sucursal = await this.sucursalRepo.findSucursalInterna(
        empresaId,
        sucursalId,
      );

      if (!sucursal) {
        throw new BusinessLogicException(
          'No se ha encontrado una sucursal asociada al identificador obtenido del token de autenticación.',
        );
      }
      const empresa = sucursal.empresa as EmpresaResponseDto;
      const credencial = empresa.credenciales.find(
        (cr: EmpresaCredencialesInternaResponseDto) =>
          EstadoCredencialEmpresaSunat.VIGENTE === cr?.base?.estado,
      ) as EmpresaCredencialesInternaResponseDto;
      const usuarioSecundario = credencial?.base.usuarioSolSecundario ?? '';
      const claveSecundaria = CryptoUtil.decrypt(  credencial.claveSolSecundario ?? '');
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

    if (rspError?.tipoError === OrigenErrorEnum.SUNAT) {
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
