import { IUserPayload } from "src/adapter/decorator/user.decorator.interface";
import { ICreateAuditoriaLog } from "src/domain/core/logs/dto/create.request.auditoria-logs";

  // 👇 Método privado reutilizable dentro del servicio
  export function buildLogData(params: {
    tablaAfectada: string;
    accion: 'INSERT' | 'UPDATE' | 'DELETE' | 'ANULACION' | string;
    valoresAnteriores?: any;
    valoresNuevos?: any;
    usuario: IUserPayload;
    idRegistro?: number;
    entorno?: string;
    observacion?: string;
    aplicacionOrigen?: string;
    sucursalId?:number
  }):  ICreateAuditoriaLog {
    return {
      tablaAfectada: params.tablaAfectada,
      registroId: params?.idRegistro ?? 0,
      accion: params?.accion,
      valoresAnteriores: params?.valoresAnteriores ?? null,
      valoresNuevos: params?.valoresNuevos ?? null,
      usuarioId: params?.usuario?.userId,
      nombreUsuario: params?.usuario?.nombre,
      entorno: params?.entorno ?? 'BETA',
      observacion: params?.observacion ?? '',
      aplicacionOrigen: params?.aplicacionOrigen ?? '',
      sucursalId: params?.sucursalId ?? 0,
    };
  }