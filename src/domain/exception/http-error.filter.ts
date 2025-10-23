import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      // status = exception.getStatus();
      // const errorResponse = exception.getResponse();
      // message = (errorResponse as any).message || exception.message || message;
      if (exception instanceof HttpException) {
        status = exception.getStatus();
        const errorResponse = exception.getResponse();
        if (typeof errorResponse === 'object') {
          // si ya traes { code, message, detalle }
          return response.status(status).json({
            success: false,
            statusCode: status,
            path: request.url,
            timestamp: new Date().toISOString(),
            ...errorResponse, // 🔹 mezcla el payload completo
          });
        } else {
          message = errorResponse as string;
        }
      }
    } else if (exception instanceof QueryFailedError) {
      // 🔹 Errores SQL de TypeORM
      const sqlError: any = exception;
      status = HttpStatus.BAD_REQUEST;
      if (sqlError.code === 'ER_DUP_ENTRY') {
        message = sqlError.message;
      } else if (sqlError.code === 'ER_NO_REFERENCED_ROW_2') {
        message = 'Violación de clave foránea';
      } else {
        message = sqlError.message;
      }
      switch (sqlError.code) {
        case 'ER_DUP_ENTRY':
          message = buildDuplicateMessage(sqlError);
          break;
        case 'ER_NO_REFERENCED_ROW_2':
          message = 'Violación de clave foránea';
          break;
        default:
          message = sqlError?.message;
          break;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    } else {
      const err: any = exception;
      if (err.http_code && err.message) {
        status = err.http_code;
        message = `Cloudinary error: ${err.message}`;
      } else {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
      }
    }
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}

export function buildDuplicateMessage(sqlError: any): string {
  // Tomar el campo serie armada que setea tu aplicación
  if (sqlError.message.includes('comprobantes')) {
    return 'Ya existe un comprobante registrado en esta sucursal con la misma serie. Por favor, comunícate con ssu proveedor para solucionarlo.';
  }

  if (sqlError.message.includes('resumen_boletas')) {
    return 'Ya existe un resumen diario registrado en esta sucursal con la misma fecha y número correlativo. Por favor, comunícate con su proveedor para solucionarlo.';
  }

  if (sqlError.message.includes('baja_comprobante')) {
    return 'Ya existe una comunicación de baja registrada en esta sucursal con la misma fecha y número correlativo. Por favor, comunícate con su proveedor para solucionarlo.';
  }
  if (sqlError.message.includes('sucursal.sub_dominio_UNIQUE')) {
    return 'El dominio ingresado ya está asociado a otra sucursal registrada. Por favor, utiliza un dominio diferente o comunícate con el administrador del sistema para resolver el conflicto.';
  }
  if (sqlError.message.includes('empresas.ruc')) {
    return 'El RUC ingresado ya se encuentra registrado en otra empresa o sucursal. Por favor, verifica la información e intenta nuevamente, o comunícate con el administrador del sistema para resolver el conflicto.';
  }

  return 'Ya existe un registro duplicado';
}
