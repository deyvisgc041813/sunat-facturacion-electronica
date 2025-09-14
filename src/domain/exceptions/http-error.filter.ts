import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
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
      status = exception.getStatus();
      const errorResponse = exception.getResponse();
      message =
        (errorResponse as any).message || exception.message || message;
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
    } else if (exception instanceof Error) {
      // Otros errores genéricos
      message = exception.message;
    }
    //console.log(message)
    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
