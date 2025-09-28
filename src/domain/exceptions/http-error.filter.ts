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
      // Otros errores genéricos
      message = exception.message;
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

  return 'Ya existe un registro duplicado';
}
